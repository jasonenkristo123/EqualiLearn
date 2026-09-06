"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
    { label: "Beranda", id: "beranda", href: "/home#beranda" },
    { label: "Fitur", id: "fitur", href: "/home#fitur" },
    { label: "Mode", id: "mode", href: "/home#mode" },
    { label: "Aksesibilitas", id: "aksesibilitas", href: "/home#aksesibilitas" },
];

export default function Navbar() {
    const [open, setOpen] = useState(false);
    const [activeId, setActiveId] = useState("beranda");
    const close = () => setOpen(false);
    
    useEffect(() => {
        const sections = NAV_LINKS.map((link) =>
            document.getElementById(link.id),
        ).filter((el): el is HTMLElement => el !== null);

        if (sections.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort(
                        (a, b) => b.intersectionRatio - a.intersectionRatio,
                    );
                if (visible[0]) setActiveId(visible[0].target.id);
            },
            { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.5, 1] },
        );

        sections.forEach((section) => observer.observe(section));
        return () => observer.disconnect();
    }, []);

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

                <ul className="hidden items-center gap-8 text-sm md:flex">
                    {NAV_LINKS.map((link) => (
                        <li key={link.href}>
                            <Link
                                href={link.href}
                                aria-current={
                                    activeId === link.id ? "page" : undefined
                                }
                                className={cn(
                                    "font-inter-500 transition-colors",
                                    activeId === link.id
                                        ? "text-white"
                                        : "text-white/60 hover:text-white",
                                )}
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
                                    aria-current={
                                        activeId === link.id ? "page" : undefined
                                    }
                                    className={cn(
                                        "block rounded-md px-2 py-3 font-inter-500 text-base transition-colors hover:bg-white/10",
                                        activeId === link.id && "bg-white/5",
                                    )}
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
