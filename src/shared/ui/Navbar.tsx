"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const NAV_LINKS = [
    { label: "Beranda", href: "/home" },
    { label: "Fitur", href: "#fitur" },
    { label: "Mode", href: "#mode" },
    { label: "Aksesibilitas", href: "#aksesibilitas" },
];

export default function Navbar() {
    const [open, setOpen] = useState(false);
    const close = () => setOpen(false);

    return (
        <header className="fixed inset-x-0 top-0 z-999">
            <nav className="mx-auto flex w-full items-center justify-between bg-white/5 px-6 py-5 backdrop-blur-xs lg:px-10">
                <Link
                    href="/home"
                    onClick={close}
                    className="font-serif text-xl text-white sm:text-2xl"
                >
                    EqualiLearn
                </Link>

                <ul className="hidden items-center gap-8 text-sm text-white/90 md:flex">
                    {NAV_LINKS.map((link) => (
                        <li key={link.href}>
                            <Link
                                href={link.href}
                                className="font-inter-500 transition-colors hover:text-white"
                            >
                                {link.label}
                            </Link>
                        </li>
                    ))}
                </ul>

                <Link
                    href="/login"
                    className="hidden rounded-sm border border-white/25 bg-white/1 px-6 py-1 text-sm text-white transition-colors hover:bg-white/5 md:inline-block"
                >
                    Masuk
                </Link>

                <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    aria-label={open ? "Tutup menu" : "Buka menu"}
                    aria-expanded={open}
                    aria-controls="mobile-menu"
                    className="-mr-2 p-2 text-white md:hidden"
                >
                    {open ? <X className="size-6" /> : <Menu className="size-6" />}
                </button>
            </nav>

            {open && (
                <div
                    id="mobile-menu"
                    className="border-t border-white/10 bg-black/10 backdrop-blur-md md:hidden"
                >
                    <ul className="flex flex-col gap-1 px-6 py-4 text-white">
                        {NAV_LINKS.map((link) => (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    onClick={close}
                                    className="block rounded-md px-2 py-3 font-inter-500 text-base transition-colors hover:bg-white/10"
                                >
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                        <li className="mt-2">
                            <Link
                                href="/login"
                                onClick={close}
                                className="block rounded-sm border border-white/25 px-4 py-3 text-center text-base transition-colors hover:bg-white/10"
                            >
                                Masuk
                            </Link>
                        </li>
                    </ul>
                </div>
            )}
        </header>
    );
}
