import Link from "next/link";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "masuk", label: "Masuk", href: "/login" },
  { key: "daftar", label: "Daftar", href: "/register" },
] as const;

export default function AuthTabs({ active }: { active: "masuk" | "daftar" }) {
  return (
    <div className="mt-8 grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          aria-current={active === tab.key ? "page" : undefined}
          className={cn(
            "rounded-lg py-2.5 text-center font-inter-600 text-xs transition-colors",
            active === tab.key
              ? "bg-white/10 text-white"
              : "text-white/50 hover:text-white/80",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
