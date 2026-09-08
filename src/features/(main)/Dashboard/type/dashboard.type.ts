/** Which product surface a history record belongs to, best-effort from `type`. */
export type HistoryKind = "document" | "transcript" | "audio" | "other";

export interface HistoryCounts {
  total_summaries: number;
  total_stt: number;
  total_tts: number;
  total_all: number;
}

/** Normalized view model rendered by the dashboard. */
export interface HistoryRecord {
  id: string;
  kind: HistoryKind;
  rawType: string;
  title: string;
  description: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  createdAt: string;
  keyPoints: string[];
}

export interface HistoryResult {
  records: HistoryRecord[];
  counts: HistoryCounts;
  total: number;
}
