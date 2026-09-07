"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import MainNavbar from "@/shared/ui/MainNavbar";
import Sidebar from "@/shared/ui/Sidebar";

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [query]);

  return matches;
}

export default function MainLayout({ children }: { children: ReactNode }) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // The navbar's menu button collapses the rail on desktop, opens the drawer on mobile.
  const handleMenuClick = useCallback(() => {
    if (isDesktop) setSidebarCollapsed((v) => !v);
    else setMobileNavOpen((v) => !v);
  }, [isDesktop]);

  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);
  const toggleCollapsed = useCallback(() => setSidebarCollapsed((v) => !v), []);
  const toggleTheme = useCallback(
    () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    [],
  );

  return (
    <div
      className={cn("min-h-dvh bg-primary-dark", theme === "dark" && "dark")}
    >
      <MainNavbar onMenuClick={handleMenuClick} onToggleTheme={toggleTheme} />
      <div className="flex">
        <Sidebar
          collapsed={sidebarCollapsed}
          mobileOpen={mobileNavOpen}
          onToggleCollapsed={toggleCollapsed}
          onCloseMobile={closeMobileNav}
        />
        <main className="min-h-[calc(100dvh-3.5rem)] min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
