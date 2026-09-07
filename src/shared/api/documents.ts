import axios from "axios";
import { api } from "@/shared/lib/axios";

export interface DocumentSummary {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  title: string;
  summary: string;
  key_points: string[];
  explanation: string;
  language: string;
  detail_level: string;
  target_audience: string;
  model?: string;
  token_count: number;
  created_at: string;
}

export interface DocumentSummaryResponse {
  data: DocumentSummary;
  message?: string;
}

export interface SummarizeDocumentInput {
  file: File;
  language?: string;
  detailLevel?: "brief" | "balanced" | "detailed";
  targetAudience?: string;
  saveToHistory?: boolean;
}

export async function uploadAndSummarizeDocument({
  file,
  language = "en",
  detailLevel = "balanced",
  targetAudience = "student",
  saveToHistory = true,
}: SummarizeDocumentInput): Promise<DocumentSummaryResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("language", language);
  formData.append("detail_level", detailLevel);
  formData.append("target_audience", targetAudience);
  formData.append("save_to_history", String(saveToHistory));

  const { data } = await api.post<DocumentSummaryResponse>(
    "documents/summarize",
    formData,
    {
      // The browser must generate the multipart boundary.
      headers: { "Content-Type": undefined },
    },
  );

  return data;
}

export async function getDocument(
  documentId: string,
): Promise<DocumentSummaryResponse> {
  const { data } = await api.get<DocumentSummaryResponse>(
    `documents/${encodeURIComponent(documentId)}`,
  );
  return data;
}

export function getDocumentErrorMessage(
  error: unknown,
  fallback = "Permintaan dokumen gagal. Silakan coba lagi.",
) {
  if (axios.isAxiosError(error)) {
    const response = error.response?.data as
      | { error?: string; message?: string }
      | undefined;
    return response?.message ?? response?.error ?? error.message ?? fallback;
  }
  return error instanceof Error ? error.message : fallback;
}
