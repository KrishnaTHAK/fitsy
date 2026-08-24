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
//     - API mode → seeds from server on login, optimistic updates on mutation,
//       then reconciles with server response to stay in sync.
//
//  4. After each successful backend mutation the context adopts the server's
//     authoritative items array (not the local optimistic value). This prevents
//     quantity drift / doubling on page refresh.
//
// Cart item shape:    { productId, size, quantity, name, price, image }
// Wishlist item shape:{ productId, name, price, image, category }
// ─────────────────────────────────────────────────────────────────────────────

const StoreContext = createContext(null);
const CART_STORAGE_KEY = 'fitsy-store-cart';
const WISHLIST_STORAGE_KEY = 'fitsy-store-wishlist';
const IS_BACKEND_ENABLED = Boolean(import.meta.env.VITE_API_URL);

// Coerce any productId value (ObjectId string, number, etc.) to a plain string
// so that === comparisons are reliable across static catalog (numeric ids) and
// backend responses (MongoDB ObjectId strings).
const toStr = (v) => String(v ?? '');

export function StoreProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [cartError, setCartError] = useState(null);
  const [wishlistError, setWishlistError] = useState(null);

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
    const productId = toStr(product.id || product._id);
    const prevItems = cartItems;
    setCartError(null);

    // Build optimistic next state
    const existing = cartItems.find(
      (i) => toStr(i.productId) === productId && i.size === size,
    );

    const nextItems = existing
      ? cartItems.map((i) =>
        toStr(i.productId) === productId && i.size === size
          ? { ...i, quantity: i.quantity + 1 }
          : i,
      )
      : [
        ...cartItems,
        {
          productId,
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
      const { data, error } = await api.cart.add(productId, size);
      if (error) {
        // Rollback on failure
        setCartItems(prevItems);
        persistCartLocal(prevItems);
        setCartError(error);
      } else if (data?.items) {
        // Adopt the server's authoritative state (prevents quantity drift on refresh)
        setCartItems(data.items);
      }
    }
  }

  async function removeFromCart({ productId, size }) {
    const pid = toStr(productId);
    const prevItems = cartItems;
    const nextItems = cartItems.filter(
      (i) => !(toStr(i.productId) === pid && i.size === size),
    );
    setCartError(null);

    setCartItems(nextItems);
    persistCartLocal(nextItems);

    if (IS_BACKEND_ENABLED) {
      const { data, error } = await api.cart.remove(pid, size);
      if (error) {
        setCartItems(prevItems);
        persistCartLocal(prevItems);
        setCartError(error);
      } else if (data?.items) {
        setCartItems(data.items);
      }
    }
  }

  async function updateCartQuantity({ productId, size, quantity }) {
    if (quantity <= 0) {
      await removeFromCart({ productId, size });
      return;
    }

    const pid = toStr(productId);
    const prevItems = cartItems;
    const nextItems = cartItems.map((i) =>
      toStr(i.productId) === pid && i.size === size ? { ...i, quantity } : i,
    );
    setCartError(null);

    setCartItems(nextItems);
    persistCartLocal(nextItems);

    if (IS_BACKEND_ENABLED) {
      const { data, error } = await api.cart.update(pid, size, quantity);
      if (error) {
        setCartItems(prevItems);
        persistCartLocal(prevItems);
        setCartError(error);
      } else if (data?.items) {
        setCartItems(data.items);
      }
    }
  }

  async function clearCartLocal() {
    setCartItems([]);
    persistCartLocal([]);
    setCartError(null);
    // Also clear on the backend so the cart doesn't reappear on page refresh
    // (backend is the source of truth in API mode)
    if (IS_BACKEND_ENABLED) {
      await api.cart.clear();
    }
  }

  // ─── Wishlist actions ──────────────────────────────────────────────────────
  async function toggleWishlist({ product }) {
    const productId = toStr(product.id || product._id);
    const prevItems = wishlistItems;
    setWishlistError(null);

    const exists = wishlistItems.some((i) => toStr(i.productId) === productId);

    const nextItems = exists
      ? wishlistItems.filter((i) => toStr(i.productId) !== productId)
      : [
        ...wishlistItems,
        {
          productId,
          name: product.name,
          price: product.price,
          image: product.image,
          category: product.category,
        },
      ];

    setWishlistItems(nextItems);
    persistWishlistLocal(nextItems);

    if (IS_BACKEND_ENABLED) {
      const { data, error } = await api.wishlist.toggle(productId);
      if (error) {
        setWishlistItems(prevItems);
        persistWishlistLocal(prevItems);
        setWishlistError(error);
      } else if (data?.items) {
        // Adopt server authoritative state
        setWishlistItems(data.items);
      }
    }
  }

  const value = useMemo(
    () => ({
      cartItems,
      wishlistItems,
      cartLoading,
      wishlistLoading,
      cartError,
      wishlistError,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCartLocal,
      toggleWishlist,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cartItems, wishlistItems, cartLoading, wishlistLoading, cartError, wishlistError],
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
