"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteHistoryDocument, getHistory } from "../service/history";
import type { HistoryResult } from "../type/dashboard.type";

export const historyKeys = {
  all: ["history", "all"] as const,
};

export function useHistory() {
  return useQuery({
    queryKey: historyKeys.all,
    queryFn: getHistory,
    retry: false,
    staleTime: 30_000,
  });
}

export function useDeleteHistory() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: deleteHistoryDocument,
    onMutate: async (id: string) => {
      await client.cancelQueries({ queryKey: historyKeys.all });
      const previous = client.getQueryData<HistoryResult>(historyKeys.all);
      if (previous) {
        client.setQueryData<HistoryResult>(historyKeys.all, {
          ...previous,
          records: previous.records.filter((record) => record.id !== id),
          total: Math.max(0, previous.total - 1),
        });
      }
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        client.setQueryData(historyKeys.all, context.previous);
      }
    },
    onSettled: () => {
      void client.invalidateQueries({ queryKey: historyKeys.all });
    },
  });
}
