"use client";

import {
  Check,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  Download,
  Link2,
  Mic,
  Play,
  Plus,
  Send,
  Settings,
  Share2,
  Sparkles,
  UserPlus,
  Volume2,
  Zap,
} from "lucide-react";
import type { ComponentType, FormEvent, ReactNode, SVGProps } from "react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type {
  AccessibilityAssist,
  DiscussionMessage,
  DiscussionMode,
  DiscussionRoom,
  Participant,
  SharedMapEdge,
  SharedMapNode,
} from "../type/discussion.type";

/* -------------------------------------------------------------------------- */
/*  Static presentation config                                                 */
/* -------------------------------------------------------------------------- */

const MONO = "font-[ui-monospace,SFMono-Regular,Menlo,monospace]";

const MODE_LABELS: Record<DiscussionMode, string> = {
  standar: "Standar",
  fokus: "Mode Fokus",
  santai: "Santai",
};

const ASSIST_META: Record<
  AccessibilityAssist,
  { icon: ComponentType<SVGProps<SVGSVGElement>>; label: string; tone: string }
> = {
  "voice-to-text": {
    icon: Zap,
    label: "AI Voice-to-Text for Deaf Peer",
    tone: "text-sky-300",
  },
  "text-to-speech": {
    icon: Volume2,
    label: "AI Text-to-Speech for Blind Peer",
    tone: "text-cyan",
  },
};

const VOICE_BARS = [
  6, 10, 14, 9, 16, 7, 12, 15, 8, 13, 6, 11, 14, 9, 12, 7,
].map((height, i) => ({ id: `vb-${i}`, height }));

/* -------------------------------------------------------------------------- */
/*  Mock data — replace with props fed by the GroupDiscussion service.        */
/* -------------------------------------------------------------------------- */

const MOCK_ROOM: DiscussionRoom = {
  id: "room-1",
  name: "Kelompok 3",
  code: "EQL-8921",
  mode: "standar",
};

const MOCK_PARTICIPANTS: Participant[] = [
  { id: "p-budi", name: "Budi", color: "#38bdf8" },
  { id: "p-siti", name: "Siti", color: "#f472b6" },
  { id: "p-aland", name: "Aland", color: "#34d399" },
];

const MOCK_MESSAGES: DiscussionMessage[] = [
  {
    id: "m-1",
    authorId: "p-budi",
    authorName: "Budi",
    timestamp: "10:42 AM",
    kind: "voice",
    voiceDurationLabel: "0:12",
    text: "Saya pikir kita perlu menambahkan node keamanan di bagian arsitektur server. Apakah Siti setuju?",
    assist: "voice-to-text",
  },
  {
    id: "m-2",
    authorId: "p-siti",
    authorName: "Siti",
    timestamp: "10:43 AM",
    kind: "text",
    own: true,
    text: "Setuju, Budi. Saya akan tambahkan detail enkripsi di node tersebut sekarang.",
    assist: "text-to-speech",
  },
];

const MOCK_MAP_NODES: SharedMapNode[] = [
  { id: "n-1", label: "Database Nodes", x: 24, y: 24 },
  {
    id: "n-2",
    label: "Sistem Terdistribusi",
    caption: "Core Architecture",
    x: 46,
    y: 52,
    variant: "primary",
  },
  {
    id: "n-3",
    label: "Security / Encryption",
    x: 80,
    y: 72,
    editingBy: "p-siti",
  },
];

const MOCK_MAP_EDGES: SharedMapEdge[] = [
  { id: "e-1", source: "n-1", target: "n-2" },
  { id: "e-2", source: "n-2", target: "n-3" },
];

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

interface CanvasDiscussionProps {
  room?: DiscussionRoom;
  participants?: Participant[];
  messages?: DiscussionMessage[];
  mapNodes?: SharedMapNode[];
  mapEdges?: SharedMapEdge[];
  editingCount?: number;
  currentUserId?: string;
  onInvite?: () => void;
  onShareCanvas?: () => void;
}

