import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as api from '../services/api';
import { CATEGORIES, PRODUCTS, getProductById as staticGetById } from '../data/products';

// ─── ProductsContext ──────────────────────────────────────────────────────────
// Single source of truth for the product catalog.
//
// When VITE_API_URL is set → fetches from GET /api/products on mount.
// When not set (or fetch fails) → silently falls back to the static PRODUCTS
// array from data/products.js. The UI never breaks regardless.
//
// Consumers: Home, Catalog, ProductPage, AccountPage (via useProducts hook).
// ─────────────────────────────────────────────────────────────────────────────

const ProductsContext = createContext(null);
const IS_BACKEND_ENABLED = Boolean(import.meta.env.VITE_API_URL);

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState(PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!IS_BACKEND_ENABLED) return;

    let isMounted = true;

    (async () => {
      setLoading(true);
      const { data, error: apiError } = await api.products.getAll();

      if (!isMounted) return;

      setLoading(false);

      if (apiError) {
        // Non-fatal: log the error but keep the static fallback in place
        setError(apiError);
        console.warn('[ProductsContext] API fetch failed, using static catalog:', apiError);
        return;
      }

      if (data?.products?.length) {
        setProducts(data.products);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Finds a product by id. Handles both:
   *   - numeric id (static catalog, generated from blueprint index)
   *   - string _id (MongoDB ObjectId returned by the backend)
   */
  function getProductById(id) {
    if (!id) return undefined;
    return (
      products.find((p) => p.id === Number(id) || p._id === String(id)) ||
      staticGetById(id)
    );
  }

  /** Derive categories from whatever product set is active */
  const categories = useMemo(
    () =>
      IS_BACKEND_ENABLED && products !== PRODUCTS
        ? ['All', ...new Set(products.map((p) => p.category))]
        : CATEGORIES,
    [products],
  );

  const value = useMemo(
    () => ({ products, categories, loading, error, getProductById }),
    [products, categories, loading, error],
  );

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}

export function useProducts() {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error('useProducts must be used within ProductsProvider');
  }
  return context;
}
