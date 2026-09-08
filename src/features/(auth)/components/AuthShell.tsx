import Image from "next/image";
import type { ReactNode } from "react";
import { startGoogleLogin } from "../hooks/use-auth";
import AuthTabs from "./AuthTabs";
import GoogleIcon from "./GoogleIcon";

export default function AuthShell({
  activeTab,
  error,
  pending,
  googleLabel,
  children,
}: {
  activeTab: "masuk" | "daftar";
  error?: string;
  pending: boolean;
  googleLabel: string;
  children: ReactNode;
}) {
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

        <AuthTabs active={activeTab} />

        {error && (
          <p
            role="alert"
            className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-app-danger"
          >
            {error}
          </p>
        )}

        {children}

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
          {googleLabel}
        </button>
      </div>
    </main>
  );
}
