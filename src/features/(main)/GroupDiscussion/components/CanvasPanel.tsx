import { useQuery } from "@tanstack/react-query";
import { Download, Link2, PanelRightClose, Plus, Share2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getDocument, getDocumentErrorMessage } from "@/shared/api/documents";
import { softButton, surface } from "../util/styles";
import { ErrorNotice } from "./ErrorNotice";

export function CanvasPanel({
  editingCount,
  previewId,
  onHide,
}: {
  editingCount: number;
  previewId: string;
  onHide: () => void;
}) {
  return (
    <section className={cn(surface, "relative flex min-h-0 flex-col")}>
      <header className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <Share2 size={15} className="text-app-accent" />
        <div>
          <h2 className="text-sm font-semibold">Live Shared Mind Map</h2>
          <p className="flex items-center gap-1.5 text-[11px] text-app-success">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {editingCount} Editing
          </p>
        </div>
        <button
          type="button"
          onClick={onHide}
          className={cn(softButton, "ml-auto")}
        >
          <PanelRightClose size={13} />
          Sembunyikan Kanvas
        </button>
      </header>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        {previewId ? (
          <DocumentPreview key={previewId} id={previewId} />
        ) : (
          <MindMapPlaceholder />
        )}

        <div className="pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1 rounded-xl border border-white/10 bg-app-surface/90 p-1.5">
          {[
            { key: "add", Icon: Plus },
            { key: "link", Icon: Link2 },
            { key: "export", Icon: Download },
          ].map(({ key, Icon }) => (
            <span
              key={key}
              className="grid h-8 w-8 place-items-center rounded-lg text-white/40"
            >
              <Icon size={15} />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function MindMapPlaceholder() {
  return (
    <div className="absolute inset-0">
      <svg
        className="h-full w-full"
        viewBox="0 0 480 520"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <title>Pratinjau mind map</title>
        <line
          x1="250"
          y1="140"
          x2="400"
          y2="360"
          stroke="rgba(56,189,248,0.35)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <line
          x1="250"
          y1="150"
          x2="150"
          y2="120"
          stroke="rgba(56,189,248,0.25)"
          strokeWidth="1.5"
        />
        <line
          x1="330"
          y1="330"
          x2="410"
          y2="430"
          stroke="rgba(56,189,248,0.3)"
          strokeWidth="1.5"
        />
      </svg>
      <PlaceholderNode
        className="left-[24%] top-[20%]"
        label="Database Nodes"
      />
      <PlaceholderNode
        className="left-[52%] top-[54%]"
        label="Sistem Terdistribusi"
        caption="Core Architecture"
        primary
      />
      <PlaceholderNode
        className="right-[6%] bottom-[14%]"
        label="Security / Encryption"
      />
      <p className="absolute bottom-4 left-4 max-w-[60%] text-[11px] text-white/35">
        Pratinjau statis. Kanvas kolaboratif real-time menyusul setelah chat
        stabil.
      </p>
    </div>
  );
}

function PlaceholderNode({
  className,
  label,
  caption,
  primary,
}: {
  className?: string;
  label: string;
  caption?: string;
  primary?: boolean;
}) {
  return (
    <div
      className={cn(
        "absolute rounded-lg border px-3 py-2 text-xs shadow-lg",
        primary
          ? "border-sky-500/60 bg-sky-500/10 text-white"
          : "border-white/15 bg-app-surface text-white/80",
        className,
      )}
    >
      {label}
      {caption && (
        <span className="mt-0.5 block text-[10px] text-white/45">
          {caption}
        </span>
      )}
    </div>
  );
}

function DocumentPreview({ id }: { id: string }) {
  const query = useQuery({
    queryKey: ["documents", id],
    queryFn: () => getDocument(id),
    retry: false,
  });
  return (
    <div className="h-full space-y-3 overflow-y-auto p-5">
      {query.isPending && (
        <output className="text-sm text-white/55">Memuat mind map…</output>
      )}
      {query.error && (
        <ErrorNotice message={getDocumentErrorMessage(query.error)} />
      )}
      {query.data && (
        <>
          <h3 className="text-sm font-semibold">{query.data.data.title}</h3>
          <p className="text-xs text-white/65">{query.data.data.summary}</p>
          <ul className="list-disc space-y-1.5 pl-5 text-xs text-white/80">
            {query.data.data.key_points.map((point, index) => (
              <li key={index + point}>{point}</li>
            ))}
          </ul>
          <Link
            href={`/ppt-canvas?documentId=${encodeURIComponent(id)}`}
            className="inline-block text-xs text-app-accent underline"
          >
            Buka kanvas lengkap
          </Link>
        </>
      )}
    </div>
  );
}
