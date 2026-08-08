// ─── Centralized API Client ───────────────────────────────────────────────────
// All backend communication goes through this module. Components and contexts
// never call fetch() directly — they import from here.
//
// BASE_URL: Read from VITE_API_URL env variable.
//   - When set (e.g. http://localhost:5000/api) → requests go to that host.
//   - When empty → requests use relative URLs (/api/...) which the Vite dev
//     proxy forwards to http://localhost:5000. Production should always set
//     VITE_API_URL at build time.
//
// Return shape: always { data, error } — never throws. Callers decide how to
// handle errors; no uncaught promise rejections.
// ─────────────────────────────────────────────────────────────────────────────

import { clearToken, getToken } from './tokenStore';

const BASE_URL = import.meta.env.VITE_API_URL || '';

// ─── Core request helper ──────────────────────────────────────────────────────
async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: 'include', // Important: sends cookies with request
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : null;

    if (!response.ok) {
      return { data: null, error: data?.message || `Request failed (${response.status})` };
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err?.message || 'Network error — is the server running?' };
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
// Expected responses:
//   login/register → { token: string, user: { _id, name, email } }
//   logout         → { message: string }
//   me             → { user: { _id, name, email } }
export const auth = {
  login: (credentials) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),

  register: (payload) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),

  logout: () =>
    request('/auth/logout', { method: 'POST' }),

  /** Optional: restore session on page reload if httpOnly cookies are used */
  me: () =>
    request('/auth/me'),

  updateAddress: (addressData) =>
    request('/auth/address', { method: 'PUT', body: JSON.stringify(addressData) }),
};

// ─── Products ─────────────────────────────────────────────────────────────────
// Expected response: { products: Product[], total: number }
// Product shape is documented in frontend.txt Section 11.
export const products = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/products${qs ? `?${qs}` : ''}`);
  },

  getById: (id) => request(`/products/${id}`),
};

// ─── Cart ─────────────────────────────────────────────────────────────────────
// All cart endpoints return the updated items array: { items: CartItem[] }
// CartItem: { productId, size, quantity, name, price, image }
export const cart = {
  get: () =>
    request('/cart'),

  add: (productId, size, quantity = 1) =>
    request('/cart', {
      method: 'POST',
      body: JSON.stringify({ productId, size, quantity }),
    }),

  update: (productId, size, quantity) =>
    request('/cart', {
      method: 'PUT',
      body: JSON.stringify({ productId, size, quantity }),
    }),

  remove: (productId, size) =>
    request(`/cart/${productId}/${size}`, { method: 'DELETE' }),

  clear: () =>
    request('/cart', { method: 'DELETE' }),
};

// ─── Wishlist ─────────────────────────────────────────────────────────────────
// toggle endpoint adds if absent, removes if present (idempotent toggle).
// Expected response: { items: WishlistItem[], added: boolean }
// WishlistItem: { productId, name, price, image, category }
export const wishlist = {
  get: () =>
    request('/wishlist'),

  toggle: (productId) =>
    request('/wishlist/toggle', {
      method: 'POST',
      body: JSON.stringify({ productId }),
    }),
};

// ─── Orders ───────────────────────────────────────────────────────────────────
export const orders = {
  // Cash on Delivery: creates the order directly
  create: (orderData) =>
    request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    }),

  // Card / UPI: creates a Stripe PaymentIntent + pending order, returns clientSecret
  createPaymentIntent: (orderData) =>
    request('/orders/create-payment-intent', {
      method: 'POST',
      body: JSON.stringify(orderData),
    }),

  getMyOrders: () =>
    request('/orders/myorders'),
};
