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

const PRODUCTS_STORAGE_KEY = 'fitsy-custom-products';

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState(PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCatalog = async () => {
    setLoading(true);
    const { data, error: apiError } = await api.products.getAll();
    setLoading(false);

    if (apiError) {
      setError(apiError);
      console.warn('[ProductsContext] API fetch failed, using static catalog:', apiError);
      return;
    }

    if (data?.products && Array.isArray(data.products) && data.products.length > 0) {
      const existingNames = new Set(data.products.map((p) => p.name.toLowerCase()));
      const remainingStatic = PRODUCTS.filter((p) => !existingNames.has(p.name.toLowerCase()));
      setProducts([...data.products, ...remainingStatic]);
    }
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!isMounted) return;
      await fetchCatalog();
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
      products.find((p) => String(p.id) === String(id) || String(p._id) === String(id)) ||
      staticGetById(id)
    );
  }

  async function addProduct(newProductData) {
    const formattedData = {
      name: newProductData.name,
      category: newProductData.category || 'Outerwear',
      price: Number(newProductData.price) || 0,
      inventory: Number(newProductData.inventory) || 0,
      badge: newProductData.badge || '',
      accent: newProductData.accent || '',
      vtoType: newProductData.vtoType || 'upper-body',
      sizes: newProductData.sizes || ['XS', 'S', 'M', 'L', 'XL'],
      image:
        newProductData.image ||
        'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=900',
      description: newProductData.description || 'Premium designer garment with virtual try-on compatibility.',
    };

    // Try API first
    const { data, error: apiError } = await api.products.create(formattedData);

    if (!apiError && data) {
      const created = data;
      setProducts((prev) => [created, ...prev]);
      return { success: true, product: created };
    }

    // Fallback to local creation if offline or demo mode
    console.warn('[ProductsContext] API create failed or offline, adding locally:', apiError);
    const localProduct = {
      ...formattedData,
      id: Date.now(),
      _id: `prod_${Date.now()}`,
      rating: 4.8,
    };
    setProducts((prev) => [localProduct, ...prev]);
    return { success: true, product: localProduct, fallback: true };
  }

  async function updateProduct(id, updatedFields) {
    const targetId = id;
    const prevProducts = [...products];

    // Optimistic local update
    setProducts((prev) =>
      prev.map((p) =>
        String(p.id) === String(targetId) || String(p._id) === String(targetId)
          ? { ...p, ...updatedFields }
          : p
      )
    );

    // Call API if product has a valid backend ID
    const { data, error: apiError } = await api.products.update(targetId, updatedFields);
    if (apiError) {
      console.warn('[ProductsContext] API update failed, preserving local state:', apiError);
    }
    return { success: !apiError, error: apiError };
  }

  async function deleteProduct(id) {
    const targetId = id;
    const prevProducts = [...products];

    // Optimistic local removal
    setProducts((prev) =>
      prev.filter((p) => String(p.id) !== String(targetId) && String(p._id) !== String(targetId))
    );

    // Call API
    const { error: apiError } = await api.products.delete(targetId);
    if (apiError) {
      console.warn('[ProductsContext] API delete failed, preserving local deletion:', apiError);
    }
    return { success: !apiError, error: apiError };
  }

  /** Derive categories from whatever product set is active */
  const categories = useMemo(() => {
    const dynamicCats = products.map((p) => p.category).filter(Boolean);
    return ['All', ...new Set([...CATEGORIES.filter((c) => c !== 'All'), ...dynamicCats])];
  }, [products]);

  const value = useMemo(
    () => ({
      products,
      categories,
      loading,
      error,
      getProductById,
      addProduct,
      updateProduct,
      deleteProduct,
      refreshProducts: fetchCatalog,
    }),
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
