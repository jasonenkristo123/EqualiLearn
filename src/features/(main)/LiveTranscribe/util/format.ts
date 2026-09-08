import type { SpeechToTextStatus } from "../type/speech-to-text.type";

export const MONO = "font-[ui-monospace,SFMono-Regular,Menlo,monospace]";

/** Static bar heights (px) for the recording waveform placeholder. */
export const WAVE_BARS = [
  8, 16, 24, 32, 20, 12, 28, 36, 22, 14, 30, 18, 26, 10, 34, 24, 16, 28, 20, 12,
  32, 22, 14, 26, 18, 30, 10, 24, 16, 20,
].map((height, i) => ({ id: `wave-${i}`, height }));

export const STATUS_LABELS: Record<SpeechToTextStatus, string> = {
  idle: "Siap Merekam",
  "requesting-permission": "Meminta Izin Mikrofon",
  connecting: "Menghubungkan",
  recording: "Live Recording",
  stopping: "Menghentikan Rekaman",
  stopped: "Rekaman Selesai",
  error: "Perekaman Bermasalah",
};

export function formatElapsed(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}

export function formatTranscriptTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;

  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
