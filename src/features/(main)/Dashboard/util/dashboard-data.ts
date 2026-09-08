import { AudioLines, FileText, Presentation, Sparkles } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import type { HistoryKind, HistoryRecord } from "../type/dashboard.type";

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

export const KIND_META: Record<
  HistoryKind,
  { label: string; icon: IconType; accent: string }
> = {
  document: {
    label: "Ringkasan Dokumen",
    icon: FileText,
    accent: "bg-sky-400",
  },
  transcript: {
    label: "Transkrip Langsung",
    icon: AudioLines,
    accent: "bg-emerald-400",
  },
  audio: { label: "Narasi Audio", icon: Presentation, accent: "bg-violet-400" },
  other: { label: "Riwayat", icon: Sparkles, accent: "bg-white/30" },
};

/** Feature deep-links for a record, so the user can reopen the source. */
export function historyLinks(
  record: HistoryRecord,
): { label: string; href: string }[] {
  const id = encodeURIComponent(record.id);
  switch (record.kind) {
    case "document":
      return [
        { label: "PPT Reader", href: `/ppt-audio?documentId=${id}` },
        { label: "Kanvas Pikir", href: `/ppt-canvas?documentId=${id}` },
      ];
    case "audio":
      return [{ label: "PPT Reader", href: "/ppt-audio" }];
    case "transcript":
      return [{ label: "Live Transcribe", href: "/live-transcribe" }];
    default:
      return [];
  }
}

/** `DELETE documents/{id}` only makes sense for document-backed records. */
export function canDeleteRecord(record: HistoryRecord): boolean {
  return record.kind === "document" || record.kind === "other";
}

export function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);
  if (diffMinutes < 1) return "Baru saja";
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Kemarin";
  if (diffDays < 7) return `${diffDays} hari lalu`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`;

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatFileSize(bytes: number | undefined): string {
  if (!bytes || !Number.isFinite(bytes) || bytes <= 0) return "";

  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value < 10 && unit > 0 ? 1 : 0)} ${units[unit]}`;
}
