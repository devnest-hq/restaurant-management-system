import axios from "axios";
import { useAuthStore } from "../store/auth.store";
import { refreshSession } from "./refresh";
export const API_ORIGIN = import.meta.env.VITE_API_URL;

if (!API_ORIGIN) {
  throw new Error("VITE_API_URL is not set. Add it to client/.env");
}

let refreshPromise = null;

export function getRefreshPromise() {
  if (!refreshPromise) {
    refreshPromise = refreshSession().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Response interceptor - handles 401 with token refresh
api.interceptors.response.use(
  response => response,
  async (error) => {
    const originalRequest = error.config;

    // no response means a network error not auth problem
    if (!error.response) return Promise.reject(error);

    const isLoginRequest = originalRequest.url.startsWith("/auth/login");

    if (error.response.status === 401 && !originalRequest._retry && !isLoginRequest) {
      originalRequest._retry = true;

      try {
        // Attempt token refresh
        await getRefreshPromise();
        return api(originalRequest); // Retries the originalRequest request
      } catch (refreshError) {
        useAuthStore.getState().clearSession();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);