import axios from "axios";

/**
 * Shared axios instance for the whole app.
 *
 * - Base URL is fixed to REACT_APP_BACKEND_URL so pages no longer need to
 *   redeclare `const BACKEND_URL = process.env...` locally.
 * - A request interceptor automatically attaches the admin JWT (when present
 *   in localStorage) to every outgoing request. Public endpoints ignore it
 *   safely; admin endpoints get authorized without callers having to remember
 *   to set headers manually.
 * - A response interceptor detects 401s on admin routes and clears the stale
 *   token so the caller can redirect to /admin/login.
 */

const BASE_URL = process.env.REACT_APP_BACKEND_URL;

export const ADMIN_TOKEN_KEY = "admin_token";

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
});

api.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem(ADMIN_TOKEN_KEY)
      : null;
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const isAdminRoute = (error?.config?.url || "").includes("/admin/");
    if (status === 401 && isAdminRoute) {
      // Stale/invalid token — clear it. UI code decides where to redirect.
      try {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
      } catch {
        /* storage blocked */
      }
    }
    return Promise.reject(error);
  }
);

// Convenience export for endpoints that don't need auth logic but still want
// the shared base URL (e.g., building absolute asset URLs).
export const BACKEND_URL = BASE_URL;

/**
 * Resolve a media path returned by the API against the backend origin.
 *
 * The API hands back site-relative paths like "/api/blog/posts/<id>/image".
 * In production the API and the site share an origin so those would resolve
 * anyway, but in development the backend runs elsewhere — prefixing keeps both
 * working. Absolute URLs and data URIs are passed through untouched.
 */
export const resolveApiAsset = (path) => {
  if (!path) return path;
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  return `${BASE_URL}${path}`;
};
