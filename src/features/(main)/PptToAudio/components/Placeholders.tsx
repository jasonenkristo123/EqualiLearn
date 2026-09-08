import { LoaderCircle } from "lucide-react";

export function LoadingState() {
  return (
    <div className="flex min-h-32 items-center justify-center gap-2 text-sm text-white/40">
      <LoaderCircle className="size-4 animate-spin" />
      Memproses dokumen…
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <p className="flex min-h-32 items-center justify-center text-center text-sm leading-relaxed text-white/35">
      {message}
    </p>
  );
}
