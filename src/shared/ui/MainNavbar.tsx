"use client";

import { Contrast, LogOut, Menu } from "lucide-react";
import Link from "next/link";

interface MainNavbarProps {
  /** Toggles the sidebar: collapse on desktop, open the drawer on mobile. */
  onMenuClick: () => void;
  onToggleTheme: () => void;
}

export default function MainNavbar({
  onMenuClick,
  onToggleTheme,
}: MainNavbarProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-primary-dark px-4 lg:px-6">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Alihkan navigasi"
          className="-ml-2 grid size-9 place-items-center rounded-md text-white/70 transition-colors hover:bg-white/5 hover:text-white"
        >
          <Menu className="size-5" />
        </button>
        <Link
          href="/live-transcribe"
          className="font-serif text-xl text-white sm:text-2xl"
        >
          EqualiLearn
        </Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label="Ganti tema"
          className="grid size-9 place-items-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-white/30 hover:text-white"
        >
          <Contrast className="size-4" />
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-md bg-[#d8b48c] px-3 py-1.5 font-inter-600 text-sm text-primary-dark transition-colors hover:bg-[#e3c4a2]"
        >
          <LogOut className="size-4" />
          Keluar
        </button>
      </div>
    </header>
  );
}
