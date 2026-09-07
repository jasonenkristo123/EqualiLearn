"use client";

import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { clearToken } from "@/shared/lib/token";
import type { LoginInput, RegisterInput } from "../schema/auth.schema";
import {
  GOOGLE_LOGIN_PATH,
  type GoogleCallbackParams,
  googleCallbackRequest,
  loginRequest,
  registerRequest,
} from "../service/auth.service";

const REDIRECT_AFTER_AUTH = "/dashboard";

/** Best-effort human-readable message from an API error. */
export function getApiErrorMessage(
  error: unknown,
  fallback = "Terjadi kesalahan. Silakan coba lagi.",
): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as
      | { message?: string; error?: string; errors?: Record<string, string[]> }
      | undefined;
    const firstFieldError = data?.errors
      ? Object.values(data.errors)[0]?.[0]
      : undefined;
    return (
      data?.message ??
      data?.error ??
      firstFieldError ??
      error.message ??
      fallback
    );
  }
  return fallback;
}

export function useLogin() {
  const router = useRouter();
  return useMutation({
    mutationFn: (input: LoginInput) =>
      loginRequest({ email: input.email, password: input.password }),
    // Token is written to the cookie by the axios response interceptor.
    onSuccess: () => {
      toast.success("Berhasil masuk. Mengalihkan…");
      router.replace(REDIRECT_AFTER_AUTH);
    },
  });
}

export function useRegister() {
  const router = useRouter();
  return useMutation({
    mutationFn: (input: RegisterInput) => registerRequest(input),
    onSuccess: () => {
      toast.success("Akun berhasil dibuat. Selamat datang!");
      router.replace(REDIRECT_AFTER_AUTH);
    },
  });
}

export function useGoogleCallback() {
  const router = useRouter();
  return useMutation({
    mutationFn: (params: GoogleCallbackParams) => googleCallbackRequest(params),
    onSuccess: () => {
      toast.success("Berhasil masuk dengan Google.");
      router.replace(REDIRECT_AFTER_AUTH);
    },
  });
}

export function useLogout() {
  const router = useRouter();
  return () => {
    clearToken();
    router.replace("/login");
  };
}

/** Kick off Google OAuth via a full-page navigation to the API. */
export function startGoogleLogin(): void {
  window.location.href = GOOGLE_LOGIN_PATH;
}
