"use client";

import {
  FileText,
  Mic,
  Pause,
  Play,
  Plus,
  Presentation,
  ScrollText,
  SkipBack,
  SkipForward,
  Sparkles,
  Zap,
} from "lucide-react";
import type { ComponentType, ReactNode, SVGProps } from "react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type DocumentKind = "pdf" | "ppt";
export type DocumentStatus = "ready" | "processing";

export interface SourceDocument {
  id: string;
  name: string;
  kind: DocumentKind;
  pageCount: number;
  durationLabel: string;
  status: DocumentStatus;
}

export interface Takeaway {
  id: string;
  title: string;
  summary: string;
  tags?: string[];
}

export interface TranscriptParagraph {
  id: string;
  text: string;
  /** Playback offset (seconds) this paragraph starts at — drives audio sync later. */
  atSeconds: number;
}

const MOCK_DOCUMENTS: SourceDocument[] = [
  {
    id: "doc-1",
    name: "Materi_Jaringan_Komputer.pdf",
    kind: "pdf",
    pageCount: 24,
    durationLabel: "03:30 min",
    status: "ready",
  },
  {
    id: "doc-2",
    name: "Slide_OSI_Layer_V2.ppt",
    kind: "ppt",
    pageCount: 18,
    durationLabel: "02:45 min",
    status: "ready",
  },
];

const MOCK_TAKEAWAYS: Takeaway[] = [
  {
    id: "tk-1",
    title: "Overview Topologi Jaringan",
    summary:
      "Pemahaman dasar mengenai struktur fisik dan logis dari jaringan komputer modern.",
  },
  {
    id: "tk-2",
    title: "Lapisan OSI Model",
    summary: "Analisis 7 layer OSI untuk standarisasi komunikasi sistem.",
    tags: ["Physical", "Data Link", "Network"],
  },
  {
    id: "tk-3",
    title: "TCP/IP Protocol Suite",
    summary:
      "Perbandingan antara model referensi OSI dengan implementasi praktis TCP/IP.",
  },
];

const MOCK_TRANSCRIPT: TranscriptParagraph[] = [
  {
    id: "p-1",
    atSeconds: 0,
    text: "Model Open Systems Interconnection (OSI) dikembangkan oleh International Organization for Standardization (ISO) pada tahun 1984.",
  },
  {
    id: "p-2",
    atSeconds: 24,
    text: "Ini adalah model arsitektur jaringan yang secara konseptual membagi metode komunikasi jaringan menjadi tujuh lapisan.",
  },
  {
    id: "p-3",
    atSeconds: 58,
    text: "Lapisan-lapisan ini, dari bawah ke atas, meliputi: Physical, Data Link, Network, Transport, Session, Presentation, dan Application. Masing-masing memiliki fungsi spesifik dan hanya berkomunikasi dengan lapisan tepat di atas dan di bawahnya.",
  },
  {
    id: "p-4",
    atSeconds: 108,
    text: "Pemahaman tentang model ini sangat krusial bagi administrator jaringan untuk melakukan troubleshooting (pemecahan masalah).",
  },
  {
    id: "p-5",
    atSeconds: 142,
    text: "Misalnya, jika ada masalah pada konektivitas fisik kabel, ini berada di ranah Layer 1 (Physical). Namun jika masalahnya ada pada routing IP, itu adalah ranah Layer 3 (Network).",
  },
  {
    id: "p-6",
    atSeconds: 184,
    text: "Meskipun dalam praktiknya model TCP/IP lebih umum digunakan, model OSI tetap menjadi standar referensi konseptual yang tak tergantikan dalam pendidikan jaringan komputer.",
  },
];

const PLAYBACK_SPEEDS = [1, 1.25, 1.5, 1.75, 2] as const;
const MONO = "font-[ui-monospace,SFMono-Regular,Menlo,monospace]";

interface PptAudioProps {
  documents?: SourceDocument[];
  takeaways?: Takeaway[];
  transcript?: TranscriptParagraph[];
  durationSeconds?: number;
  initialPositionSeconds?: number;
  onUpload?: () => void;
  onSelectDocument?: (id: string) => void;
}

