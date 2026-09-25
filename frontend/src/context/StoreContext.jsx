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
const toStr = (v) => String(v ?? '');

export const DEFAULT_DEMO_CART = [];

export const DEFAULT_DEMO_WISHLIST = [];

export function StoreProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  // Bug fix: start with empty array — real data comes from localStorage or API
  // Demo cart only shows for unauthenticated guests without any saved cart
  const [cartItems, setCartItems] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [cartError, setCartError] = useState(null);

  // ─── Seed data when auth state changes ────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Keep demo defaults accessible for unauthenticated preview
      const localCart = safeReadJson(CART_STORAGE_KEY, {});
      const localWish = safeReadJson(WISHLIST_STORAGE_KEY, {});
      setCartItems(localCart['guest'] || []);
      setWishlistItems(localWish['guest'] || DEFAULT_DEMO_WISHLIST);
      return;
    }

    // Mock mode: read from localStorage (keyed by user.id for multi-account)
    const allCart = safeReadJson(CART_STORAGE_KEY, {});
    const allWishlist = safeReadJson(WISHLIST_STORAGE_KEY, {});

    // Load user's saved cart — default to empty (not demo) for real logged-in users
    setCartItems(allCart[user.id] || []);

    if (allWishlist[user.id]) {
      setWishlistItems(allWishlist[user.id]);
    } else {
      setWishlistItems(DEFAULT_DEMO_WISHLIST);
      persistWishlistLocal(DEFAULT_DEMO_WISHLIST);
    }

    // API mode: sync from server in background if reachable
    if (IS_BACKEND_ENABLED) {
      let isMounted = true;
      (async () => {
        setCartLoading(true);
        setWishlistLoading(true);
        try {
          const [cartRes, wishlistRes] = await Promise.all([api.cart.get(), api.wishlist.get()]);
          if (!isMounted) return;
          // Always adopt the server's authoritative cart (even if empty)
          if (!cartRes.error && Array.isArray(cartRes.data?.items)) {
            setCartItems(cartRes.data.items);
            persistCartLocal(cartRes.data.items);
          }
          if (!wishlistRes.error && Array.isArray(wishlistRes.data?.items) && wishlistRes.data.items.length > 0) {
            setWishlistItems(wishlistRes.data.items);
          }
        } catch {
          // Silent fallback to memory/localStorage
        } finally {
          if (isMounted) {
            setCartLoading(false);
            setWishlistLoading(false);
          }
        }
      })();

      return () => {
        isMounted = false;
      };
    }
  }, [isAuthenticated, user?.id]);

  // ─── Local persistence helpers ────────────────────────────────────────────
  function persistCartLocal(nextItems) {
    const key = user?.id || 'guest';
    const all = safeReadJson(CART_STORAGE_KEY, {});
    safeWriteJson(CART_STORAGE_KEY, { ...all, [key]: nextItems });
  }

  function persistWishlistLocal(nextItems) {
    const key = user?.id || 'guest';
    const all = safeReadJson(WISHLIST_STORAGE_KEY, {});
    safeWriteJson(WISHLIST_STORAGE_KEY, { ...all, [key]: nextItems });
  }

  // ─── Cart actions ──────────────────────────────────────────────────────────
  async function addToCart({ product, size = 'M', color = 'Default', quantity = 1 }) {
    const productId = toStr(product.id || product._id || product.productId);
    const prevItems = cartItems;

    const existing = cartItems.find(
      (i) => toStr(i.productId) === productId && i.size === size
    );

    const nextItems = existing
      ? cartItems.map((i) =>
          toStr(i.productId) === productId && i.size === size
            ? { ...i, quantity: i.quantity + quantity }
            : i
        )
      : [
          ...cartItems,
          {
            productId,
            size,
            quantity,
            name: product.name,
            price: Number(product.price),
            image: product.image,
            color: product.accent || color,
            tryOnFit: Boolean(product.vtoType || product.tryOn),
          },
        ];

    setCartItems(nextItems);
    persistCartLocal(nextItems);

    if (IS_BACKEND_ENABLED) {
      const { data, error } = await api.cart.add(productId, size, quantity);
      if (error) {
        setCartItems(prevItems); // rollback
        persistCartLocal(prevItems);
      } else if (data?.items) {
        // Adopt server-authoritative state to stay in sync
        setCartItems(data.items);
        persistCartLocal(data.items);
      }
    }
  }

  // Bug fix: accept BOTH object form { productId, size } AND positional args (productId, size)
  // so CartPage.jsx callers using either form work correctly.
  async function removeFromCart(productIdOrObj, sizeArg) {
    let productId, size;
    if (productIdOrObj && typeof productIdOrObj === 'object' && !Array.isArray(productIdOrObj)) {
      // Object destructuring form: removeFromCart({ productId, size })
      productId = toStr(productIdOrObj.productId);
      size = productIdOrObj.size;
    } else {
      // Positional form: removeFromCart(productId, size)
      productId = toStr(productIdOrObj);
      size = sizeArg;
    }

    const prevItems = cartItems;
    const nextItems = cartItems.filter(
      (i) => !(toStr(i.productId) === productId && i.size === size)
    );

    setCartItems(nextItems);
    persistCartLocal(nextItems);

    if (IS_BACKEND_ENABLED) {
      const { data, error } = await api.cart.remove(productId, size);
      if (error) {
        setCartItems(prevItems); // rollback
        persistCartLocal(prevItems);
        setCartError(error);
      } else if (data?.items) {
        setCartItems(data.items);
        persistCartLocal(data.items);
      }
    }
  }

  async function updateCartQuantity(productId, size, quantity) {
    // Bug fix: pass args correctly to removeFromCart (positional form)
    if (quantity <= 0) {
      return removeFromCart(productId, size);
    }

    const pid = toStr(productId);
    const prevItems = cartItems;
    const nextItems = cartItems.map((i) =>
      toStr(i.productId) === pid && i.size === size ? { ...i, quantity } : i
    );
    setCartError(null);

    setCartItems(nextItems);
    persistCartLocal(nextItems);

    if (IS_BACKEND_ENABLED) {
      const { data, error } = await api.cart.update(productId, size, quantity);
      if (error) {
        setCartItems(prevItems);
        persistCartLocal(prevItems);
        setCartError(error);
      } else if (data?.items) {
        // Bug fix: `data` is now properly destructured above — no phantom reference
        setCartItems(data.items);
        persistCartLocal(data.items);
      }
    }
  }

  async function clearCartLocal() {
    setCartItems([]);
    persistCartLocal([]);
    // Also clear on the backend so the cart doesn't reappear on page refresh
    if (IS_BACKEND_ENABLED) {
      try {
        await api.cart.clear();
      } catch { }
    }
  }

  // ─── Wishlist actions ──────────────────────────────────────────────────────
  async function toggleWishlist({ product }) {
    const productId = toStr(product.id || product._id || product.productId);
    const prevItems = wishlistItems;
    const exists = wishlistItems.some((i) => toStr(i.productId) === productId);

    const nextItems = exists
      ? wishlistItems.filter((i) => toStr(i.productId) !== productId)
      : [
          ...wishlistItems,
          {
            productId,
            name: product.name,
            price: Number(product.price),
            image: product.image,
            category: product.category || 'Apparel',
            description: product.description || product.accent || 'Curated designer selection',
            vtoType: product.vtoType || 'upper-body',
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

  function isInWishlist(productId) {
    return wishlistItems.some((i) => toStr(i.productId) === toStr(productId));
  }

  async function clearWishlist() {
    setWishlistItems([]);
    persistWishlistLocal([]);
  }

  // ─── Computed Totals ───────────────────────────────────────────────────────
  // Bug fix: subtotal, estimatedTax, total were deleted during merge conflict
  // resolution. CartPage.jsx and CheckoutPage.jsx depend on these values.
  const subtotal = useMemo(() => {
    return cartItems.reduce(
      (acc, item) => acc + (Number(item.price) || 0) * (Number(item.quantity) || 1),
      0
    );
  }, [cartItems]);

  const estimatedTax = useMemo(() => {
    return +(subtotal * 0.08).toFixed(2);
  }, [subtotal]);

  const total = useMemo(() => {
    return +(subtotal + estimatedTax).toFixed(2);
  }, [subtotal, estimatedTax]);

  const value = useMemo(
    () => ({
      cartItems,
      wishlistItems,
      cartLoading,
      wishlistLoading,
      cartError,
      // Computed totals — required by CartPage and CheckoutPage
      subtotal,
      estimatedTax,
      total,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart: clearCartLocal,
      clearCartLocal,
      toggleWishlist,
      isInWishlist,
      clearWishlist,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cartItems, wishlistItems, cartLoading, wishlistLoading, subtotal, estimatedTax, total],
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
