"use client";

import { ReactFlowProvider } from "@xyflow/react";
import { ChevronsLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "react-toastify";
import { getDocumentErrorMessage } from "@/shared/api/documents";
import { useDocument, useSummarizeDocument } from "@/shared/hooks/useDocuments";
import { useMindmapStore } from "@/shared/store/mindmap-store";
import { documentToMindmap } from "../service/document-to-mindmap";
import { MindmapCanvas } from "./MindmapCanvas";
import { SourceContextPanel } from "./SourceContextPanel";

interface PptCanvasProps {
  initialDocumentId?: string;
  onExport?: () => void;
}

export default function PptCanvas({
  initialDocumentId = "",
  onExport,
}: PptCanvasProps) {
  const router = useRouter();
  const [sourceOpen, setSourceOpen] = useState(true);
  const [documentName, setDocumentName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const setGeneratedMindmap = useMindmapStore((s) => s.setGeneratedMindmap);
  const documentQuery = useDocument(initialDocumentId);
  const summarizeMutation = useSummarizeDocument();

  const applyDocument = useCallback(
    (response: NonNullable<typeof documentQuery.data>) => {
      const generated = documentToMindmap(response.data);
      setGeneratedMindmap(
        generated.nodes,
        generated.edges,
        generated.extractedConcepts,
      );
      setDocumentName(response.data.file_name);
    },
    [setGeneratedMindmap],
  );

  useEffect(() => {
    if (documentQuery.data) applyDocument(documentQuery.data);
  }, [applyDocument, documentQuery.data]);

  useEffect(() => {
    if (!documentQuery.error) return;
    toast.error(
      getDocumentErrorMessage(
        documentQuery.error,
        "Dokumen tersimpan gagal dimuat.",
      ),
    );
  }, [documentQuery.error]);

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const response = await summarizeMutation.mutateAsync({
        file,
        language: "id",
        detailLevel: "balanced",
        targetAudience: "student",
        saveToHistory: true,
      });
      applyDocument(response);
      router.replace(
        `/ppt-canvas?documentId=${encodeURIComponent(response.data.id)}`,
        { scroll: false },
      );
      toast.success("Mind map berhasil dibuat dari dokumen.");
    } catch (error) {
      toast.error(
        getDocumentErrorMessage(error, "Gagal membuat mind map dari dokumen."),
      );
    }
  };

  return (
    <ReactFlowProvider>
      <div className="relative flex h-[calc(100dvh-3.5rem)] w-full overflow-hidden">
        <div className="relative min-w-0 flex-1">
          <MindmapCanvas onExport={onExport} />
          {initialDocumentId && (
            <Link
              href={`/canvas-discussion?documentId=${encodeURIComponent(initialDocumentId)}`}
              className="absolute right-4 top-4 z-10 rounded-lg border border-cyan/30 bg-app-surface px-3 py-2 text-sm text-app-teal"
            >
              Bagikan ke grup
            </Link>
          )}
        </div>

        {sourceOpen ? (
          <SourceContextPanel
            onClose={() => setSourceOpen(false)}
            onUpload={handleUpload}
            fileInputRef={fileInputRef}
            isUploading={summarizeMutation.isPending || documentQuery.isLoading}
            documentName={documentName}
          />
        ) : (
          <button
            type="button"
            onClick={() => setSourceOpen(true)}
            aria-label="Buka Source Context"
            className="absolute right-0 top-1/2 hidden -translate-y-1/2 rounded-l-lg border border-r-0 border-white/10 bg-app-surface px-1.5 py-3 text-white/40 transition-colors hover:text-white lg:block"
          >
            <ChevronsLeft className="size-4" />
          </button>
        )}
      </div>
    </ReactFlowProvider>
  );
}
