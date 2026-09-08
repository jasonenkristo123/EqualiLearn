import "@xyflow/react/dist/style.css";

import {
  Background,
  BackgroundVariant,
  MiniMap,
  Panel,
  ReactFlow,
  useReactFlow,
} from "@xyflow/react";
import { useEffect } from "react";
import { useMindmapStore } from "@/shared/store/mindmap-store";
import { DEFAULT_EDGE_OPTIONS } from "../util/flow";
import { CanvasToolbar } from "./CanvasToolbar";
import { ConceptNode } from "./ConceptNode";

const nodeTypes = { concept: ConceptNode };

export function MindmapCanvas({ onExport }: { onExport?: () => void }) {
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
      className="bg-app-background"
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={22}
        size={1}
        color="var(--app-canvas-dot)"
      />
      <MiniMap
        pannable
        zoomable
        bgColor="var(--app-surface)"
        maskColor="var(--app-canvas-mask)"
        nodeColor="var(--app-canvas-node)"
        nodeStrokeColor="var(--app-canvas-node-stroke)"
        className="!m-0 !bottom-4 !left-4 !right-auto overflow-hidden rounded-lg !border !border-white/10"
      />
      <Panel position="bottom-center" className="!bottom-4">
        <CanvasToolbar onExport={onExport} />
      </Panel>
    </ReactFlow>
  );
}
