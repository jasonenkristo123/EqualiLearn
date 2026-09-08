"use client";

import {
  AlertCircle,
  FileText,
  LoaderCircle,
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
import { useRouter } from "next/navigation";
import type { ChangeEvent, ComponentType, ReactNode, SVGProps } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import {
  useDocument,
  useSpeechVoices,
  useSummarizeDocument,
  useSynthesizeSpeech,
} from "../hooks/usePptAudio";
import { getPptAudioErrorMessage } from "../service/api";
import { normalizeDocumentSummary } from "../service/normalize-summary";
import type {
  SourceDocument,
  Takeaway,
  TranscriptParagraph,
} from "../type/ppt-audio.type";

export type {
  DocumentKind,
  DocumentStatus,
  SourceDocument,
  Takeaway,
  TranscriptParagraph,
} from "../type/ppt-audio.type";

const PLAYBACK_SPEEDS = [1, 1.25, 1.5, 1.75, 2] as const;
const MONO = "font-[ui-monospace,SFMono-Regular,Menlo,monospace]";

interface PptAudioProps {
  initialDocumentId?: string;
  documents?: SourceDocument[];
  takeaways?: Takeaway[];
  transcript?: TranscriptParagraph[];
  durationSeconds?: number;
  initialPositionSeconds?: number;
  onUpload?: () => void;
  onSelectDocument?: (id: string) => void;
}

export default function PptAudio({
  initialDocumentId = "",
  documents = [],
  takeaways = [],
  transcript = [],
  durationSeconds = 0,
  initialPositionSeconds = 0,
  onUpload,
  onSelectDocument,
}: PptAudioProps) {
  const router = useRouter();
  const [documentItems, setDocumentItems] = useState(documents);
  const [displayTakeaways, setDisplayTakeaways] = useState(takeaways);
  const [displayTranscript, setDisplayTranscript] = useState(transcript);
  const [activeDocId, setActiveDocId] = useState(
    initialDocumentId || documents[0]?.id || "",
  );
  const [activeTakeawayId, setActiveTakeawayId] = useState(
    takeaways[0]?.id ?? "",
  );
  const [activeParagraphId, setActiveParagraphId] = useState(
    transcript[0]?.id ?? "",
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(
    Math.min(initialPositionSeconds, durationSeconds),
  );
  const [playbackDuration, setPlaybackDuration] = useState(durationSeconds);
  const [speedIndex, setSpeedIndex] = useState(0);
  const [selectedVoiceId, setSelectedVoiceId] = useState("");
  const [narrationText, setNarrationText] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [restoreDocumentId, setRestoreDocumentId] = useState(initialDocumentId);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioUrlRef = useRef<string | null>(null);
  const pendingPlayRef = useRef(false);

  const documentQuery = useDocument(restoreDocumentId);
  const voicesQuery = useSpeechVoices();
  const summarizeMutation = useSummarizeDocument();
  const synthesizeMutation = useSynthesizeSpeech();

  const voices = voicesQuery.data?.data ?? [];
  const activeVoiceId = selectedVoiceId || voices[0]?.id || "aura-asteria-en";
  const activeDoc =
    documentItems.find((doc) => doc.id === activeDocId) ?? documentItems[0];
  const speed = PLAYBACK_SPEEDS[speedIndex];
  const progressPct = playbackDuration
    ? (position / playbackDuration) * 100
    : 0;
  const isProcessing =
    summarizeMutation.isPending || synthesizeMutation.isPending;

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.playbackRate = speed;
  }, [speed]);

  useEffect(
    () => () => {
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    },
    [],
  );

  const replaceAudioUrl = useCallback((nextUrl: string | null) => {
    audioRef.current?.pause();
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = nextUrl;
    setAudioUrl(nextUrl);
    setIsPlaying(false);
    setPosition(0);
    setPlaybackDuration(0);
  }, []);

  useEffect(() => {
    if (!documentQuery.data) return;

    const normalized = normalizeDocumentSummary(documentQuery.data);
    if (!normalized.documentId) return;

    const restoredDocument: SourceDocument = {
      id: normalized.documentId,
      name: normalized.fileName,
      kind:
        normalized.fileType.toLowerCase() === "pdf" ||
        normalized.fileName.toLowerCase().endsWith(".pdf")
          ? "pdf"
          : "ppt",
      pageCount: normalized.pageCount,
      durationLabel: "Audio siap dibuat",
      status: "ready",
    };

    replaceAudioUrl(null);
    setDocumentItems([restoredDocument]);
    setActiveDocId(restoredDocument.id);
    setDisplayTakeaways(normalized.takeaways);
    setDisplayTranscript(normalized.transcript);
    setActiveTakeawayId(normalized.takeaways[0]?.id ?? "");
    setActiveParagraphId(normalized.transcript[0]?.id ?? "");
    setNarrationText(normalized.narrationText);
  }, [documentQuery.data, replaceAudioUrl]);

  useEffect(() => {
    if (!documentQuery.error) return;
    toast.error(
      getPptAudioErrorMessage(
        documentQuery.error,
        "Dokumen tersimpan gagal dimuat.",
      ),
    );
  }, [documentQuery.error]);

  const createNarration = async (
    text: string,
    voice: string,
    playWhenReady = false,
  ) => {
    if (!text.trim()) {
      toast.error("Ringkasan tidak berisi teks untuk dibuat menjadi audio.");
      return;
    }

    pendingPlayRef.current = playWhenReady;
    try {
      const audioBlob = await synthesizeMutation.mutateAsync({
        text,
        voice,
        format: "mp3",
      });
      replaceAudioUrl(URL.createObjectURL(audioBlob));
    } catch (error) {
      pendingPlayRef.current = false;
      toast.error(
        getPptAudioErrorMessage(error, "Gagal membuat narasi audio."),
      );
      throw error;
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const temporaryId = `${file.name}-${file.lastModified}`;
    const pendingDocument: SourceDocument = {
      id: temporaryId,
      name: file.name,
      kind: file.name.toLowerCase().endsWith(".pdf") ? "pdf" : "ppt",
      pageCount: 0,
      durationLabel: "Menunggu audio",
      status: "processing",
    };

    replaceAudioUrl(null);
    setNarrationText("");
    setDocumentItems((current) => [
      pendingDocument,
      ...current.filter((document) => document.id !== temporaryId),
    ]);
    setActiveDocId(temporaryId);
    setDisplayTakeaways([]);
    setDisplayTranscript([]);
    onUpload?.();

    try {
      const response = await summarizeMutation.mutateAsync({
        file,
        language: "en",
        detailLevel: "balanced",
        targetAudience: "student",
        saveToHistory: true,
      });
      const normalized = normalizeDocumentSummary(response, file);
      const completedDocument: SourceDocument = {
        ...pendingDocument,
        id: normalized.documentId,
        pageCount: normalized.pageCount,
        status: "ready",
      };

      setDocumentItems((current) => [
        completedDocument,
        ...current.filter((document) => document.id !== temporaryId),
      ]);
      setActiveDocId(normalized.documentId);
      setDisplayTakeaways(normalized.takeaways);
      setDisplayTranscript(normalized.transcript);
      setActiveTakeawayId(normalized.takeaways[0]?.id ?? "");
      setActiveParagraphId(normalized.transcript[0]?.id ?? "");
      setNarrationText(normalized.narrationText);
      toast.success("Dokumen berhasil diringkas.");
      router.replace(
        `/ppt-audio?documentId=${encodeURIComponent(normalized.documentId)}`,
        { scroll: false },
      );

      if (normalized.narrationText) {
        try {
          await createNarration(normalized.narrationText, activeVoiceId);
        } catch {
          // The summary remains usable when speech synthesis is unavailable.
        }
      }
    } catch (error) {
      setDocumentItems((current) =>
        current.map((document) =>
          document.id === temporaryId
            ? { ...document, status: "error" }
            : document,
        ),
      );
      toast.error(
        getPptAudioErrorMessage(error, "Gagal mengunggah dan meringkas file."),
      );
    }
  };

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audioUrl || !audio) {
      if (narrationText && !synthesizeMutation.isPending) {
        try {
          await createNarration(narrationText, activeVoiceId, true);
        } catch {
          // Error feedback is handled by createNarration.
        }
      }
      return;
    }

    if (audio.paused) {
      await audio.play().catch(() => {
        toast.error("Browser tidak dapat memutar audio ini.");
      });
    } else {
      audio.pause();
    }
  };

  const selectDocument = (id: string) => {
    setActiveDocId(id);
    setRestoreDocumentId(id);
    router.replace(`/ppt-audio?documentId=${encodeURIComponent(id)}`, {
      scroll: false,
    });
    onSelectDocument?.(id);
  };

  const seekToParagraph = (paragraph: TranscriptParagraph) => {
    setActiveParagraphId(paragraph.id);
    const nextPosition = Math.min(paragraph.atSeconds, playbackDuration);
    setPosition(nextPosition);
    if (audioRef.current) audioRef.current.currentTime = nextPosition;
  };

  const seekAudio = (nextPosition: number) => {
    const clampedPosition = Math.max(
      0,
      Math.min(nextPosition, playbackDuration),
    );
    setPosition(clampedPosition);
    if (audioRef.current) audioRef.current.currentTime = clampedPosition;
  };

  const handleVoiceChange = async (event: ChangeEvent<HTMLSelectElement>) => {
    const voiceId = event.target.value;
    setSelectedVoiceId(voiceId);
    if (!narrationText) return;

    try {
      await createNarration(narrationText, voiceId);
      toast.success("Suara narator berhasil diganti.");
    } catch {
      // Error feedback is handled by createNarration.
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 lg:h-[calc(100dvh-3.5rem)] lg:overflow-hidden lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {documentQuery.isLoading && (
            <p className="px-2 text-xs text-white/40">Memuat dokumen…</p>
          )}
          {!documentQuery.isLoading && documentItems.length === 0 && (
            <p className="px-2 text-xs text-white/40">
              Belum ada dokumen yang diunggah
            </p>
          )}
          {documentItems.map((doc) => (
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
              {activeDoc.pageCount > 0 && (
                <>
                  <span>{activeDoc.pageCount} Halaman</span>
                  <span aria-hidden="true">•</span>
                </>
              )}
              <span>{activeDoc.durationLabel}</span>
              <span aria-hidden="true">•</span>
              <span
                className={cn(
                  activeDoc.status === "ready"
                    ? "text-app-accent"
                    : activeDoc.status === "error"
                      ? "text-app-danger"
                      : "text-white/50",
                )}
              >
                {activeDoc.status === "ready"
                  ? "Selesai"
                  : activeDoc.status === "error"
                    ? "Gagal"
                    : "Memproses…"}
              </span>
            </p>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.ppt,.pptx,.doc,.docx"
            onChange={handleFileChange}
            className="sr-only"
            aria-label="Pilih dokumen untuk diringkas"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.03] px-3 py-1.5 font-inter-500 text-xs text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white disabled:cursor-wait disabled:opacity-50"
          >
            {summarizeMutation.isPending ? (
              <LoaderCircle className="size-3.5 animate-spin" />
            ) : (
              <Plus className="size-3.5" />
            )}
            {summarizeMutation.isPending
              ? "Meringkas dokumen…"
              : "Unggah PDF/PPT Baru"}
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 lg:min-h-0 lg:flex-row lg:gap-6 lg:overflow-hidden">
        <Panel className="min-h-[420px] lg:min-h-0 lg:w-[340px] lg:shrink-0">
          <PanelHeader icon={Sparkles} title="AI Key Takeaways" />
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {(summarizeMutation.isPending || documentQuery.isLoading) && (
              <LoadingState />
            )}
            {!summarizeMutation.isPending &&
              !documentQuery.isLoading &&
              displayTakeaways.length === 0 && (
                <EmptyState message="Key takeaways akan muncul setelah dokumen selesai diringkas." />
              )}
            {displayTakeaways.map((takeaway) => (
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
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 font-inter-500 text-xs text-app-teal">
                <Zap className="size-3" />
                Live Sync
              </span>
            }
          />
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
            {(summarizeMutation.isPending || documentQuery.isLoading) && (
              <LoadingState />
            )}
            {!summarizeMutation.isPending &&
              !documentQuery.isLoading &&
              displayTranscript.length === 0 && (
                <EmptyState message="Teks dokumen akan ditampilkan di sini." />
              )}
            {displayTranscript.map((paragraph) => {
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

      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
        <audio
          ref={audioRef}
          src={audioUrl ?? undefined}
          preload="metadata"
          className="hidden"
          onLoadedMetadata={(event) => {
            const duration = event.currentTarget.duration;
            if (!Number.isFinite(duration)) return;
            setPlaybackDuration(duration);
            setDocumentItems((current) =>
              current.map((document) =>
                document.id === activeDocId
                  ? {
                      ...document,
                      durationLabel: `${formatTime(duration)} min`,
                    }
                  : document,
              ),
            );
          }}
          onTimeUpdate={(event) => setPosition(event.currentTarget.currentTime)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onError={() => {
            pendingPlayRef.current = false;
            setIsPlaying(false);
            toast.error("Audio tidak dapat dimuat oleh browser.");
          }}
          onCanPlay={(event) => {
            if (!pendingPlayRef.current) return;
            pendingPlayRef.current = false;
            void event.currentTarget.play().catch(() => {
              toast.error("Browser tidak dapat memutar audio ini.");
            });
          }}
        >
          <track kind="captions" />
        </audio>
        <div className="flex items-center gap-1">
          <IconButton label="Ke awal" onClick={() => seekAudio(0)}>
            <SkipBack className="size-4" />
          </IconButton>
          <button
            type="button"
            onClick={togglePlay}
            disabled={!narrationText || synthesizeMutation.isPending}
            aria-label={isPlaying ? "Jeda" : "Putar"}
            className="grid size-11 place-items-center rounded-full bg-white text-app-background transition-transform hover:scale-105 disabled:cursor-wait disabled:opacity-40 disabled:hover:scale-100"
          >
            {synthesizeMutation.isPending ? (
              <LoaderCircle className="size-5 animate-spin" />
            ) : isPlaying ? (
              <Pause className="size-5" />
            ) : (
              <Play className="size-5 translate-x-px" />
            )}
          </button>
          <IconButton
            label="Ke akhir"
            onClick={() => {
              seekAudio(playbackDuration);
              audioRef.current?.pause();
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
              max={playbackDuration || 0}
              value={position}
              onChange={(event) => seekAudio(Number(event.target.value))}
              disabled={!audioUrl}
              aria-label="Posisi pemutaran"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </div>
          <span className={cn(MONO, "text-xs tabular-nums text-white/50")}>
            {formatTime(playbackDuration)}
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
          <label className="inline-flex items-center gap-1.5 rounded-md border border-cyan/30 bg-cyan/10 px-2.5 py-1 font-inter-500 text-xs text-app-teal">
            <Mic className="size-3" />
            <span className="sr-only">Pilih suara AI Narrator</span>
            <select
              value={activeVoiceId}
              onChange={handleVoiceChange}
              disabled={voicesQuery.isLoading || synthesizeMutation.isPending}
              className="max-w-44 bg-transparent text-app-teal outline-none disabled:opacity-50"
            >
              {voices.length === 0 && (
                <option value="aura-asteria-en">AI Narrator</option>
              )}
              {voices.map((voice) => (
                <option
                  key={voice.id}
                  value={voice.id}
                  className="bg-app-background"
                >
                  {voice.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
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
  const Icon =
    doc.status === "error"
      ? AlertCircle
      : doc.kind === "pdf"
        ? FileText
        : Presentation;
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
        className={cn(
          "size-3.5",
          doc.status === "error"
            ? "text-app-danger"
            : active
              ? "text-app-accent"
              : "text-white/40",
        )}
      />
      {doc.name}
    </button>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-32 items-center justify-center gap-2 text-sm text-white/40">
      <LoaderCircle className="size-4 animate-spin" />
      Memproses dokumen…
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="flex min-h-32 items-center justify-center text-center text-sm leading-relaxed text-white/35">
      {message}
    </p>
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
