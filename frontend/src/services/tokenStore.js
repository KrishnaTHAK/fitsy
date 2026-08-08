// ─── Token Store (Deprecated) ──────────────────────────────────────────────────
// This module is no longer used for JWT storage because the backend now sets an
// httpOnly cookie that the browser manages automatically.
// The functions are kept temporarily to prevent breaking existing imports,
// but they no longer do anything.
// ─────────────────────────────────────────────────────────────────────────────

export function getToken() {
  return null;
}

export function setToken() {
  // No-op: backend handles cookie
}

export function clearToken() {
  // No-op: AuthContext calls /api/auth/logout which clears the cookie
}