export default function PptAudio({
  documents = MOCK_DOCUMENTS,
  takeaways = MOCK_TAKEAWAYS,
  transcript = MOCK_TRANSCRIPT,
  durationSeconds = 218,
  initialPositionSeconds = 194,
  onUpload,
  onSelectDocument,
}: PptAudioProps) {
  const [activeDocId, setActiveDocId] = useState(documents[0]?.id ?? "");
  const [activeTakeawayId, setActiveTakeawayId] = useState(
    takeaways[1]?.id ?? takeaways[0]?.id ?? "",
  );
  // Explicit for now; real audio sync will derive this from `position` + `atSeconds`.
  const [activeParagraphId, setActiveParagraphId] = useState(
    transcript[2]?.id ?? transcript[0]?.id ?? "",
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(
    Math.min(initialPositionSeconds, durationSeconds),
  );
  const [speedIndex, setSpeedIndex] = useState(0);

  const activeDoc =
    documents.find((doc) => doc.id === activeDocId) ?? documents[0];
  const speed = PLAYBACK_SPEEDS[speedIndex];
  const progressPct = durationSeconds ? (position / durationSeconds) * 100 : 0;

  // Advance the playhead while playing; stop at the end.
  useEffect(() => {
    if (!isPlaying) return;
    const id = window.setInterval(() => {
      setPosition((prev) => {
        const next = prev + 1;
        if (next >= durationSeconds) {
          setIsPlaying(false);
          return durationSeconds;
        }
        return next;
      });
    }, 1000 / speed);
    return () => window.clearInterval(id);
  }, [isPlaying, speed, durationSeconds]);

  const togglePlay = () => {
    setPosition((prev) => (prev >= durationSeconds ? 0 : prev));
    setIsPlaying((v) => !v);
  };

  const selectDocument = (id: string) => {
    setActiveDocId(id);
    onSelectDocument?.(id);
  };

  const seekToParagraph = (paragraph: TranscriptParagraph) => {
    setActiveParagraphId(paragraph.id);
    setPosition(Math.min(paragraph.atSeconds, durationSeconds));
  };

  return (
    <div className="flex flex-col gap-4 p-4 lg:h-[calc(100dvh-3.5rem)] lg:overflow-hidden lg:p-6">
      {/* -------------------------------------------------------------- */}
      {/*  Toolbar: source documents + metadata + upload                 */}
      {/* -------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {documents.map((doc) => (
            <DocTab
              key={doc.id}
              doc={doc}
              active={doc.id === activeDoc?.id}
              onClick={() => selectDocument(doc.id)}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {activeDoc && (
            <p className="flex items-center gap-2 text-xs text-white/40">
              <span>{activeDoc.pageCount} Halaman</span>
              <span aria-hidden="true">•</span>
              <span>{activeDoc.durationLabel}</span>
              <span aria-hidden="true">•</span>
              <span
                className={cn(
                  activeDoc.status === "ready"
                    ? "text-sky-400"
                    : "text-white/50",
                )}
              >
                {activeDoc.status === "ready" ? "Selesai" : "Memproses…"}
              </span>
            </p>
          )}
          <button
            type="button"
            onClick={onUpload}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.03] px-3 py-1.5 font-inter-500 text-xs text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <Plus className="size-3.5" />
            Unggah PDF/PPT Baru
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------- */}
      {/*  Takeaways + synchronized transcript                           */}
      {/* -------------------------------------------------------------- */}
      <div className="flex flex-1 flex-col gap-4 lg:min-h-0 lg:flex-row lg:gap-6 lg:overflow-hidden">
        <Panel className="min-h-[420px] lg:min-h-0 lg:w-[340px] lg:shrink-0">
          <PanelHeader icon={Sparkles} title="AI Key Takeaways" />
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {takeaways.map((takeaway) => (
              <TakeawayCard
                key={takeaway.id}
                takeaway={takeaway}
                active={takeaway.id === activeTakeawayId}
                onClick={() => setActiveTakeawayId(takeaway.id)}
              />
            ))}
          </div>
        </Panel>

        <Panel className="min-h-[420px] lg:min-h-0 lg:flex-1">
          <PanelHeader
            icon={ScrollText}
            title="Transkrip tersinkronisasi"
            action={
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 font-inter-500 text-xs text-cyan">
                <Zap className="size-3" />
                Live Sync
              </span>
            }
          />
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
            {transcript.map((paragraph) => {
              const active = paragraph.id === activeParagraphId;
              return (
                <button
                  key={paragraph.id}
                  type="button"
                  onClick={() => seekToParagraph(paragraph)}
                  className={cn(
                    "relative block w-full pl-4 text-left text-sm leading-relaxed transition-colors",
                    active
                      ? "border-l-2 border-sky-400 text-white"
                      : "text-white/55 hover:text-white/80",
                  )}
                >
                  {active && (
                    <span className="absolute -left-[5px] top-1.5 size-2 rounded-full bg-sky-400" />
                  )}
                  {paragraph.text}
                </button>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* -------------------------------------------------------------- */}
      {/*  Audio player                                                  */}
      {/* -------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
        <div className="flex items-center gap-1">
          <IconButton label="Ke awal" onClick={() => setPosition(0)}>
            <SkipBack className="size-4" />
          </IconButton>
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? "Jeda" : "Putar"}
            className="grid size-11 place-items-center rounded-full bg-white text-primary-dark transition-transform hover:scale-105"
          >
            {isPlaying ? (
              <Pause className="size-5" />
            ) : (
              <Play className="size-5 translate-x-px" />
            )}
          </button>
          <IconButton
            label="Ke akhir"
            onClick={() => {
              setPosition(durationSeconds);
              setIsPlaying(false);
            }}
          >
            <SkipForward className="size-4" />
          </IconButton>
        </div>

        <div className="flex min-w-[220px] flex-1 items-center gap-3">
          <span className={cn(MONO, "text-xs tabular-nums text-white/50")}>
            {formatTime(position)}
          </span>
          <div className="relative flex-1">
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-sky-400"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={durationSeconds}
              value={position}
              onChange={(e) => setPosition(Number(e.target.value))}
              aria-label="Posisi pemutaran"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </div>
          <span className={cn(MONO, "text-xs tabular-nums text-white/50")}>
            {formatTime(durationSeconds)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              setSpeedIndex((i) => (i + 1) % PLAYBACK_SPEEDS.length)
            }
            aria-label={`Kecepatan pemutaran ${formatSpeed(speed)}x`}
            className="rounded-md border border-white/15 bg-white/[0.03] px-2.5 py-1 font-inter-500 text-xs tabular-nums text-white/70 transition-colors hover:text-white"
          >
            {formatSpeed(speed)}x
          </button>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-cyan/30 bg-cyan/10 px-2.5 py-1 font-inter-500 text-xs text-cyan">
            <Mic className="size-3" />
            AI Narrator
          </span>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Local building blocks                                                      */
/* -------------------------------------------------------------------------- */

function Panel({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]",
        className,
      )}
    >
      {children}
    </section>
  );
}

function PanelHeader({
  icon: Icon,
  title,
  action,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
      <h2 className="flex items-center gap-2 font-inter-600 text-sm text-white">
        <Icon className="size-4 text-lightblue" />
        {title}
      </h2>
      {action}
    </header>
  );
}

function DocTab({
  doc,
  active,
  onClick,
}: {
  doc: SourceDocument;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = doc.kind === "pdf" ? FileText : Presentation;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-colors",
        active
          ? "border-white/25 bg-white/[0.06] text-white"
          : "border-transparent text-white/45 hover:text-white/70",
      )}
    >
      <Icon
        className={cn("size-3.5", active ? "text-sky-400" : "text-white/40")}
      />
      {doc.name}
    </button>
  );
}

function TakeawayCard({
  takeaway,
  active,
  onClick,
}: {
  takeaway: Takeaway;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "block w-full rounded-xl border p-4 text-left transition-colors",
        active
          ? "border-white/25 bg-white/[0.05]"
          : "border-white/10 bg-white/[0.02] hover:border-white/20",
      )}
    >
      <h3 className="font-inter-600 text-sm text-white">{takeaway.title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-white/50">
        {takeaway.summary}
      </p>
      {takeaway.tags && takeaway.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {takeaway.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[11px] text-white/55"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid size-8 place-items-center rounded-md text-white/60 transition-colors hover:bg-white/5 hover:text-white"
    >
      {children}
    </button>
  );
}

function formatTime(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(s / 60);
  return `${String(minutes).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function formatSpeed(speed: number) {
  return speed.toFixed(2).replace(/(\.\d)0$/, "$1");
}
