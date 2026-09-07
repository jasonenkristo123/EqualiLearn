"use client";

import {
  FileText,
  Hash,
  ListChecks,
  MapPin,
  Mic,
  MicOff,
  Sparkles,
  Zap,
} from "lucide-react";
import type { ComponentType, ReactNode, SVGProps } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useSpeechToText } from "../hooks/useSpeechToText";
import type { SpeechToTextStatus } from "../type/speech-to-text.type";

export interface TranscriptEntry {
  id: string;
  timestamp: string;
  text: string;
  interim?: boolean;
}

export interface ActionItem {
  id: string;
  label: string;
  done: boolean;
}

export interface SummaryData {
  takeaways: string[];
  keyTerms: string[];
  actionItems: ActionItem[];
}

const MOCK_SUMMARY: SummaryData = {
  takeaways: [
    "Latency between API Gateway and microservices identified as primary bottleneck.",
    "Edge caching implementation (Redis test) yielded a 40% reduction in response time.",
  ],
  keyTerms: [
    "Router Architecture",
    "API Gateway",
    "Redis Caching",
    "Microservices",
  ],
  actionItems: [
    {
      id: "a1",
      label:
        "Draft cache invalidation rules document (Owner: John, Due: Friday)",
      done: false,
    },
    { id: "a2", label: "Review edge caching deployment pipeline", done: false },
  ],
};

/** Static bar heights (px) for the recording waveform placeholder. */
const WAVE_BARS = [
  8, 16, 24, 32, 20, 12, 28, 36, 22, 14, 30, 18, 26, 10, 34, 24, 16, 28, 20, 12,
  32, 22, 14, 26, 18, 30, 10, 24, 16, 20,
].map((height, i) => ({ id: `wave-${i}`, height }));

const MONO = "font-[ui-monospace,SFMono-Regular,Menlo,monospace]";

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

interface LiveTranscribeProps {
  entries?: TranscriptEntry[];
  summary?: SummaryData;
  /** Elapsed recording time in seconds when the view mounts. */
  initialElapsedSeconds?: number;
  onGenerateSummary?: () => void;
  onExport?: () => void;
  onToggleRecording?: (recording: boolean) => void;
}

