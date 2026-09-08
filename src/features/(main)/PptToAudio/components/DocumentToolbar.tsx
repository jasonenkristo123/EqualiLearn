import { LoaderCircle, Plus } from "lucide-react";
import type { ChangeEvent, RefObject } from "react";
import { cn } from "@/lib/utils";
import type { SourceDocument } from "../type/ppt-audio.type";
import { DocTab } from "./DocTab";

export function DocumentToolbar({
  documents,
  loadingDocument,
  activeDoc,
  summarizing,
  processing,
  fileInputRef,
  onSelectDocument,
  onFileChange,
}: {
  documents: SourceDocument[];
  loadingDocument: boolean;
  activeDoc: SourceDocument | undefined;
  summarizing: boolean;
  processing: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onSelectDocument: (id: string) => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {loadingDocument && (
          <p className="px-2 text-xs text-white/40">Memuat dokumen…</p>
        )}
        {!loadingDocument && documents.length === 0 && (
          <p className="px-2 text-xs text-white/40">
            Belum ada dokumen yang diunggah
          </p>
        )}
        {documents.map((doc) => (
          <DocTab
            key={doc.id}
            doc={doc}
            active={doc.id === activeDoc?.id}
            onClick={() => onSelectDocument(doc.id)}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {activeDoc && (
          <p className="flex items-center gap-2 text-xs text-white/40">
            {activeDoc.pageCount > 0 && (
              <>
                <span>{activeDoc.pageCount} Halaman</span>
                <span aria-hidden="true">•</span>
              </>
            )}
            <span>{activeDoc.durationLabel}</span>
            <span aria-hidden="true">•</span>
            <span
              className={cn(
                activeDoc.status === "ready"
                  ? "text-app-accent"
                  : activeDoc.status === "error"
                    ? "text-app-danger"
                    : "text-white/50",
              )}
            >
              {activeDoc.status === "ready"
                ? "Selesai"
                : activeDoc.status === "error"
                  ? "Gagal"
                  : "Memproses…"}
            </span>
          </p>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.ppt,.pptx,.doc,.docx"
          onChange={onFileChange}
          className="sr-only"
          aria-label="Pilih dokumen untuk diringkas"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={processing}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.03] px-3 py-1.5 font-inter-500 text-xs text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white disabled:cursor-wait disabled:opacity-50"
        >
          {summarizing ? (
            <LoaderCircle className="size-3.5 animate-spin" />
          ) : (
            <Plus className="size-3.5" />
          )}
          {summarizing ? "Meringkas dokumen…" : "Unggah PDF/PPT Baru"}
        </button>
      </div>
    </div>
  );
}
