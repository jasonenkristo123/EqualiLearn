"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getDocument,
  uploadAndSummarizeDocument,
} from "@/shared/api/documents";

export const documentKeys = {
  detail: (documentId: string) => ["documents", documentId] as const,
};

export function useDocument(documentId: string) {
  return useQuery({
    queryKey: documentKeys.detail(documentId),
    queryFn: () => getDocument(documentId),
    enabled: Boolean(documentId),
    retry: false,
  });
}

export function useSummarizeDocument() {
  return useMutation({ mutationFn: uploadAndSummarizeDocument });
}
