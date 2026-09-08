import axios from "axios";
import { api } from "@/shared/lib/axios";
import type {
  HistoryCounts,
  HistoryKind,
  HistoryRecord,
  HistoryResult,
} from "../type/dashboard.type";

interface HistoryDetail {
  id?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  title?: string;
  summary?: string;
  key_points?: unknown;
  language?: string;
  created_at?: string;
}

interface HistoryApiItem {
  id?: string;
  type?: string;
  title?: string;
  content?: string;
  description?: string;
  language?: string;
  created_at?: string;
  details?: HistoryDetail | null;
}

interface HistoryAllResponse {
  data?: HistoryApiItem[];
  total?: number;
  counts?: Partial<HistoryCounts>;
  pagination?: { Page?: number; limit?: number };
}

const EMPTY_COUNTS: HistoryCounts = {
  total_summaries: 0,
  total_stt: 0,
  total_tts: 0,
  total_all: 0,
};

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function num(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

/** Map the backend `type` string onto a product surface. Best-effort. */
function detectKind(type: string): HistoryKind {
  const t = type.toLowerCase();
  if (t.includes("summary") || t.includes("document")) return "document";
  if (
    t.includes("stt") ||
    t.includes("transcri") ||
    t.includes("speech_to_text") ||
    t.includes("speech-to-text")
  ) {
    return "transcript";
  }
  if (
    t.includes("tts") ||
    t.includes("text_to_speech") ||
    t.includes("text-to-speech") ||
    t.includes("synthesi") ||
    t.includes("narration")
  ) {
    return "audio";
  }
  return "other";
}

function normalizeRecord(item: HistoryApiItem): HistoryRecord {
  const details = item.details ?? undefined;
  const keyPoints = Array.isArray(details?.key_points)
    ? details.key_points.filter((p): p is string => typeof p === "string")
    : [];

  return {
    id: str(item.id) || str(details?.id),
    kind: detectKind(str(item.type)),
    rawType: str(item.type),
    title:
      str(item.title) ||
      str(details?.title) ||
      str(details?.file_name) ||
      "Tanpa judul",
    description:
      str(item.description) || str(item.content) || str(details?.summary),
    fileName: str(details?.file_name) || undefined,
    fileType: str(details?.file_type) || undefined,
    fileSize: num(details?.file_size),
    createdAt: str(item.created_at) || str(details?.created_at),
    keyPoints,
  };
}

export async function getHistory(): Promise<HistoryResult> {
  const { data } = await api.get<HistoryAllResponse>("history/all", {
    params: { page: 1, limit: 50 },
  });

  const records = (Array.isArray(data.data) ? data.data : [])
    .map(normalizeRecord)
    .filter((record) => record.id);

  return {
    records,
    counts: { ...EMPTY_COUNTS, ...(data.counts ?? {}) },
    total: num(data.total) ?? records.length,
  };
}

/** The document behind a `document_summary` record. Not valid for STT/TTS rows. */
export async function deleteHistoryDocument(id: string): Promise<void> {
  await api.delete(`documents/${encodeURIComponent(id)}`);
}

export function getHistoryErrorMessage(
  error: unknown,
  fallback = "Gagal memuat riwayat. Silakan coba lagi.",
): string {
  if (axios.isAxiosError(error)) {
    const response = error.response?.data as
      | { error?: string; message?: string }
      | undefined;
    return response?.message ?? response?.error ?? error.message ?? fallback;
  }
  return error instanceof Error ? error.message : fallback;
}