export default function LiveTranscribe({
  entries,
  summary = MOCK_SUMMARY,
  initialElapsedSeconds = 0,
  onGenerateSummary,
  onExport,
  onToggleRecording,
}: LiveTranscribeProps) {
  const [elapsed, setElapsed] = useState(initialElapsedSeconds);
  // Local until the WS layer owns action-item state; toggling is optimistic.
  const [actionItems, setActionItems] = useState(summary.actionItems);

  const transcriptRef = useRef<HTMLDivElement>(null);
  const {
    status,
    transcripts,
    interim,
    finalText,
    sessionId,
    errorMessage,
    start,
    stop,
  } = useSpeechToText("id-ID");
  const isRecording = status === "recording";
  const isActive =
    isRecording ||
    status === "connecting" ||
    status === "requesting-permission";
  const isStopping = status === "stopping";

  const realtimeEntries = useMemo<TranscriptEntry[]>(() => {
    const finalEntries = transcripts.map((transcript) => ({
      id: transcript.id,
      timestamp: formatTranscriptTimestamp(transcript.timestamp),
      text: transcript.text,
    }));

    if (!interim) {
      if (finalEntries.length > 0 || !finalText.trim()) return finalEntries;
      return [
        {
          id: `${sessionId ?? "transcript"}-finished`,
          timestamp: formatTranscriptTimestamp(new Date().toISOString()),
          text: finalText,
        },
      ];
    }
    return [
      ...finalEntries,
      {
        id: `${interim.session_id}-interim`,
        timestamp: formatTranscriptTimestamp(interim.timestamp),
        text: interim.text,
        interim: true,
      },
    ];
  }, [finalText, interim, sessionId, transcripts]);

  const visibleEntries = entries ?? realtimeEntries;

  // Tick the recording timer while recording.
  useEffect(() => {
    if (!isRecording) return;
    const id = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [isRecording]);

  // Keep the transcript pinned to the newest line as entries stream in.
  useEffect(() => {
    if (visibleEntries.length === 0) return;
    const el = transcriptRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [visibleEntries]);

  useEffect(() => {
    onToggleRecording?.(isRecording);
  }, [isRecording, onToggleRecording]);

  const toggleRecording = async () => {
    if (isActive) {
      await stop();
      return;
    }

    setElapsed(0);
    await start();
  };

  const toggleActionItem = (id: string) => {
    setActionItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item,
      ),
    );
  };

  return (
    <div className="flex flex-col gap-4 p-4 lg:h-[calc(100dvh-3.5rem)] lg:flex-row lg:gap-6 lg:overflow-hidden lg:p-6">
      <Panel className="min-h-[560px] lg:min-h-0 lg:flex-[5]">
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                "size-2 rounded-full",
                isRecording
                  ? "bg-sky-400 motion-safe:animate-pulse"
                  : "bg-white/25",
              )}
            />
            <span className="font-inter-600 text-sm text-white">
              {STATUS_LABELS[status]}
            </span>
            <span className={cn(MONO, "text-xs tabular-nums text-white/40")}>
              {formatElapsed(elapsed)}
            </span>
          </div>
          <button
            type="button"
            onClick={toggleRecording}
            disabled={isStopping}
            aria-pressed={isActive}
            aria-label={isActive ? "Hentikan perekaman" : "Mulai perekaman"}
            className="grid size-9 place-items-center rounded-full border border-white/15 text-white transition-colors hover:bg-white/5 disabled:cursor-wait disabled:opacity-40"
          >
            {isActive ? (
              <MicOff className="size-4" />
            ) : (
              <Mic className="size-4" />
            )}
          </button>
        </header>

        <div className="flex h-16 items-center justify-center border-b border-white/10 px-5">
          <Waveform active={isRecording} />
        </div>

        <div
          ref={transcriptRef}
          className="flex-1 space-y-5 overflow-y-auto px-5 py-5"
        >
          {errorMessage && (
            <p
              role="alert"
              className="rounded-lg bg-red-400/10 p-3 text-sm text-red-300"
            >
              {errorMessage}
            </p>
          )}

          {!errorMessage && visibleEntries.length === 0 && (
            <p className="py-12 text-center text-sm text-white/35">
              Tekan tombol mikrofon untuk mulai merekam dan menampilkan
              transkrip.
            </p>
          )}

          {visibleEntries.map((entry) => (
            <article
              key={entry.id}
              className={cn(
                "flex gap-4",
                entry.interim && "border-l-2 border-sky-400 pl-4",
              )}
            >
              <time
                className={cn(
                  MONO,
                  "mt-0.5 shrink-0 text-[10px] uppercase tracking-wide text-white/30",
                )}
              >
                {entry.timestamp}
              </time>
              <p className="text-sm leading-relaxed text-white/70">
                {entry.text}
              </p>
            </article>
          ))}
        </div>

        <footer className="border-t border-white/10 p-3">
          <FooterButton icon={Sparkles} onClick={onGenerateSummary}>
            Buat Ringkasan Otomatis
          </FooterButton>
        </footer>
      </Panel>

      <Panel className="min-h-[560px] lg:min-h-0 lg:flex-[6]">
        <header className="border-b border-white/10 px-6 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-serif text-2xl text-white">Ringkasan AI</h2>
              <p className="mt-1 text-sm text-white/50">
                Sintesis cerdas dari percakapan berjalan
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 font-inter-500 text-xs text-cyan">
              <Zap className="size-3" />
              Realtime AI
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-5">
            <button
              type="button"
              onClick={onGenerateSummary}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3.5 font-inter-600 text-sm text-primary-dark transition-colors hover:bg-white/90"
            >
              <Zap className="size-4" />
              Ringkas Transkrip Sekarang
            </button>
          </div>

          <Section icon={MapPin} title="Key Takeaways">
            <ul className="space-y-2.5">
              {summary.takeaways.map((takeaway) => (
                <li
                  key={takeaway}
                  className="flex gap-2.5 text-sm leading-relaxed text-white/70"
                >
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-sky-400" />
                  {takeaway}
                </li>
              ))}
            </ul>
          </Section>

          <Divider />

          <Section icon={Hash} title="Key Terms">
            <div className="flex flex-wrap gap-2">
              {summary.keyTerms.map((term) => (
                <span
                  key={term}
                  className="rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-white/60"
                >
                  {term}
                </span>
              ))}
            </div>
          </Section>

          <Divider />

          <Section icon={ListChecks} title="Action Items">
            <ul className="space-y-3">
              {actionItems.map((item) => (
                <li key={item.id}>
                  <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-white/70">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => toggleActionItem(item.id)}
                      className="mt-0.5 size-4 shrink-0 rounded border-white/20 bg-white/5 accent-cyan"
                    />
                    <span
                      className={cn(item.done && "text-white/40 line-through")}
                    >
                      {item.label}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </Section>
        </div>

        <footer className="border-t border-white/10 p-3">
          <FooterButton icon={FileText} onClick={onExport}>
            Ekspor Ringkasan PDF/Text
          </FooterButton>
        </footer>
      </Panel>
    </div>
  );
}

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

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="px-6 py-5">
      <h3 className="mb-3 flex items-center gap-2 font-inter-600 text-[11px] uppercase tracking-wider text-white/40">
        <Icon className="size-3.5" />
        {title}
      </h3>
      {children}
    </section>
  );
}

function Divider() {
  return <div className="mx-6 border-t border-white/[0.06]" />;
}

function FooterButton({
  icon: Icon,
  onClick,
  children,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/[0.03] px-4 py-3 font-inter-500 text-sm text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
    >
      <Icon className="size-4" />
      {children}
    </button>
  );
}

function Waveform({ active }: { active: boolean }) {
  return (
    <div className="flex items-center gap-[3px]" aria-hidden="true">
      {WAVE_BARS.map((bar, i) => (
        <span
          key={bar.id}
          className={cn(
            "w-[3px] rounded-full bg-sky-400",
            active ? "motion-safe:animate-pulse" : "opacity-30",
          )}
          style={{
            height: active
              ? bar.height
              : Math.max(4, Math.round(bar.height / 3)),
            animationDelay: `${(i % 10) * 90}ms`,
            animationDuration: `${900 + (i % 5) * 160}ms`,
          }}
        />
      ))}
    </div>
  );
}

function formatElapsed(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}

const STATUS_LABELS: Record<SpeechToTextStatus, string> = {
  idle: "Siap Merekam",
  "requesting-permission": "Meminta Izin Mikrofon",
  connecting: "Menghubungkan",
  recording: "Live Recording",
  stopping: "Menghentikan Rekaman",
  stopped: "Rekaman Selesai",
  error: "Perekaman Bermasalah",
};

function formatTranscriptTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;

  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
