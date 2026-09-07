"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

export {
  useDocument,
  useSummarizeDocument,
} from "@/shared/hooks/useDocuments";

import {
  getSpeechHistory,
  getSpeechVoices,
  synthesizeSpeech,
} from "../service/api";

const pptAudioKeys = {
  voices: ["ppt-audio", "voices"] as const,
  history: (page: number, limit: number) =>
    ["ppt-audio", "speech-history", page, limit] as const,
};

export function useSpeechVoices() {
  return useQuery({
    queryKey: pptAudioKeys.voices,
    queryFn: getSpeechVoices,
    staleTime: 60 * 60 * 1000,
  });
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
