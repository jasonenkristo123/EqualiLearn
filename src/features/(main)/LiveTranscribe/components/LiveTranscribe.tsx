"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSpeechToText } from "../hooks/useSpeechToText";
import type { SummaryData, TranscriptEntry } from "../type/speech-to-text.type";
import { formatTranscriptTimestamp } from "../util/format";
import { MOCK_SUMMARY } from "../util/mock-summary";
import { SummaryPane } from "./SummaryPane";
import { TranscriptPane } from "./TranscriptPane";

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
      <TranscriptPane
        status={status}
        elapsed={elapsed}
        isRecording={isRecording}
        isActive={isActive}
        isStopping={isStopping}
        errorMessage={errorMessage}
        entries={visibleEntries}
        transcriptRef={transcriptRef}
        onToggleRecording={toggleRecording}
        onGenerateSummary={onGenerateSummary}
      />
      <SummaryPane
        summary={summary}
        actionItems={actionItems}
        onToggleActionItem={toggleActionItem}
        onGenerateSummary={onGenerateSummary}
        onExport={onExport}
      />
    </div>
  );
}
