/**
 * api.js
 *
 * Configured Axios instance used by every service.
 * - Attaches JWT Bearer token from stored session on every request.
 * - On 401, clears session and redirects to /login.
 */

import axios from 'axios';

const SESSION_KEY = 'socialpilot_current_user';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

/** Read the stored JWT token (rememberedMe in localStorage, else sessionStorage). */
function getToken() {
  const raw =
    localStorage.getItem(SESSION_KEY) ||
    sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw)?.token ?? null;
  } catch {
    return null;
  }
}

// ── Request interceptor: inject Authorization header ─────────────
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor: handle 401 globally ────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_KEY);
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

export default api;
