"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { APP_THEME_STORAGE_KEY, type AppTheme } from "@/shared/lib/app-theme";
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
  const [theme, setTheme] = useState<AppTheme>("dark");

  useLayoutEffect(() => {
    let storedTheme: string | null = null;
    try {
      storedTheme = window.localStorage.getItem(APP_THEME_STORAGE_KEY);
    } catch {}
    const initialTheme: AppTheme = storedTheme === "light" ? "light" : "dark";

    document.documentElement.dataset.appTheme = initialTheme;
    setTheme(initialTheme);
  }, []);

  const handleMenuClick = useCallback(() => {
    if (isDesktop) setSidebarCollapsed((v) => !v);
    else setMobileNavOpen((v) => !v);
  }, [isDesktop]);

  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);
  const toggleCollapsed = useCallback(() => setSidebarCollapsed((v) => !v), []);
  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => {
      const nextTheme = currentTheme === "dark" ? "light" : "dark";
      try {
        window.localStorage.setItem(APP_THEME_STORAGE_KEY, nextTheme);
      } catch {
        // The in-memory toggle still works when persistence is unavailable.
      }
      document.documentElement.dataset.appTheme = nextTheme;
      return nextTheme;
    });
  }, []);

  return (
    <div
      data-theme={theme}
      className={cn(
        "app-theme min-h-dvh bg-app-background text-white transition-colors duration-200",
        theme,
      )}
    >
      <MainNavbar
        theme={theme}
        onMenuClick={handleMenuClick}
        onToggleTheme={toggleTheme}
      />
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
