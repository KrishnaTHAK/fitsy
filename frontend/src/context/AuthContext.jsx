import { createContext, useContext, useMemo, useState } from 'react';
import * as api from '../services/api';
import { safeReadJson, safeStorageClearAll, safeStorageRemove, safeWriteJson } from '../utils/safeStorage';

// ─── AuthContext ──────────────────────────────────────────────────────────────
// Manages user session: login, register, logout.
//
// Dual-mode operation (controlled by VITE_API_URL env variable):
//
//   IS_BACKEND_ENABLED = false (no VITE_API_URL set)
//     → localStorage mock: user registry stored in 'fitsy-auth-users',
//       active session stored in 'fitsy-auth-user'. No passwords are hashed.
//       Suitable for local development without a running backend.
//
//   IS_BACKEND_ENABLED = true (VITE_API_URL is set)
//     → Calls the real API. JWT is stored via tokenStore. User registry in
//       localStorage is no longer used. On success, only the minimal session
//       object (id, name, email) is stored — never the token or password.
//
// Both modes return { success: boolean, message?: string, user?: object }
// from login() and register(), so callers (AuthPage) need no mode awareness.
// ─────────────────────────────────────────────────────────────────────────────

const AuthContext = createContext(null);
const USER_STORAGE_KEY = 'fitsy-auth-user';
const USERS_STORAGE_KEY = 'fitsy-auth-users';
const IS_BACKEND_ENABLED = Boolean(import.meta.env.VITE_API_URL);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => safeReadJson(USER_STORAGE_KEY, null));
  const [users, setUsers] = useState(() => safeReadJson(USERS_STORAGE_KEY, []));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ─── Session persistence helpers ────────────────────────────────────────────
  function persistUsers(nextUsers) {
    setUsers(nextUsers);
    safeWriteJson(USERS_STORAGE_KEY, nextUsers);
  }

  function persistUserSession(nextUser) {
    setUser(nextUser);
    if (nextUser) {
      safeWriteJson(USER_STORAGE_KEY, nextUser);
    } else {
      safeStorageRemove(USER_STORAGE_KEY);
    }
  }

  // ─── Mock auth (localStorage only) ──────────────────────────────────────────
  function mockLogin({ email, password }) {
    const matchedUser = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
    );

    if (!matchedUser) {
      return {
        success: false,
        message: 'No account matched those credentials. Please sign up first or try again.',
      };
    }

    const sessionUser = { id: matchedUser.id, name: matchedUser.name, email: matchedUser.email };
    persistUserSession(sessionUser);
    return { success: true, user: sessionUser };
  }

  function mockRegister({ name, email, password }) {
    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (existing) {
      return {
        success: false,
        message: 'An account with this email already exists. Please sign in instead.',
      };
    }

    const nextUser = { id: Date.now(), name, email, password };
    persistUsers([...users, nextUser]);

    const sessionUser = { id: nextUser.id, name: nextUser.name, email: nextUser.email };
    persistUserSession(sessionUser);
    return { success: true, user: sessionUser };
  }

  // ─── Public API: login ───────────────────────────────────────────────────────
  async function login(credentials) {
    setLoading(true);
    setError(null);

    if (!IS_BACKEND_ENABLED) {
      const result = mockLogin(credentials);
      setLoading(false);
      if (!result.success) setError(result.message);
      return result;
    }

    const { data, error: apiError } = await api.auth.login(credentials);
    setLoading(false);

    if (apiError) {
      setError(apiError);
      return { success: false, message: apiError };
    }

    const sessionUser = {
      id: data.user._id,
      name: data.user.name,
      email: data.user.email,
      isAdmin: data.user.isAdmin, // ADD THIS LINE
      shippingAddresses: data.user.shippingAddresses || [],
    };
    persistUserSession(sessionUser);
    return { success: true, user: sessionUser };
  }

  // ─── Public API: register ────────────────────────────────────────────────────
  async function register(payload) {
    setLoading(true);
    setError(null);

    if (!IS_BACKEND_ENABLED) {
      const result = mockRegister(payload);
      setLoading(false);
      if (!result.success) setError(result.message);
      return result;
    }

    const { data, error: apiError } = await api.auth.register(payload);
    setLoading(false);

    if (apiError) {
      setError(apiError);
      return { success: false, message: apiError };
    }

    const sessionUser = {
      id: data.user._id,
      name: data.user.name,
      email: data.user.email,
      isAdmin: data.user.isAdmin, // ADD THIS LINE
      shippingAddresses: data.user.shippingAddresses || [],
    };
    persistUserSession(sessionUser);
    return { success: true, user: sessionUser };
  }

  // ─── Public API: updateAddress ──────────────────────────────────────────────────────
  async function updateAddress(addressData) {
    if (!IS_BACKEND_ENABLED) {
      const currentAddresses = user?.shippingAddresses || [];
      const updatedUser = { ...user, shippingAddresses: [...currentAddresses, addressData] };
      persistUserSession(updatedUser);
      return { success: true };
    }

    const { data, error: apiError } = await api.auth.updateAddress(addressData);
    if (apiError) return { success: false, message: apiError };

    const updatedUser = { ...user, shippingAddresses: data.user.shippingAddresses };
    persistUserSession(updatedUser);
    return { success: true };
  }

  // ─── Public API: logout ──────────────────────────────────────────────────────
  async function logout() {
    if (IS_BACKEND_ENABLED) {
      // Best-effort — clear local state even if the server call fails
      // Important: The server call is required to clear the httpOnly cookie
      await api.auth.logout().catch(() => { });
    }
    // Preserve theme preference; clear everything else fitsy-prefixed
    const theme = localStorage.getItem('fitsy-theme');
    safeStorageClearAll();
    if (theme) localStorage.setItem('fitsy-theme', theme);
    persistUserSession(null);
  }

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      loading,
      error,
      login,
      register,
      logout,
      updateAddress,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, loading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
