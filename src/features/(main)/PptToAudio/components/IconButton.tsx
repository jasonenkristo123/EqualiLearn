import type { ReactNode } from "react";

export function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid size-8 place-items-center rounded-md text-white/60 transition-colors hover:bg-white/5 hover:text-white"
    >
      {children}
    </button>
  );
}