export default function CanvasDiscussion({
  room = MOCK_ROOM,
  participants = MOCK_PARTICIPANTS,
  messages: initialMessages = MOCK_MESSAGES,
  mapNodes = MOCK_MAP_NODES,
  mapEdges = MOCK_MAP_EDGES,
  editingCount = 3,
  currentUserId = "p-siti",
  onInvite,
  onShareCanvas,
}: CanvasDiscussionProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [mode, setMode] = useState<DiscussionMode>(room.mode);
  const [mapOpen, setMapOpen] = useState(true);
  const [holding, setHolding] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: messages is the trigger, not a value read inside
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const sendMessage = (event: FormEvent) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        authorId: currentUserId,
        authorName: "Anda",
        timestamp: new Intl.DateTimeFormat("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date()),
        kind: "text",
        text: body,
        own: true,
      },
    ]);
    setDraft("");
  };

  return (
    <div className="flex flex-col gap-4 p-4 lg:h-[calc(100dvh-3.5rem)] lg:flex-row lg:gap-6 lg:overflow-hidden lg:p-6">
      {/* ---------------------------------------------------------------- */}
      {/*  Group chat                                                      */}
      {/* ---------------------------------------------------------------- */}
      <section className="flex min-h-[560px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] lg:min-h-0 lg:w-[440px] lg:shrink-0">
        <ChatHeader
          room={room}
          participants={participants}
          mode={mode}
          onModeChange={setMode}
          onInvite={onInvite}
        />

        <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </div>

        <div className="border-t border-white/10 p-3">
          <form onSubmit={sendMessage} className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Ketik pesan…"
                aria-label="Ketik pesan"
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pr-10 pl-4 text-sm text-white transition-colors placeholder:text-white/30 focus:border-white/25 focus:outline-none"
              />
              <button
                type="button"
                aria-label="Rekam pesan suara"
                className="absolute top-1/2 right-2 -translate-y-1/2 text-white/40 transition-colors hover:text-white"
              >
                <Mic className="size-4" />
              </button>
            </div>
            <button
              type="submit"
              aria-label="Kirim pesan"
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-500 text-white transition-colors hover:bg-sky-400"
            >
              <Send className="size-4" />
            </button>
          </form>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onPointerDown={() => setHolding(true)}
              onPointerUp={() => setHolding(false)}
              onPointerLeave={() => setHolding(false)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-inter-500 text-xs transition-colors",
                holding
                  ? "border-sky-400/50 bg-sky-400/10 text-sky-300"
                  : "border-white/15 bg-white/[0.03] text-white/70 hover:text-white",
              )}
            >
              <Mic className="size-3.5" />
              Hold to Speak
            </button>
            <button
              type="button"
              onClick={onShareCanvas}
              className="inline-flex items-center gap-1.5 rounded-lg border border-cyan/30 bg-cyan/10 px-3 py-1.5 font-inter-500 text-xs text-cyan transition-colors hover:bg-cyan/15"
            >
              <Share2 className="size-3.5" />
              Bagikan Kanvas
            </button>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/*  Live shared mind map                                            */}
      {/* ---------------------------------------------------------------- */}
      {mapOpen ? (
        <section className="relative hidden min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] lg:flex">
          <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <h2 className="flex items-center gap-1.5 font-inter-600 text-sm text-white">
                <Sparkles className="size-4 text-lightblue" />
                Live Shared Mind Map
              </h2>
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                {editingCount} Editing
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMapOpen(false)}
              className="inline-flex items-center gap-1 text-xs text-white/50 transition-colors hover:text-white"
            >
              <ChevronsRight className="size-3.5" />
              Sembunyikan Kanvas
            </button>
          </header>

          <SharedMap
            nodes={mapNodes}
            edges={mapEdges}
            participants={participants}
          />
        </section>
      ) : (
        <button
          type="button"
          onClick={() => setMapOpen(true)}
          aria-label="Tampilkan kanvas"
          className="absolute top-1/2 right-0 hidden -translate-y-1/2 rounded-l-lg border border-r-0 border-white/10 bg-[#0b1220] px-1.5 py-3 text-white/40 transition-colors hover:text-white lg:block"
        >
          <ChevronsLeft className="size-4" />
        </button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Chat pieces                                                                */
/* -------------------------------------------------------------------------- */

function ChatHeader({
  room,
  participants,
  mode,
  onModeChange,
  onInvite,
}: {
  room: DiscussionRoom;
  participants: Participant[];
  mode: DiscussionMode;
  onModeChange: (mode: DiscussionMode) => void;
  onInvite?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (e.g. insecure context) — no-op for the slice.
    }
  };

  return (
    <header className="flex flex-wrap items-center gap-2 border-b border-white/10 px-4 py-3">
      <h2 className="font-inter-600 text-sm text-white">{room.name}</h2>

      <button
        type="button"
        onClick={copyCode}
        className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[11px] text-white/50 transition-colors hover:text-white"
      >
        {room.code}
        {copied ? (
          <Check className="size-3 text-emerald-400" />
        ) : (
          <Copy className="size-3" />
        )}
      </button>

      <AvatarStack participants={participants} />

      <button
        type="button"
        onClick={onInvite}
        className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/[0.03] px-2 py-1 text-[11px] text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white"
      >
        <UserPlus className="size-3" />
        Undang
      </button>

      <div className="relative ml-auto">
        <Settings className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-white/40" />
        <select
          value={mode}
          onChange={(e) => onModeChange(e.target.value as DiscussionMode)}
          aria-label="Mode diskusi"
          className="appearance-none rounded-md border border-white/15 bg-white/[0.03] py-1 pr-7 pl-7 text-[11px] text-white/80 transition-colors hover:bg-white/[0.06] focus:border-white/25 focus:outline-none"
        >
          {(Object.keys(MODE_LABELS) as DiscussionMode[]).map((key) => (
            <option key={key} value={key} className="bg-primary-dark">
              {MODE_LABELS[key]}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-white/40" />
      </div>
    </header>
  );
}

function AvatarStack({ participants }: { participants: Participant[] }) {
  return (
    <div className="flex -space-x-2">
      {participants.slice(0, 3).map((participant) => (
        <span
          key={participant.id}
          title={participant.name}
          className="grid size-6 place-items-center rounded-full border-2 border-primary-dark text-[10px] font-inter-600 text-primary-dark"
          style={{ backgroundColor: participant.color }}
        >
          {participant.name.charAt(0)}
        </span>
      ))}
    </div>
  );
}

function MessageBubble({ message }: { message: DiscussionMessage }) {
  const { own, authorName, timestamp } = message;

  return (
    <div className={cn("flex flex-col", own ? "items-end" : "items-start")}>
      <p className="mb-1 px-1 text-[11px] text-white/40">
        {own ? (
          <>
            {timestamp} <span className="text-white/25">•</span> {authorName}
          </>
        ) : (
          <>
            {authorName} <span className="text-white/25">•</span> {timestamp}
          </>
        )}
      </p>

      <div
        className={cn(
          "max-w-[85%] rounded-2xl border px-3.5 py-2.5",
          own ? "border-cyan/20 bg-cyan/10" : "border-white/10 bg-white/[0.04]",
        )}
      >
        {message.kind === "voice" && (
          <VoicePlayer durationLabel={message.voiceDurationLabel ?? "0:00"} />
        )}
        <p className="text-sm leading-relaxed text-white/85">{message.text}</p>
        {message.assist && <AssistCaption assist={message.assist} />}
      </div>
    </div>
  );
}

function VoicePlayer({ durationLabel }: { durationLabel: string }) {
  return (
    <div className="mb-2 flex items-center gap-2.5 rounded-lg bg-black/20 p-2">
      <button
        type="button"
        aria-label="Putar pesan suara"
        className="grid size-7 shrink-0 place-items-center rounded-full bg-sky-500/20 text-sky-300 transition-colors hover:bg-sky-500/30"
      >
        <Play className="size-3.5 translate-x-px" />
      </button>
      <div className="flex flex-1 items-center gap-[3px]" aria-hidden="true">
        {VOICE_BARS.map((bar) => (
          <span
            key={bar.id}
            className="w-[3px] rounded-full bg-sky-400/60"
            style={{ height: bar.height }}
          />
        ))}
      </div>
      <span className={cn(MONO, "shrink-0 text-[11px] text-white/40")}>
        {durationLabel}
      </span>
    </div>
  );
}

function AssistCaption({ assist }: { assist: AccessibilityAssist }) {
  const { icon: Icon, label, tone } = ASSIST_META[assist];
  return (
    <p
      className={cn(
        "mt-2 flex items-center gap-1.5 font-inter-600 text-[10px] uppercase tracking-wide",
        tone,
      )}
    >
      <Icon className="size-3" />
      {label}
    </p>
  );
}

/* -------------------------------------------------------------------------- */
/*  Shared map pieces                                                          */
/* -------------------------------------------------------------------------- */

function SharedMap({
  nodes,
  edges,
  participants,
}: {
  nodes: SharedMapNode[];
  edges: SharedMapEdge[];
  participants: Participant[];
}) {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const presencePeer = participants[0];

  return (
    <div className="relative flex-1 overflow-hidden bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:22px_22px]">
      <svg
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
        preserveAspectRatio="none"
      >
        <title>Koneksi antar node</title>
        {edges.map((edge) => {
          const source = nodeById.get(edge.source);
          const target = nodeById.get(edge.target);
          if (!source || !target) return null;
          return (
            <line
              key={edge.id}
              x1={`${source.x}%`}
              y1={`${source.y}%`}
              x2={`${target.x}%`}
              y2={`${target.y}%`}
              stroke="rgba(255,255,255,0.14)"
              strokeWidth={1.5}
            />
          );
        })}
      </svg>

      {nodes.map((node) => {
        const editor = node.editingBy
          ? participants.find((p) => p.id === node.editingBy)
          : undefined;
        return (
          <MapNodeCard key={node.id} node={node} editorColor={editor?.color} />
        );
      })}

      {presencePeer && (
        <span
          className="absolute flex size-7 -translate-x-1/2 -translate-y-1/2 place-items-center justify-center rounded-full border-2 border-primary-dark text-[10px] font-inter-600 text-primary-dark"
          style={{
            left: "14%",
            top: "16%",
            backgroundColor: presencePeer.color,
          }}
          title={`${presencePeer.name} sedang melihat`}
        >
          {presencePeer.name.charAt(0)}
        </span>
      )}

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-white/10 bg-[#0b1220]/95 p-1.5 shadow-xl backdrop-blur">
        <MapToolButton label="Tambah node">
          <Plus className="size-4" />
        </MapToolButton>
        <MapToolButton label="Hubungkan node">
          <Link2 className="size-4" />
        </MapToolButton>
        <MapToolButton label="Unduh peta">
          <Download className="size-4" />
        </MapToolButton>
      </div>
    </div>
  );
}

function MapNodeCard({
  node,
  editorColor,
}: {
  node: SharedMapNode;
  editorColor?: string;
}) {
  const isPrimary = node.variant === "primary";
  return (
    <div
      className={cn(
        "absolute -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-[#0b1220]/90 shadow-lg backdrop-blur-sm",
        isPrimary ? "px-4 py-2.5 border-white/25" : "px-3 py-2 border-white/12",
      )}
      style={{
        left: `${node.x}%`,
        top: `${node.y}%`,
        boxShadow: editorColor ? `0 0 0 1px ${editorColor}66` : undefined,
      }}
    >
      <p
        className={cn(
          "font-inter-600 text-white",
          isPrimary ? "text-sm" : "text-xs text-white/80",
        )}
      >
        {node.label}
      </p>
      {node.caption && (
        <p className="mt-0.5 text-[10px] text-white/40">{node.caption}</p>
      )}
      {editorColor && (
        <span
          className="absolute -top-1.5 -right-1.5 size-3 rounded-[4px]"
          style={{ backgroundColor: editorColor }}
        />
      )}
    </div>
  );
}

function MapToolButton({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="grid size-8 place-items-center rounded-lg text-white/60 transition-colors hover:bg-white/5 hover:text-white"
    >
      {children}
    </button>
  );
}
