import { cn } from "@/lib/utils";

export function ErrorNotice({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <p
      role="alert"
      className={cn(
        "rounded-lg bg-red-500/10 px-3 py-2 text-xs text-app-danger",
        className,
      )}
    >
      {message}
    </p>
  );
}
