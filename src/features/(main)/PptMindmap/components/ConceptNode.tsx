import { Handle, type NodeProps, Position } from "@xyflow/react";
import { MoreHorizontal, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMindmapStore } from "@/shared/store/mindmap-store";
import type { ConceptFlowNode } from "../type/mindmap.type";
import { HANDLE_CLASS, ICONS } from "../util/flow";

export function ConceptNode({ data, selected }: NodeProps<ConceptFlowNode>) {
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
        "rounded-xl border bg-app-surface/95 shadow-xl backdrop-blur-sm transition-colors",
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
