"use client";

import Cookies from "js-cookie";
import { TOKEN_COOKIE, TOKEN_MAX_AGE_DAYS } from "./auth-cookie";

export function getToken(): string | undefined {
  return Cookies.get(TOKEN_COOKIE);
}

export function setToken(token: string): void {
  Cookies.set(TOKEN_COOKIE, token, {
    expires: TOKEN_MAX_AGE_DAYS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export function clearToken(): void {
  Cookies.remove(TOKEN_COOKIE, { path: "/" });
}
