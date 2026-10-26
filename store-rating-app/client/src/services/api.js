import axios from 'axios';

const TOKEN_KEY = 'store_rating_token';

// localStorage can throw (private mode etc.), so every access is wrapped.
export const tokenStore = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* ignore */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const url = error.config?.url || '';
    const isAuthAttempt = url.includes('/auth/login') || url.includes('/auth/register');
    if (error.response?.status === 401 && !isAuthAttempt) {
      // expired / invalid token: tell the app to log out
      tokenStore.clear();
      window.dispatchEvent(new CustomEvent('auth:expired', { detail: error.response.data?.message }));
    }
    return Promise.reject(error);
  }
);

export const getErrorMessage = (error) => {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.code === 'ECONNABORTED') return 'The server took too long to respond';
  if (error.request) return 'Cannot reach the server. Check that the backend is running.';
  return 'Something went wrong';
};

export const getFieldErrors = (error) => error.response?.data?.errors || {};

/** Unwraps the { success, data, meta } envelope */
export const unwrap = (res) => ({ data: res.data.data, meta: res.data.meta });
