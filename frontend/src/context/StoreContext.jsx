import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as api from '../services/api';
import { useAuth } from './AuthContext';
import { safeReadJson, safeWriteJson } from '../utils/safeStorage';

// ─── StoreContext ─────────────────────────────────────────────────────────────
// Manages cart and wishlist for the logged-in user with dual API + Local persistence.
// ─────────────────────────────────────────────────────────────────────────────

const StoreContext = createContext(null);
const CART_STORAGE_KEY = 'fitsy-store-cart';
const WISHLIST_STORAGE_KEY = 'fitsy-store-wishlist';
const IS_BACKEND_ENABLED = Boolean(import.meta.env.VITE_API_URL);

export const DEFAULT_DEMO_CART = [];

export const DEFAULT_DEMO_WISHLIST = [];

export function StoreProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [wishlistItems, setWishlistItems] = useState(DEFAULT_DEMO_WISHLIST);
  const [cartLoading, setCartLoading] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

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

    if (allCart[user.id]) {
      setCartItems(allCart[user.id]);
    } else {
      setCartItems([]);
      persistCartLocal([]);
    }

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
          if (!cartRes.error && Array.isArray(cartRes.data?.items) && cartRes.data.items.length > 0) {
            setCartItems(cartRes.data.items);
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
    const productId = product.id || product._id || product.productId;
    const prevItems = cartItems;
    const existing = cartItems.find((i) => (i.productId === productId || i.id === productId) && i.size === size);

    const nextItems = existing
      ? cartItems.map((i) =>
          (i.productId === productId || i.id === productId) && i.size === size
            ? { ...i, quantity: i.quantity + quantity }
            : i
        )
      : [
          ...cartItems,
          {
            productId,
            name: product.name,
            price: Number(product.price),
            image: product.image,
            size,
            color: product.accent || color,
            quantity,
            tryOnFit: Boolean(product.vtoType || product.tryOn),
          },
        ];

    setCartItems(nextItems);
    persistCartLocal(nextItems);

    if (IS_BACKEND_ENABLED) {
      try {
        await api.cart.add(productId, size, quantity);
      } catch {
        // Optimistic keep
      }
    }
  }

  async function removeFromCart(productId, size) {
    const prevItems = cartItems;
    const nextItems = cartItems.filter(
      (i) => !((i.productId === productId || i.id === productId || String(i._id) === String(productId)) && (size ? i.size === size : true))
    );

    setCartItems(nextItems);
    persistCartLocal(nextItems);

    if (IS_BACKEND_ENABLED) {
      try {
        await api.cart.remove(productId, size);
      } catch {
        setCartItems(prevItems);
        persistCartLocal(prevItems);
      }
    }
  }

  async function updateCartQuantity(productId, size, quantity) {
    if (quantity <= 0) {
      return removeFromCart(productId, size);
    }

    const prevItems = cartItems;
    const nextItems = cartItems.map((i) =>
      (i.productId === productId || i.id === productId) && i.size === size ? { ...i, quantity } : i
    );

    setCartItems(nextItems);
    persistCartLocal(nextItems);

    if (IS_BACKEND_ENABLED) {
      try {
        await api.cart.update(productId, size, quantity);
      } catch {
        setCartItems(prevItems);
        persistCartLocal(prevItems);
      }
    }
  }

  async function clearCartLocal() {
    setCartItems([]);
    persistCartLocal([]);
    if (IS_BACKEND_ENABLED) {
      try {
        await api.cart.clear();
      } catch {}
    }
  }

  // ─── Wishlist actions ──────────────────────────────────────────────────────
  async function toggleWishlist({ product }) {
    const productId = product.id || product._id || product.productId;
    const exists = wishlistItems.some((i) => i.productId === productId || i.id === productId);

    const nextItems = exists
      ? wishlistItems.filter((i) => i.productId !== productId && i.id !== productId)
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
      try {
        await api.wishlist.toggle(productId);
      } catch {}
    }
  }

  function isInWishlist(productId) {
    return wishlistItems.some((i) => i.productId === productId || i.id === productId);
  }

  async function clearWishlist() {
    setWishlistItems([]);
    persistWishlistLocal([]);
  }

  // ─── Computed Totals ───────────────────────────────────────────────────────
  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
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
