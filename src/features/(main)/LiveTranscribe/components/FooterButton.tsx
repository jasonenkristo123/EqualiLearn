import type { ComponentType, ReactNode, SVGProps } from "react";

export function FooterButton({
  icon: Icon,
  onClick,
  children,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/[0.03] px-4 py-3 font-inter-500 text-sm text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
    >
      <Icon className="size-4" />
      {children}
    </button>
  );
}
