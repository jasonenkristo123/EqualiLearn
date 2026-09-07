import axios, { type AxiosError } from "axios";
import { extractToken } from "./auth-cookie";
import { clearToken, getToken, setToken } from "./token";

export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
