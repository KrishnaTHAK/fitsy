import { createContext, useContext, useMemo, useState } from 'react';
import * as api from '../services/api';
import { clearToken, setToken } from '../services/tokenStore';
import { safeReadJson, safeStorageClearAll, safeStorageRemove, safeWriteJson } from '../utils/safeStorage';

const AuthContext = createContext(null);
const USER_STORAGE_KEY = 'fitsy-auth-user';
const USERS_STORAGE_KEY = 'fitsy-auth-users';
const IS_BACKEND_ENABLED = true;

const DEFAULT_DEMO_USERS = [
  { id: 1, name: 'Admin User', email: 'admin@fitsy.com', password: 'admin123', isAdmin: true },
  { id: 2, name: 'Alex Johnson', email: 'alex.johnson@example.com', password: 'password123', isAdmin: false }
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => safeReadJson(USER_STORAGE_KEY, null));
  const [users, setUsers] = useState(() => safeReadJson(USERS_STORAGE_KEY, DEFAULT_DEMO_USERS));
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
    // Check registered users or default demo list
    let matchedUser = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
    );

    // Fallback: Auto-allow demo login if using default demo credentials
    if (!matchedUser) {
      const demoAccount = DEFAULT_DEMO_USERS.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );
      if (demoAccount) {
        matchedUser = demoAccount;
        persistUsers([...users, demoAccount]);
      }
    }

    if (!matchedUser) {
      return {
        success: false,
        message: 'No account matched those credentials. Please sign up first or try again.',
      };
    }

    const sessionUser = {
      id: matchedUser.id,
      name: matchedUser.name,
      email: matchedUser.email,
      isAdmin: Boolean(matchedUser.isAdmin || matchedUser.email.toLowerCase() === 'admin@fitsy.com'),
      shippingAddresses: matchedUser.shippingAddresses || [],
    };
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

    const isAdmin = email.toLowerCase() === 'admin@fitsy.com';
    const nextUser = { id: Date.now(), name, email, password, isAdmin };
    persistUsers([...users, nextUser]);

    const sessionUser = { id: nextUser.id, name: nextUser.name, email: nextUser.email, isAdmin };
    persistUserSession(sessionUser);
    return { success: true, user: sessionUser };
  }

  // ─── Public API: login ───────────────────────────────────────────────────────
  async function login(credentials) {
    setLoading(true);
    setError(null);

    // Try real API first
    const { data, error: apiError } = await api.auth.login(credentials);

    if (apiError) {
      // Seamlessly fallback to local mock if server has any issue or if demo credentials
      const fallbackResult = mockLogin(credentials);
      if (fallbackResult.success) {
        setLoading(false);
        return fallbackResult;
      }

      setLoading(false);
      setError(apiError);
      return { success: false, message: apiError };
    }

    if (data?.token) {
      setToken(data.token);
    }

    const sessionUser = {
      id: data.user._id,
      name: data.user.name,
      email: data.user.email,
      isAdmin: Boolean(data.user.isAdmin || data.user.email?.toLowerCase() === 'admin@fitsy.com'),
      shippingAddresses: data.user.shippingAddresses || [],
    };
    persistUserSession(sessionUser);
    setLoading(false);
    return { success: true, user: sessionUser };
  }

  // ─── Public API: register ────────────────────────────────────────────────────
  async function register(payload) {
    setLoading(true);
    setError(null);

    const { data, error: apiError } = await api.auth.register(payload);

    if (apiError) {
      // Seamlessly fallback to local mock on server error
      const fallbackResult = mockRegister(payload);
      if (fallbackResult.success) {
        setLoading(false);
        return fallbackResult;
      }

      setLoading(false);
      setError(apiError);
      return { success: false, message: apiError };
    }

    if (data?.token) {
      setToken(data.token);
    }

    const sessionUser = {
      id: data.user._id,
      name: data.user.name,
      email: data.user.email,
      isAdmin: Boolean(data.user.isAdmin || data.user.email?.toLowerCase() === 'admin@fitsy.com'),
      shippingAddresses: data.user.shippingAddresses || [],
    };
    persistUserSession(sessionUser);
    setLoading(false);
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
    clearToken();
    try {
      await api.auth.logout();
    } catch {
      // Ignore
    }
    // Preserve persistent account + cart/wishlist state for the same user.
    // Only end the active session.
    const theme = localStorage.getItem('fitsy-theme');
    safeStorageRemove(USER_STORAGE_KEY);
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
