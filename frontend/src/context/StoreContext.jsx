import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as api from '../services/api';
import { useAuth } from './AuthContext';
import { safeReadJson, safeWriteJson } from '../utils/safeStorage';

// ─── StoreContext ─────────────────────────────────────────────────────────────
// Manages cart and wishlist for the logged-in user.
//
// Key design decisions:
//
//  1. User-scoped automatically — no more userId parameter on every call.
//     The context reads useAuth() and clears data on logout.
//
//  2. Flat arrays — cartItems[] and wishlistItems[] instead of ByUser maps.
//     This matches what the backend returns and is simpler to consume.
//
//  3. Dual-mode (same IS_BACKEND_ENABLED flag as AuthContext):
//     - Mock mode → reads/writes localStorage keyed by user.id (same behavior
//       as before, just now without userId in the public API).
//     - API mode → seeds from server on login, optimistic updates on mutation.
//
//  4. Optimistic updates → mutation applied locally first, then API call.
//     On error: previous state is restored (rollback).
//
// Cart item shape:    { productId, size, quantity, name, price, image }
// Wishlist item shape:{ productId, name, price, image, category }
// ─────────────────────────────────────────────────────────────────────────────

const StoreContext = createContext(null);
const CART_STORAGE_KEY = 'fitsy-store-cart';
const WISHLIST_STORAGE_KEY = 'fitsy-store-wishlist';
const IS_BACKEND_ENABLED = Boolean(import.meta.env.VITE_API_URL);

export function StoreProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // ─── Seed data when auth state changes ────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setCartItems([]);
      setWishlistItems([]);
      return;
    }

    if (!IS_BACKEND_ENABLED) {
      // Mock mode: read from localStorage (keyed by user.id for multi-account)
      const allCart = safeReadJson(CART_STORAGE_KEY, {});
      const allWishlist = safeReadJson(WISHLIST_STORAGE_KEY, {});
      setCartItems(allCart[user.id] || []);
      setWishlistItems(allWishlist[user.id] || []);
      return;
    }

    // API mode: fetch from server
    let isMounted = true;
    (async () => {
      setCartLoading(true);
      setWishlistLoading(true);
      const [cartRes, wishlistRes] = await Promise.all([api.cart.get(), api.wishlist.get()]);
      if (!isMounted) return;
      if (!cartRes.error) setCartItems(cartRes.data?.items || []);
      if (!wishlistRes.error) setWishlistItems(wishlistRes.data?.items || []);
      setCartLoading(false);
      setWishlistLoading(false);
    })();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user?.id]);

  // ─── Local persistence helpers (mock mode only) ────────────────────────────
  function persistCartLocal(nextItems) {
    if (!user || IS_BACKEND_ENABLED) return;
    const all = safeReadJson(CART_STORAGE_KEY, {});
    safeWriteJson(CART_STORAGE_KEY, { ...all, [user.id]: nextItems });
  }

  function persistWishlistLocal(nextItems) {
    if (!user || IS_BACKEND_ENABLED) return;
    const all = safeReadJson(WISHLIST_STORAGE_KEY, {});
    safeWriteJson(WISHLIST_STORAGE_KEY, { ...all, [user.id]: nextItems });
  }

  // ─── Cart actions ──────────────────────────────────────────────────────────
  async function addToCart({ product, size }) {
    const productId = product.id || product._id;
    const prevItems = cartItems;
    const existing = cartItems.find((i) => i.productId === productId && i.size === size);

    const nextItems = existing
      ? cartItems.map((i) =>
          i.productId === productId && i.size === size
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        )
      : [
          ...cartItems,
          {
            productId: productId,
            size,
            quantity: 1,
            name: product.name,
            price: product.price,
            image: product.image,
          },
        ];

    // Optimistic update
    setCartItems(nextItems);
    persistCartLocal(nextItems);

    if (IS_BACKEND_ENABLED) {
      const { error } = await api.cart.add(productId, size);
      if (error) {
        setCartItems(prevItems); // rollback
        persistCartLocal(prevItems);
      }
    }
  }

  async function removeFromCart({ productId, size }) {
    const prevItems = cartItems;
    const nextItems = cartItems.filter((i) => !(i.productId === productId && i.size === size));

    setCartItems(nextItems);
    persistCartLocal(nextItems);

    if (IS_BACKEND_ENABLED) {
      const { error } = await api.cart.remove(productId, size);
      if (error) {
        setCartItems(prevItems);
        persistCartLocal(prevItems);
      }
    }
  }

  async function updateCartQuantity({ productId, size, quantity }) {
    if (quantity <= 0) {
      await removeFromCart({ productId, size });
      return;
    }

    const prevItems = cartItems;
    const nextItems = cartItems.map((i) =>
      i.productId === productId && i.size === size ? { ...i, quantity } : i
    );

    setCartItems(nextItems);
    persistCartLocal(nextItems);

    if (IS_BACKEND_ENABLED) {
      const { error } = await api.cart.update(productId, size, quantity);
      if (error) {
        setCartItems(prevItems);
        persistCartLocal(prevItems);
      }
    }
  }

  async function clearCartLocal() {
    setCartItems([]);
    persistCartLocal([]);
    // Issue 2 fix: also clear on the backend so the cart doesn't
    // reappear on page refresh (backend is the source of truth in API mode)
    if (IS_BACKEND_ENABLED) {
      await api.cart.clear();
    }
  }

  // ─── Wishlist actions ──────────────────────────────────────────────────────
  async function toggleWishlist({ product }) {
    const productId = product.id || product._id;
    const prevItems = wishlistItems;
    const exists = wishlistItems.some((i) => i.productId === productId);

    const nextItems = exists
      ? wishlistItems.filter((i) => i.productId !== productId)
      : [
          ...wishlistItems,
          {
            productId: productId,
            name: product.name,
            price: product.price,
            image: product.image,
            category: product.category,
          },
        ];

    setWishlistItems(nextItems);
    persistWishlistLocal(nextItems);

    if (IS_BACKEND_ENABLED) {
      const { error } = await api.wishlist.toggle(productId);
      if (error) {
        setWishlistItems(prevItems);
        persistWishlistLocal(prevItems);
      }
    }
  }

  const value = useMemo(
    () => ({
      cartItems,
      wishlistItems,
      cartLoading,
      wishlistLoading,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCartLocal,
      toggleWishlist,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cartItems, wishlistItems, cartLoading, wishlistLoading],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within StoreProvider');
  }
  return context;
}
