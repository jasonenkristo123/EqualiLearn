"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import Image from "next/image";
import { type FormEvent, useState } from "react";
import {
  getApiErrorMessage,
  startGoogleLogin,
  useRegister,
} from "../hooks/use-auth";
import { registerSchema, toFieldErrors } from "../schema/auth.schema";
import AuthField from "./AuthField";
import AuthTabs from "./AuthTabs";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.82-.07-1.6-.21-2.36H12v4.47h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.74Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.95-2.91l-3.88-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29a7.19 7.19 0 0 1 0-4.58v-3.1H1.29a12 12 0 0 0 0 10.77l3.98-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.29 6.61l3.98 3.1C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

export default function Register() {
  const register = useRegister();
  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const pending = register.isPending;

  const setField = (key: keyof typeof values) => (value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error));
      return;
    }
    setErrors({});
    register.mutate(parsed.data);
  };

  return (
    <main className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-app-background px-4 py-12">
      <Image
        src="/images/green-gradients.png"
        alt=""
        aria-hidden
        width={800}
        height={800}
        className="pointer-events-none absolute -left-40 -top-40 h-auto w-[42rem] max-w-none select-none opacity-60"
      />
      <Image
        src="/images/purple-gradient.png"
        alt=""
        aria-hidden
        width={800}
        height={800}
        className="pointer-events-none absolute -bottom-40 -right-40 h-auto w-[42rem] max-w-none select-none opacity-60"
      />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-sm sm:p-10">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="font-serif font-normal leading-tight text-white text-2xl sm:text-3xl">
            Mulai Perjalanan{" "}
            <span className="italic text-app-highlight">Inklusif</span> Anda
          </h1>
          <p className="text-sm text-white/50">
            Akses ruang belajar adaptif Anda.
          </p>
        </div>

        <AuthTabs active="daftar" />

        {register.isError && (
          <p
            role="alert"
            className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-app-danger"
          >
            {getApiErrorMessage(register.error)}
          </p>
        )}

        <form
          onSubmit={onSubmit}
          noValidate
          className="mt-6 flex flex-col gap-4"
        >
          <AuthField
            id="name"
            label="Nama"
            type="text"
            autoComplete="name"
            placeholder="Nama lengkap"
            value={values.name}
            onChange={(e) => setField("name")(e.target.value)}
            error={errors.name}
          />

          <AuthField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="nama@gmail.com"
            value={values.email}
            onChange={(e) => setField("email")(e.target.value)}
            error={errors.email}
          />

          <AuthField
            id="password"
            label="Kata sandi"
            type="password"
            autoComplete="new-password"
            placeholder="Masukkan kata sandi"
            value={values.password}
            onChange={(e) => setField("password")(e.target.value)}
            error={errors.password}
          />

          <AuthField
            id="confirm_password"
            label="Ulangi kata sandi"
            type="password"
            autoComplete="new-password"
            placeholder="Masukkan ulang kata sandi"
            value={values.confirm_password}
            onChange={(e) => setField("confirm_password")(e.target.value)}
            error={errors.confirm_password}
          />

          <button
            type="submit"
            disabled={pending}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 font-inter-600 text-sm text-app-background transition-colors hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                Lanjutkan
                <ArrowRight className="size-4" />
              </>
            )}
          </button>
        </form>

        <div className="my-6 flex items-center gap-4">
          <span className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-white/40">atau</span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <button
          type="button"
          onClick={startGoogleLogin}
          disabled={pending}
          className="inline-flex w-full items-center justify-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.03] px-6 py-3 text-sm text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-60"
        >
          <GoogleIcon />
          Daftar Dengan Google
        </button>
      </div>
    </main>
  );
}
