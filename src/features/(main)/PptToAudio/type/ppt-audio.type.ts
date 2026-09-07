export type DocumentKind = "pdf" | "ppt";
export type DocumentStatus = "ready" | "processing" | "error";

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
  atSeconds: number;
}

export interface SpeechVoice {
  id: string;
  name: string;
  gender: string;
  language: string;
  description: string;
  sample_rate: number;
}

export interface SpeechVoicesResponse {
  count: number;
  data: SpeechVoice[];
}

export interface SynthesizeSpeechInput {
  text: string;
  voice: string;
  format: "mp3";
}

export interface SpeechHistoryResponse {
  data: unknown;
  pagination: {
    page: number;
    limit: number;
    total?: number;
    total_pages?: number;
  };
}

export interface NormalizedDocumentSummary {
  documentId: string;
  fileName: string;
  fileType: string;
  pageCount: number;
  narrationText: string;
  takeaways: Takeaway[];
  transcript: TranscriptParagraph[];
}
