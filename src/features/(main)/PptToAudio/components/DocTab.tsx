import { AlertCircle, FileText, Presentation } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SourceDocument } from "../type/ppt-audio.type";

export function DocTab({
  doc,
  active,
  onClick,
}: {
  doc: SourceDocument;
  active: boolean;
  onClick: () => void;
}) {
  const Icon =
    doc.status === "error"
      ? AlertCircle
      : doc.kind === "pdf"
        ? FileText
        : Presentation;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-colors",
        active
          ? "border-white/25 bg-white/[0.06] text-white"
          : "border-transparent text-white/45 hover:text-white/70",
      )}
    >
      <Icon
        className={cn(
          "size-3.5",
          doc.status === "error"
            ? "text-app-danger"
            : active
              ? "text-app-accent"
              : "text-white/40",
        )}
      />
      {doc.name}
    </button>
  );
}
