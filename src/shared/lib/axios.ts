import axios, { type AxiosError } from "axios";
import { extractToken } from "./auth-cookie";
import { clearToken, getToken, setToken } from "./token";

export const api = axios.create({
  // Requests go through the Next.js rewrite in next.config.ts, which proxies
  // `/api/*` to NEXT_PUBLIC_BASE_API_URL — keeps calls same-origin (no CORS).
  baseURL: "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach the bearer token from the cookie to every outgoing request.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Persist a token returned by any `auth/*` endpoint; drop it on 401.
api.interceptors.response.use(
  (response) => {
    if ((response.config.url ?? "").includes("auth/")) {
      const token = extractToken(response.data);
      if (token) setToken(token);
    }
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearToken();
    }
    return Promise.reject(error);
  },
);
