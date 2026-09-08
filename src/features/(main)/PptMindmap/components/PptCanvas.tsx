"use client";

import "@xyflow/react/dist/style.css";

import {
  Background,
  BackgroundVariant,
  Handle,
  MiniMap,
  type NodeProps,
  Panel,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  useViewport,
} from "@xyflow/react";
import {
  Activity,
  ChevronsLeft,
  ChevronsRight,
  Database,
  Download,
  Link2,
  LoaderCircle,
  Maximize2,
  Minus,
  MoreHorizontal,
  Network,
  Plus,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ChangeEvent, ComponentType, ReactNode, SVGProps } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import { getDocumentErrorMessage } from "@/shared/api/documents";
import { useDocument, useSummarizeDocument } from "@/shared/hooks/useDocuments";
import { useMindmapStore } from "@/shared/store/mindmap-store";
import { documentToMindmap } from "../service/document-to-mindmap";
import type { ConceptFlowNode, ConceptIcon } from "../type/mindmap.type";

const ICONS: Record<ConceptIcon, ComponentType<SVGProps<SVGSVGElement>>> = {
  sparkles: Sparkles,
  network: Network,
  database: Database,
  shield: ShieldCheck,
  activity: Activity,
};

const HANDLE_CLASS = "!size-2 !border-2 !border-white/25 !bg-[#0b1220]";

