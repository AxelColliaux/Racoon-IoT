const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const TOKEN_KEY = 'sp_token';
const USER_KEY = 'sp_user';

/** Store token + username after login/register */
export function saveAuth(token, username) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, username);
}

/** Remove stored credentials (logout) */
export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/** Get the current JWT (or null) */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/** Get the logged-in username (or null) */
export function getUsername() {
  return localStorage.getItem(USER_KEY);
}

/** true when a token is stored */
export function isAuthenticated() {
  return !!getToken();
}

/**
 * Wrapper around fetch that injects the Authorization header.
 * Falls back to normal fetch when no token is stored.
 */
export async function authFetch(url, options = {}) {
  const token = getToken();
  const headers = { ...options.headers };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(url, { ...options, headers });

  // Auto-logout on 401/403 (expired/invalid token)
  if (res.status === 401 || res.status === 403) {
    clearAuth();
    window.location.reload();
  }

  return res;
}

/** POST /api/auth/login */
export async function login(username, password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  saveAuth(data.token, data.username);
  return data;
}

/** POST /api/auth/register */
export async function register(username, password) {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  saveAuth(data.token, data.username);
  return data;
}
