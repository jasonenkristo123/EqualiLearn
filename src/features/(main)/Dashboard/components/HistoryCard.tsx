import { ExternalLink, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { HistoryRecord } from "../type/dashboard.type";
import {
  canDeleteRecord,
  formatFileSize,
  formatRelativeDate,
  historyLinks,
  KIND_META,
} from "../util/dashboard-data";

export function HistoryCard({
  record,
  onDelete,
  deleting,
}: {
  record: HistoryRecord;
  onDelete: () => void;
  deleting: boolean;
}) {
  const { label, icon: Icon, accent } = KIND_META[record.kind];
  const links = historyLinks(record);
  const meta =
    [record.fileType?.toUpperCase(), formatFileSize(record.fileSize)]
      .filter(Boolean)
      .join(" · ") || label;

  return (
    <article className="group relative flex min-h-[205px] flex-col overflow-hidden rounded-xl border border-white/10 bg-app-surface/55 transition-colors hover:border-white/20">
      <span
        aria-hidden="true"
        className={cn("absolute inset-y-0 left-0 w-[3px]", accent)}
      />

      <div className="flex flex-1 flex-col px-5 pb-4 pt-5">
        <div className="flex items-start justify-between gap-4">
          <span className="grid size-10 place-items-center rounded-md border border-white/10 bg-white/[0.015]">
            <Icon className="size-5 text-white/90" />
          </span>
          <time className="pt-1 font-inter-500 text-[10px] uppercase tracking-wide text-white/40">
            {formatRelativeDate(record.createdAt)}
          </time>
        </div>

        <h2 className="mt-4 line-clamp-2 font-inter-500 text-sm text-white">
          {record.title}
        </h2>
        {record.description && (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-white/45">
            {record.description}
          </p>
        )}

        <p className="mt-auto pt-3 truncate text-[10px] uppercase tracking-wide text-white/30">
          {record.fileName ? `${record.fileName} · ${meta}` : meta}
        </p>
      </div>

      <footer className="flex items-center justify-between gap-2 border-t border-white/10 px-4 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {links.length === 0 && (
            <span className="text-[11px] text-white/30">{label}</span>
          )}
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-label={`${link.label}: ${record.title}`}
              className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/70 transition-colors hover:border-white/25 hover:text-white"
            >
              <ExternalLink className="size-3" />
              {link.label}
            </Link>
          ))}
        </div>

        {canDeleteRecord(record) && (
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            aria-label={`Hapus ${record.title}`}
            className="grid size-8 shrink-0 place-items-center rounded-md text-white/35 transition-colors hover:bg-red-400/10 hover:text-app-danger disabled:cursor-wait disabled:opacity-40"
          >
            {deleting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
          </button>
        )}
      </footer>
    </article>
  );
}
