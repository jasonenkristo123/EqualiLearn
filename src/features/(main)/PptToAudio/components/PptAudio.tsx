"use client";

import { useRouter } from "next/navigation";
import type { ChangeEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
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
import { formatTime, PLAYBACK_SPEEDS } from "../util/format";
import { DocumentToolbar } from "./DocumentToolbar";
import { PlaybackBar } from "./PlaybackBar";
import { TakeawaysPanel } from "./TakeawaysPanel";
import { TranscriptPanel } from "./TranscriptPanel";

export type {
  DocumentKind,
  DocumentStatus,
  SourceDocument,
  Takeaway,
  TranscriptParagraph,
} from "../type/ppt-audio.type";

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
  const isProcessing =
    summarizeMutation.isPending || synthesizeMutation.isPending;
  const panelsLoading = summarizeMutation.isPending || documentQuery.isLoading;

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

  const handleDuration = (duration: number) => {
    setPlaybackDuration(duration);
    setDocumentItems((current) =>
      current.map((document) =>
        document.id === activeDocId
          ? { ...document, durationLabel: `${formatTime(duration)} min` }
          : document,
      ),
    );
  };

  const handleAudioError = () => {
    pendingPlayRef.current = false;
    setIsPlaying(false);
    toast.error("Audio tidak dapat dimuat oleh browser.");
  };

  return (
    <div className="flex flex-col gap-4 p-4 lg:h-[calc(100dvh-3.5rem)] lg:overflow-hidden lg:p-6">
      <DocumentToolbar
        documents={documentItems}
        loadingDocument={documentQuery.isLoading}
        activeDoc={activeDoc}
        summarizing={summarizeMutation.isPending}
        processing={isProcessing}
        fileInputRef={fileInputRef}
        onSelectDocument={selectDocument}
        onFileChange={handleFileChange}
      />

      <div className="flex flex-1 flex-col gap-4 lg:min-h-0 lg:flex-row lg:gap-6 lg:overflow-hidden">
        <TakeawaysPanel
          loading={panelsLoading}
          takeaways={displayTakeaways}
          activeId={activeTakeawayId}
          onSelect={setActiveTakeawayId}
        />
        <TranscriptPanel
          loading={panelsLoading}
          paragraphs={displayTranscript}
          activeId={activeParagraphId}
          onSeek={seekToParagraph}
        />
      </div>

      <PlaybackBar
        audioRef={audioRef}
        audioUrl={audioUrl}
        position={position}
        duration={playbackDuration}
        speed={speed}
        isPlaying={isPlaying}
        synthesizing={synthesizeMutation.isPending}
        hasNarration={Boolean(narrationText)}
        voices={voices}
        voicesLoading={voicesQuery.isLoading}
        activeVoiceId={activeVoiceId}
        pendingPlayRef={pendingPlayRef}
        onSeek={seekAudio}
        onTogglePlay={togglePlay}
        onCycleSpeed={() =>
          setSpeedIndex((i) => (i + 1) % PLAYBACK_SPEEDS.length)
        }
        onVoiceChange={handleVoiceChange}
        onDuration={handleDuration}
        onPosition={setPosition}
        onPlayingChange={setIsPlaying}
        onAudioError={handleAudioError}
      />
    </div>
  );
}
