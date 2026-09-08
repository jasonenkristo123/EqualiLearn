import type { ComponentType, ReactNode, SVGProps } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function PanelHeader({
  icon: Icon,
  title,
  action,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
      <h2 className="flex items-center gap-2 font-inter-600 text-sm text-white">
        <Icon className="size-4 text-lightblue" />
        {title}
      </h2>
      {action}
    </header>
  );
}
