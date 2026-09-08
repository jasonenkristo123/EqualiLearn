import { useReactFlow, useViewport } from "@xyflow/react";
import { Download, Link2, Maximize2, Minus, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { useMindmapStore } from "@/shared/store/mindmap-store";

export function CanvasToolbar({ onExport }: { onExport?: () => void }) {
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
    <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-app-surface/95 p-1.5 shadow-xl backdrop-blur">
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
