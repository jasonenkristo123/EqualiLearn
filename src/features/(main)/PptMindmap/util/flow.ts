import {
  Activity,
  Database,
  Network,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import type { ConceptIcon } from "../type/mindmap.type";

export const ICONS: Record<
  ConceptIcon,
  ComponentType<SVGProps<SVGSVGElement>>
> = {
  sparkles: Sparkles,
  network: Network,
  database: Database,
  shield: ShieldCheck,
  activity: Activity,
};

export const HANDLE_CLASS =
  "!size-2 !border-2 !border-white/25 !bg-app-surface";

export const DEFAULT_EDGE_OPTIONS = {
  type: "default",
  style: { stroke: "var(--app-canvas-edge)", strokeWidth: 1.5 },
};
