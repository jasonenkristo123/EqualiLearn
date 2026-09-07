import axios from "axios";
import { api } from "@/shared/lib/axios";
import type {
  SpeechHistoryResponse,
  SpeechVoicesResponse,
  SummarizeDocumentInput,
  SynthesizeSpeechInput,
} from "../type/ppt-audio.type";

export async function uploadAndSummarizeDocument({
  file,
  language = "en",
  detailLevel = "balanced",
  targetAudience = "student",
  saveToHistory = true,
}: SummarizeDocumentInput): Promise<unknown> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("language", language);
  formData.append("detail_level", detailLevel);
  formData.append("target_audience", targetAudience);
  formData.append("save_to_history", String(saveToHistory));

  const { data } = await api.post<unknown>("documents/summarize", formData, {
    // Let the browser add the multipart boundary instead of inheriting JSON.
    headers: { "Content-Type": undefined },
  });

  console.info("[PptToAudio] documents/summarize response", data);
  return data;
}

export async function getSpeechVoices(): Promise<SpeechVoicesResponse> {
  const { data } = await api.get<SpeechVoicesResponse>("speech/voices");
  console.info("[PptToAudio] speech/voices response", data);
  return data;
}

export async function getDocument(documentId: string): Promise<unknown> {
  const { data } = await api.get<unknown>(
    `documents/${encodeURIComponent(documentId)}`,
  );
  return data;
}

export async function synthesizeSpeech(
  input: SynthesizeSpeechInput,
): Promise<Blob> {
  try {
    const response = await api.post<Blob>("speech/synthesize", input, {
      responseType: "blob",
      headers: { Accept: "audio/mpeg, audio/*" },
    });

    console.info("[PptToAudio] speech/synthesize response", {
      status: response.status,
      contentType: response.headers["content-type"],
      size: response.data.size,
    });

    if (response.data.type.includes("json")) {
      const payload = await readJsonBlob(response.data);
      const audioBlob = decodeAudioPayload(payload);
      if (audioBlob) return audioBlob;
      throw new Error(getJsonErrorMessage(payload));
    }

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
      throw new Error(await readBlobError(error.response.data));
    }
    throw error;
  }
}

function decodeAudioPayload(value: unknown): Blob | null {
  if (!isRecord(value) || typeof value.audio_base64 !== "string") return null;

  const binary = window.atob(value.audio_base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], {
    type:
      typeof value.content_type === "string"
        ? value.content_type
        : "audio/mpeg",
  });
}

export async function getSpeechHistory(
  page = 1,
  limit = 10,
): Promise<SpeechHistoryResponse> {
  try {
    const { data } = await api.get<SpeechHistoryResponse>("speech/history", {
      params: { page, limit },
    });
    console.info("[PptToAudio] speech/history response", data);
    return data;
  } catch (error) {
    console.error("[PptToAudio] speech/history error", {
      status: axios.isAxiosError(error) ? error.response?.status : undefined,
      data: axios.isAxiosError(error) ? error.response?.data : undefined,
    });
    throw error;
  }
}

export function getPptAudioErrorMessage(
  error: unknown,
  fallback = "Permintaan gagal. Silakan coba lagi.",
) {
  if (axios.isAxiosError(error)) {
    const response = error.response?.data as
      | { error?: string; message?: string }
      | undefined;
    return response?.message ?? response?.error ?? error.message ?? fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

async function readBlobError(blob: Blob) {
  return getJsonErrorMessage(await readJsonBlob(blob));
}

async function readJsonBlob(blob: Blob): Promise<unknown> {
  try {
    return JSON.parse(await blob.text());
  } catch {
    return undefined;
  }
}

function getJsonErrorMessage(value: unknown) {
  if (isRecord(value)) {
    const message = value.message ?? value.error ?? value.detail;
    if (typeof message === "string") return message;
  }
  return "Server gagal membuat audio.";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
