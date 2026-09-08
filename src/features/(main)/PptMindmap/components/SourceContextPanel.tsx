import { ChevronsRight, LoaderCircle, Upload, X } from "lucide-react";
import type { ChangeEvent, RefObject } from "react";
import { useMindmapStore } from "@/shared/store/mindmap-store";

export function SourceContextPanel({
  onClose,
  onUpload,
  fileInputRef,
  isUploading,
  documentName,
}: {
  onClose: () => void;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  isUploading: boolean;
  documentName?: string;
}) {
  const concepts = useMindmapStore((s) => s.extractedConcepts);
  const addConceptAsNode = useMindmapStore((s) => s.addConceptAsNode);

  return (
    <aside className="hidden w-80 shrink-0 flex-col border-l border-white/10 bg-white/[0.02] lg:flex">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h2 className="font-inter-600 text-xs uppercase tracking-wider text-white/50">
          Source Context
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup panel"
          className="text-white/40 transition-colors hover:text-white"
        >
          <X className="size-4" />
        </button>
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.ppt,.pptx,.doc,.docx"
          onChange={onUpload}
          className="sr-only"
          aria-label="Pilih dokumen untuk dibuat menjadi mind map"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex w-full flex-col items-center gap-1.5 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-5 text-white/50 transition-colors hover:border-white/30 hover:text-white/70"
        >
          {isUploading ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          <span className="max-w-full truncate font-inter-500 text-xs">
            {isUploading
              ? "Meringkas dokumen…"
              : documentName || "Upload PDF/PPT"}
          </span>
        </button>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-inter-600 text-xs uppercase tracking-wider text-white/50">
              Extracted Concepts
            </h3>
            <span className="rounded-full border border-cyan/30 bg-cyan/10 px-2 py-0.5 text-[10px] text-app-teal">
              AI Generated
            </span>
          </div>

          <ul className="space-y-2.5">
            {concepts.length === 0 && (
              <li className="rounded-xl border border-dashed border-white/10 px-3 py-8 text-center text-xs leading-relaxed text-white/35">
                Konsep akan muncul setelah dokumen selesai diringkas.
              </li>
            )}
            {concepts.map((concept) => (
              <li key={concept.id}>
                <button
                  type="button"
                  onClick={() => addConceptAsNode(concept)}
                  className="block w-full rounded-xl border border-white/10 bg-white/[0.02] p-3 text-left transition-colors hover:border-white/20 hover:bg-white/[0.04]"
                >
                  <h4 className="font-inter-600 text-sm text-white">
                    {concept.title}
                  </h4>
                  <p className="mt-1 text-xs leading-relaxed text-white/45">
                    {concept.description}
                  </p>
                  {(concept.page || concept.sourceLabel) && (
                    <span className="mt-2 inline-block text-[10px] text-white/30">
                      {concept.page
                        ? `Pg. ${concept.page}`
                        : concept.sourceLabel}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <footer className="flex justify-end border-t border-white/10 px-4 py-2">
        <button
          type="button"
          onClick={onClose}
          aria-label="Sembunyikan panel"
          className="text-white/30 transition-colors hover:text-white/60"
        >
          <ChevronsRight className="size-4" />
        </button>
      </footer>
    </aside>
  );
}
