import axios from "axios";
import { api } from "@/shared/lib/axios";
import type {
  SpeechHistoryResponse,
  SpeechVoicesResponse,
  SynthesizeSpeechInput,
} from "../type/ppt-audio.type";

export async function getSpeechVoices(): Promise<SpeechVoicesResponse> {
  const { data } = await api.get<SpeechVoicesResponse>("speech/voices");
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
  const { data } = await api.get<SpeechHistoryResponse>("speech/history", {
    params: { page, limit },
  });
  return data;
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
