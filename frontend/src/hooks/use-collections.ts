"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useCollections(modelId?: string) {
  return useQuery({
    queryKey: ["collections", modelId],
    queryFn: () => api.collections.list(modelId),
  });
}

export function useCreateCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ modelId, label }: { modelId: string; label: string }) =>
      api.collections.create(modelId, label),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["collections"] });
    },
  });
}

export function useDeleteCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.collections.delete(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["collections"] });
    },
  });
}
