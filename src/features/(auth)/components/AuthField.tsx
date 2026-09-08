import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

interface AuthFieldProps extends ComponentProps<"input"> {
  label: string;
  error?: string;
}

export default function AuthField({
  label,
  error,
  id,
  className,
  ...props
}: AuthFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          "rounded-lg border bg-white/[0.03] px-4 py-3 text-sm text-white transition-colors placeholder:text-white/30 focus:outline-none",
          error
            ? "border-red-500/60 focus:border-red-500/60"
            : "border-white/10 focus:border-white/25",
          className,
        )}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} className="px-1 text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
