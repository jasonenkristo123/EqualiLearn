"use client";

import {
  AudioLines,
  Book,
  ChevronsLeft,
  PencilRuler,
  Presentation,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

/** Primary navigation for the authenticated app. Order matches the design. */
const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: Book },
  { label: "Live Transcribe", href: "/live-transcribe", icon: AudioLines },
  { label: "PPT Reader", href: "/ppt-audio", icon: Presentation },
  { label: "Kanvas Pikir", href: "/ppt-canvas", icon: PencilRuler },
  { label: "Ruang Lingkar", href: "/canvas-discussion", icon: Users },
];

interface SidebarProps {
  /** Desktop rail mode: icons only, no labels. */
  collapsed: boolean;
  /** Mobile drawer visibility. */
  mobileOpen: boolean;
  onToggleCollapsed: () => void;
  onCloseMobile: () => void;
}

export default function Sidebar({
  collapsed,
  mobileOpen,
  onToggleCollapsed,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();

  // Dismiss the mobile drawer once navigation settles on a new route.
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is the trigger, not a value read inside
  useEffect(() => {
    onCloseMobile();
  }, [pathname]);

  // Keep the page behind the drawer from scrolling while it is open.
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile backdrop */}
      <button
        type="button"
        tabIndex={mobileOpen ? 0 : -1}
        aria-hidden={!mobileOpen}
        aria-label="Tutup navigasi"
        onClick={onCloseMobile}
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity duration-300 lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/10 bg-app-background transition-[width,transform] duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:sticky lg:top-14 lg:h-[calc(100dvh-3.5rem)] lg:translate-x-0",
          collapsed ? "lg:w-[76px]" : "lg:w-64",
        )}
      >
        {/* Drawer header (mobile only — desktop keeps the logo in MainNavbar) */}
        <div className="flex h-14 items-center justify-between px-4 lg:hidden">
          <span className="font-serif text-xl text-white">EqualiLearn</span>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Tutup navigasi"
            className="-mr-2 grid size-9 place-items-center rounded-md text-white/70 transition-colors hover:bg-white/5 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3 lg:pt-5">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  collapsed && "lg:justify-center lg:gap-0 lg:px-0",
                  active
                    ? "bg-white font-inter-600 text-app-background shadow-sm"
                    : "font-inter-500 text-white/60 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon className="size-[18px] shrink-0" />
                <span className={cn("truncate", collapsed && "lg:hidden")}>
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle — desktop only */}
        <div className="hidden border-t border-white/10 p-3 lg:block">
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? "Tampilkan sidebar" : "Sembunyikan sidebar"}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-3 py-2 font-inter-500 text-xs text-white/40 transition-colors hover:bg-white/5 hover:text-white/70",
              collapsed && "justify-center px-0",
            )}
          >
            <ChevronsLeft
              className={cn(
                "size-4 transition-transform",
                collapsed && "rotate-180",
              )}
            />
            <span className={cn(collapsed && "hidden")}>Sembunyikan</span>
          </button>
        </div>
      </aside>
    </>
  );
}
