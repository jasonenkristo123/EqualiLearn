import type { Edge, Node } from "@xyflow/react";

export type ConceptVariant = "root" | "concept" | "compact" | "placeholder";

export type ConceptIcon =
  | "sparkles"
  | "network"
  | "database"
  | "shield"
  | "activity";

export interface ConceptNodeData {
  /** Small kicker shown above the title on the root node (e.g. "Core Concept"). */
  label?: string;
  title: string;
  description?: string;
  /** Pill shown at the bottom of the card (e.g. "ROOT", "Pg. 4"). */
  badge?: string;
  icon?: ConceptIcon;
  variant: ConceptVariant;
  /** Index signature required by @xyflow/react's Node data constraint. */
  [key: string]: unknown;
}

export type ConceptFlowNode = Node<ConceptNodeData, "concept">;
export type MindmapEdge = Edge;

/** A concept the AI pulled out of the uploaded PDF/PPT, ready to drop on the canvas. */
export interface ExtractedConcept {
  id: string;
  title: string;
  description: string;
  page?: number;
  sourceLabel?: string;
}
