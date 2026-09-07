import { api } from "@/shared/lib/axios";
import type { LoginInput, RegisterInput } from "../schema/auth.schema";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

/** Loosely-typed envelope — the token is persisted by the axios interceptor. */
export interface AuthResponse {
  message?: string;
  token?: string;
  access_token?: string;
  user?: AuthUser;
  data?: {
    token?: string;
    access_token?: string;
    user?: AuthUser;
  } | null;
}

export interface GoogleCallbackParams {
  code: string;
  state: string;
}

export async function registerRequest(
  input: RegisterInput,
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("auth/register", {
    name: input.name,
    email: input.email,
    password: input.password,
    confirm_password: input.confirm_password,
  });
  return data;
}

export async function loginRequest(
  input: Pick<LoginInput, "email" | "password">,
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("auth/login", {
    email: input.email,
    password: input.password,
  });
  return data;
}

export async function googleCallbackRequest(
  params: GoogleCallbackParams,
): Promise<AuthResponse> {
  const { data } = await api.get<AuthResponse>("auth/google/callback", {
    params,
  });
  return data;
}

/**
 * Path for the top-level browser redirect that starts Google OAuth on the API.
 * Kept relative so it flows through the same `/api` proxy as every other call.
 */
export const GOOGLE_LOGIN_PATH = "/api/auth/google/login";
