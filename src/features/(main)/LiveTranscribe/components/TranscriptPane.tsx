import { Mic, MicOff, Sparkles } from "lucide-react";
import type { RefObject } from "react";
import { cn } from "@/lib/utils";
import type {
  SpeechToTextStatus,
  TranscriptEntry,
} from "../type/speech-to-text.type";
import { formatElapsed, MONO, STATUS_LABELS } from "../util/format";
import { FooterButton } from "./FooterButton";
import { Panel } from "./Panel";
import { Waveform } from "./Waveform";

export function TranscriptPane({
  status,
  elapsed,
  isRecording,
  isActive,
  isStopping,
  errorMessage,
  entries,
  transcriptRef,
  onToggleRecording,
  onGenerateSummary,
}: {
  status: SpeechToTextStatus;
  elapsed: number;
  isRecording: boolean;
  isActive: boolean;
  isStopping: boolean;
  errorMessage: string | null;
  entries: TranscriptEntry[];
  transcriptRef: RefObject<HTMLDivElement | null>;
  onToggleRecording: () => void;
  onGenerateSummary?: () => void;
}) {
  return (
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
          onClick={onToggleRecording}
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
            className="rounded-lg bg-red-400/10 p-3 text-sm text-app-danger"
          >
            {errorMessage}
          </p>
        )}

        {!errorMessage && entries.length === 0 && (
          <p className="py-12 text-center text-sm text-white/35">
            Tekan tombol mikrofon untuk mulai merekam dan menampilkan transkrip.
          </p>
        )}

        {entries.map((entry) => (
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
  );
}