const DEFAULT_EDGE_OPTIONS = {
  type: "default",
  style: { stroke: "rgba(255,255,255,0.18)", strokeWidth: 1.5 },
};
function ConceptNode({ data, selected }: NodeProps<ConceptFlowNode>) {
  const addNode = useMindmapStore((s) => s.addNode);

  if (data.variant === "placeholder") {
    return (
      <>
        <Handle
          type="target"
          position={Position.Top}
          className={HANDLE_CLASS}
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            addNode();
          }}
          aria-label="Tambah node"
          className="grid size-12 place-items-center rounded-full border border-dashed border-white/20 text-white/40 transition-colors hover:border-white/40 hover:text-white/70"
        >
          <Plus className="size-4" />
        </button>
        <Handle
          type="source"
          position={Position.Bottom}
          className={HANDLE_CLASS}
        />
      </>
    );
  }

  const Icon = ICONS[data.icon ?? "activity"];
  const isRoot = data.variant === "root";
  const isCompact = data.variant === "compact";

  return (
    <div
      className={cn(
        "rounded-xl border bg-[#0b1220]/95 shadow-xl backdrop-blur-sm transition-colors",
        isRoot ? "w-64 p-4" : isCompact ? "w-52 px-4 py-3" : "w-56 p-4",
        selected
          ? "border-sky-400/60 ring-1 ring-sky-400/40"
          : "border-white/10",
        isRoot && !selected && "border-white/25",
      )}
    >
      <Handle type="target" position={Position.Top} className={HANDLE_CLASS} />

      {isRoot ? (
        <>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-inter-600 text-[10px] uppercase tracking-wider text-white/40">
              <Icon className="size-3.5" />
              {data.label}
            </span>
            <MoreHorizontal className="size-4 text-white/25" />
          </div>
          <p className="mt-3 font-inter-600 text-[15px] leading-snug text-white">
            {data.title}
          </p>
          {data.description && (
            <p className="mt-2 line-clamp-4 text-xs leading-relaxed text-white/45">
              {data.description}
            </p>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <Icon className="size-4 shrink-0 text-white/50" />
            <p className="min-w-0 font-inter-600 text-sm leading-snug text-white">
              {data.title}
            </p>
          </div>
          {!isCompact && data.description && (
            <p className="mt-2 text-xs leading-relaxed text-white/45">
              {data.description}
            </p>
          )}
        </>
      )}

      {data.badge && (
        <span className="mt-3 inline-block rounded bg-white/10 px-2 py-0.5 font-inter-600 text-[10px] tracking-wide text-white/55">
          {data.badge}
        </span>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className={HANDLE_CLASS}
      />
    </div>
  );
}

const nodeTypes = { concept: ConceptNode };
interface PptCanvasProps {
  initialDocumentId?: string;
  onExport?: () => void;
}

function MindmapCanvas({ onExport }: PptCanvasProps) {
  const nodes = useMindmapStore((s) => s.nodes);
  const edges = useMindmapStore((s) => s.edges);
  const onNodesChange = useMindmapStore((s) => s.onNodesChange);
  const onEdgesChange = useMindmapStore((s) => s.onEdgesChange);
  const onConnect = useMindmapStore((s) => s.onConnect);
  const { fitView } = useReactFlow();

  useEffect(() => {
    if (nodes.length === 0) return;
    const frame = window.requestAnimationFrame(() => {
      fitView({ padding: 0.25, duration: 350 });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [fitView, nodes.length]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
      fitView
      fitViewOptions={{ padding: 0.35 }}
      minZoom={0.3}
      maxZoom={2}
      className="bg-primary-dark"
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={22}
        size={1}
        color="#1e293b"
      />
      <MiniMap
        pannable
        zoomable
        bgColor="#0b1220"
        maskColor="rgba(3,8,15,0.72)"
        nodeColor="#334155"
        nodeStrokeColor="#475569"
        className="!m-0 !bottom-4 !left-4 !right-auto overflow-hidden rounded-lg !border !border-white/10"
      />
      <Panel position="bottom-center" className="!bottom-4">
        <CanvasToolbar onExport={onExport} />
      </Panel>
    </ReactFlow>
  );
}

function CanvasToolbar({ onExport }: PptCanvasProps) {
  const { zoomIn, zoomOut, fitView, screenToFlowPosition } = useReactFlow();
  const { zoom } = useViewport();
  const addNode = useMindmapStore((s) => s.addNode);

  const handleAdd = () => {
    const center = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
    addNode(center);
  };

  return (
    <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-[#0b1220]/95 p-1.5 shadow-xl backdrop-blur">
      <button
        type="button"
        onClick={handleAdd}
        className="flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 py-1.5 font-inter-500 text-xs text-white transition-colors hover:bg-white/10"
      >
        <Plus className="size-3.5" />
        Add Node
      </button>

      <ToolbarDivider />

      <ToolbarIcon label="Hubungkan node">
        <Link2 className="size-4" />
      </ToolbarIcon>
      <ToolbarIcon
        label="Sesuaikan tampilan"
        onClick={() => fitView({ padding: 0.35 })}
      >
        <Maximize2 className="size-4" />
      </ToolbarIcon>

      <ToolbarDivider />

      <ToolbarIcon label="Perkecil" onClick={() => zoomOut()}>
        <Minus className="size-4" />
      </ToolbarIcon>
      <span className="w-12 text-center text-xs tabular-nums text-white/60">
        {Math.round(zoom * 100)}%
      </span>
      <ToolbarIcon label="Perbesar" onClick={() => zoomIn()}>
        <Plus className="size-4" />
      </ToolbarIcon>

      <ToolbarDivider />

      <button
        type="button"
        onClick={onExport}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-inter-500 text-xs text-white/70 transition-colors hover:bg-white/5 hover:text-white"
      >
        <Download className="size-3.5" />
        Export
      </button>
    </div>
  );
}

function ToolbarIcon({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid size-8 place-items-center rounded-lg text-white/60 transition-colors hover:bg-white/5 hover:text-white"
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <span className="mx-1 h-5 w-px bg-white/10" />;
}

/* -------------------------------------------------------------------------- */
/*  Source context panel                                                       */
/* -------------------------------------------------------------------------- */

function SourceContextPanel({
  onClose,
  onUpload,
  fileInputRef,
  isUploading,
  documentName,
}: {
  onClose: () => void;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
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
            <span className="rounded-full border border-cyan/30 bg-cyan/10 px-2 py-0.5 text-[10px] text-cyan">
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

/* -------------------------------------------------------------------------- */
/*  Root                                                                       */
/* -------------------------------------------------------------------------- */

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
              className="absolute right-4 top-4 z-10 rounded-lg border border-cyan/30 bg-[#0b1220] px-3 py-2 text-sm text-cyan"
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
            className="absolute right-0 top-1/2 hidden -translate-y-1/2 rounded-l-lg border border-r-0 border-white/10 bg-[#0b1220] px-1.5 py-3 text-white/40 transition-colors hover:text-white lg:block"
          >
            <ChevronsLeft className="size-4" />
          </button>
        )}
      </div>
    </ReactFlowProvider>
  );
}
