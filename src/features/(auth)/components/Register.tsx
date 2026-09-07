"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import AuthTabs from "./AuthTabs";

export default function Register() {
  return (
    <main className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-primary-dark px-4 py-12">
      <Image
        src="/images/green-gradients.png"
        alt="green gradient"
        aria-hidden
        width={800}
        height={800}
        className="pointer-events-none absolute -left-40 -top-40 h-auto w-[42rem] max-w-none select-none opacity-60"
      />
      <Image
        src="/images/purple-gradient.png"
        alt="purple gradient"
        aria-hidden
        width={800}
        height={800}
        className="pointer-events-none absolute -bottom-40 -right-40 h-auto w-[42rem] max-w-none select-none opacity-60"
      />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-sm sm:p-10">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="font-serif font-normal leading-tight text-white text-2xl sm:text-3xl">
            Mulai Perjalanan{" "}
            <span className="italic text-lightblue">Inklusif</span> Anda
          </h1>
          <p className="text-sm text-white/50">
            Akses ruang belajar adaptif Anda.
          </p>
        </div>

        <AuthTabs active="daftar" />

        <form
          className="mt-6 flex flex-col gap-4"
          onSubmit={(e) => e.preventDefault()}
        >
          <label htmlFor="email" className="sr-only">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="nama@gmail.com"
            className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white transition-colors placeholder:text-white/30 focus:border-white/25 focus:outline-none"
          />

          <label htmlFor="password" className="sr-only">
            Kata sandi
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="Masukkan kata sandi"
            className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white transition-colors placeholder:text-white/30 focus:border-white/25 focus:outline-none"
          />

          <label htmlFor="confirm-password" className="sr-only">
            Ulangi kata sandi
          </label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            placeholder="Masukkan ulang kata sandi"
            className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white transition-colors placeholder:text-white/30 focus:border-white/25 focus:outline-none"
          />

          <div className="flex items-center justify-between text-xs">
            <label className="flex cursor-pointer items-center gap-2 text-white/60">
              <input
                type="checkbox"
                className="size-4 rounded border-white/20 bg-white/5 accent-cyan"
              />
              Ingat saya
            </label>
            <Link
              href="#"
              className="text-cyan transition-colors hover:text-cyan/80"
            >
              Lupa kata sandi?
            </Link>
          </div>

          <button
            type="submit"
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 font-inter-600 text-sm text-primary-dark transition-colors hover:bg-white/90"
          >
            Lanjutkan
            <ArrowRight className="size-4" />
          </button>
        </form>
      </div>
    </main>
  );
}
