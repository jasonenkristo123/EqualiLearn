"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import {
  getApiErrorMessage,
  useGoogleCallback,
} from "@/features/(auth)/hooks/use-auth";

function GoogleCallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const callback = useGoogleCallback();
  const started = useRef(false);

  const code = params.get("code");
  const state = params.get("state");

  useEffect(() => {
    if (started.current) return;
    if (!code || !state) {
      router.replace("/login?error=google");
      return;
    }
    started.current = true;
    callback.mutate({ code, state });
  }, [code, state, callback.mutate, router]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-primary-dark px-4">
      <div className="flex flex-col items-center gap-3 text-center">
        {callback.isError ? (
          <>
            <p className="text-sm text-white/70">
              {getApiErrorMessage(callback.error, "Login Google gagal.")}
            </p>
            <button
              type="button"
              onClick={() => router.replace("/login")}
              className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/80 transition-colors hover:bg-white/5"
            >
              Kembali ke halaman Masuk
            </button>
          </>
        ) : (
          <>
            <span className="size-8 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
            <p className="text-sm text-white/50">Menyelesaikan login Google…</p>
          </>
        )}
      </div>
    </main>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={null}>
      <GoogleCallbackInner />
    </Suspense>
  );
}
