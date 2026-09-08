export type SpeechToTextStatus =
  | "idle"
  | "requesting-permission"
  | "connecting"
  | "recording"
  | "stopping"
  | "stopped"
  | "error";

export interface SpeechReadyPayload {
  language: string;
  sample_rate: number;
  session_id: string;
}

export interface SpeechTranscriptPayload {
  text: string;
  is_final: boolean;
  confidence: number;
  language: string;
  session_id: string;
  timestamp: string;
}

export interface SpeechFinishedPayload {
  session_id: string;
  duration_ms: number;
  text: string;
}

export interface SpeechTranscriptSegment extends SpeechTranscriptPayload {
  id: string;
}

export type SpeechSocketMessage =
  | { type: "ready"; payload: SpeechReadyPayload }
  | { type: "transcript"; payload: SpeechTranscriptPayload }
  | { type: "finished"; payload: SpeechFinishedPayload }
  | { type: "error"; payload: { message: string } };

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
