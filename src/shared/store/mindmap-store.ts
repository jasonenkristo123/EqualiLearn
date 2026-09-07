import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
  type XYPosition,
} from "@xyflow/react";
import { create } from "zustand";
import type {
  ConceptFlowNode,
  ExtractedConcept,
  MindmapEdge,
} from "@/features/(main)/PptMindmap/type/mindmap.type";

const ROOT_ID = "root";

const edgeBetween = (source: string, target: string): MindmapEdge => ({
  id: `e-${source}-${target}`,
  source,
  target,
});

let seq = 0;
const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${(seq++).toString(36)}`;

const INITIAL_NODES: ConceptFlowNode[] = [
  {
    id: ROOT_ID,
    type: "concept",
    position: { x: 0, y: 0 },
    data: {
      label: "Core Concept",
      title: "Distributed Systems Topology",
      badge: "ROOT",
      icon: "sparkles",
      variant: "root",
    },
  },
  {
    id: "load-balancing",
    type: "concept",
    position: { x: -280, y: 230 },
    data: {
      title: "Load Balancing & Latency",
      description:
        "Traffic distribution strategies to minimize bottlenecking across node clusters.",
      icon: "network",
      variant: "concept",
    },
  },
  {
    id: "database-sharding",
    type: "concept",
    position: { x: 180, y: 230 },
    data: {
      title: "Database Sharding",
      description:
        "Horizontal partitioning of data architecture for high-throughput scaling.",
      icon: "database",
      variant: "concept",
    },
  },
  {
    id: "fault-tolerance",
    type: "concept",
    position: { x: -30, y: 430 },
    data: {
      title: "Fault Tolerance Protocol",
      icon: "shield",
      variant: "compact",
    },
  },
  {
    id: "placeholder",
    type: "concept",
    position: { x: 170, y: 340 },
    data: { title: "", variant: "placeholder" },
  },
];

const INITIAL_EDGES: MindmapEdge[] = [
  edgeBetween(ROOT_ID, "load-balancing"),
  edgeBetween(ROOT_ID, "database-sharding"),
  edgeBetween(ROOT_ID, "fault-tolerance"),
  edgeBetween("fault-tolerance", "placeholder"),
];

const INITIAL_CONCEPTS: ExtractedConcept[] = [
  {
    id: "c-1",
    title: "Microservices Grid",
    description:
      "Decentralized service architecture allowing independent scaling and deployment cycles.",
    page: 4,
  },
  {
    id: "c-2",
    title: "Cache Invalidation",
    description:
      "Strategies for maintaining data consistency across distributed memory stores.",
    page: 7,
  },
  {
    id: "c-3",
    title: "Zero-Trust Auth",
    description:
      "Security model requiring strict identity verification for every person and device trying to access resources.",
    page: 12,
  },
];

interface MindmapState {
  nodes: ConceptFlowNode[];
  edges: MindmapEdge[];
  extractedConcepts: ExtractedConcept[];

  onNodesChange: OnNodesChange<ConceptFlowNode>;
  onEdgesChange: OnEdgesChange<MindmapEdge>;
  onConnect: OnConnect;

  /** Add a blank concept node, linked to the root. */
  addNode: (position?: XYPosition) => void;
  /** Promote an AI-extracted concept into a canvas node, linked to the root. */
  addConceptAsNode: (concept: ExtractedConcept, position?: XYPosition) => void;
  removeNode: (id: string) => void;
  reset: () => void;
}

export const useMindmapStore = create<MindmapState>((set, get) => ({
  nodes: INITIAL_NODES,
  edges: INITIAL_EDGES,
  extractedConcepts: INITIAL_CONCEPTS,

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges<ConceptFlowNode>(changes, get().nodes) });
  },
  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges<MindmapEdge>(changes, get().edges) });
  },
  onConnect: (connection) => {
    set({ edges: addEdge(connection, get().edges) });
  },

  addNode: (position) => {
    const id = uid("node");
    set((state) => ({
      nodes: [
        ...state.nodes,
        {
          id,
          type: "concept",
          position: position ?? { x: 40 * state.nodes.length, y: 480 },
          data: {
            title: "Konsep Baru",
            description: "Klik untuk mengubah rincian konsep ini.",
            icon: "activity",
            variant: "concept",
          },
        },
      ],
      edges: [...state.edges, edgeBetween(ROOT_ID, id)],
    }));
  },

  addConceptAsNode: (concept, position) => {
    const id = uid("concept");
    set((state) => ({
      nodes: [
        ...state.nodes,
        {
          id,
          type: "concept",
          position: position ?? { x: 220, y: 120 + state.nodes.length * 40 },
          data: {
            title: concept.title,
            description: concept.description,
            badge: `Pg. ${concept.page}`,
            icon: "activity",
            variant: "concept",
          },
        },
      ],
      edges: [...state.edges, edgeBetween(ROOT_ID, id)],
    }));
  },

  removeNode: (id) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      edges: state.edges.filter(
        (edge) => edge.source !== id && edge.target !== id,
      ),
    }));
  },

  reset: () => {
    set({ nodes: INITIAL_NODES, edges: INITIAL_EDGES });
  },
}));
