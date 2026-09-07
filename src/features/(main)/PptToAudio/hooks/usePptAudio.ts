"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getDocument,
  getSpeechHistory,
  getSpeechVoices,
  synthesizeSpeech,
  uploadAndSummarizeDocument,
} from "../service/api";

const pptAudioKeys = {
  document: (documentId: string) =>
    ["ppt-audio", "document", documentId] as const,
  voices: ["ppt-audio", "voices"] as const,
  history: (page: number, limit: number) =>
    ["ppt-audio", "speech-history", page, limit] as const,
};

export function useDocument(documentId: string) {
  return useQuery({
    queryKey: pptAudioKeys.document(documentId),
    queryFn: () => getDocument(documentId),
    enabled: Boolean(documentId),
    retry: false,
  });
}

export function useSpeechVoices() {
  return useQuery({
    queryKey: pptAudioKeys.voices,
    queryFn: getSpeechVoices,
    staleTime: 60 * 60 * 1000,
  });
}

export function useSummarizeDocument() {
  return useMutation({ mutationFn: uploadAndSummarizeDocument });
}

export function useSynthesizeSpeech() {
  return useMutation({ mutationFn: synthesizeSpeech });
}

export function useSpeechHistory(page = 1, limit = 10) {
  return useQuery({
    queryKey: pptAudioKeys.history(page, limit),
    queryFn: () => getSpeechHistory(page, limit),
    retry: false,
  });
}
