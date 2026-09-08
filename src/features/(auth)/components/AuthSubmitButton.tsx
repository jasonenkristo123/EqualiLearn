import { ArrowRight, Loader2 } from "lucide-react";

export default function AuthSubmitButton({ pending }: { pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 font-inter-600 text-sm text-app-background transition-colors hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <>
          Lanjutkan
          <ArrowRight className="size-4" />
        </>
      )}
    </button>
  );
}
