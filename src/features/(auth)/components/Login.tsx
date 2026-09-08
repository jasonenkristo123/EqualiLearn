"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { getApiErrorMessage, useLogin } from "../hooks/use-auth";
import { loginSchema, toFieldErrors } from "../schema/auth.schema";
import AuthField from "./AuthField";
import AuthShell from "./AuthShell";
import AuthSubmitButton from "./AuthSubmitButton";

export default function Login() {
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const pending = login.isPending;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = loginSchema.safeParse({ email, password, remember });
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error));
      return;
    }
    setErrors({});
    login.mutate(parsed.data);
  };

  return (
    <AuthShell
      activeTab="masuk"
      pending={pending}
      googleLabel="Lanjutkan Dengan Google"
      error={login.isError ? getApiErrorMessage(login.error) : undefined}
    >
      <form onSubmit={onSubmit} noValidate className="mt-6 flex flex-col gap-4">
        <AuthField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="nama@gmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />

        <AuthField
          id="password"
          label="Kata sandi"
          type="password"
          autoComplete="current-password"
          placeholder="Masukkan kata sandi"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />

        <div className="flex items-center justify-between text-xs">
          <label className="flex cursor-pointer items-center gap-2 text-white/60">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="size-4 rounded border-white/20 bg-white/5 accent-cyan"
            />
            Ingat saya
          </label>
          <Link
            href="#"
            className="text-app-teal transition-colors hover:text-app-teal/80"
          >
            Lupa kata sandi?
          </Link>
        </div>

        <AuthSubmitButton pending={pending} />
      </form>
    </AuthShell>
  );
}
