"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useModels() {
  return useQuery({
    queryKey: ["models"],
    queryFn: () => api.models.list(),
  });
}

export function useActiveModel() {
  return useQuery({
    queryKey: ["activeModel"],
    queryFn: () => api.models.active(),
    refetchInterval: 10000,
  });
}

export function useSwitchModel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (modelId: string) => api.models.switch(modelId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["activeModel"] });
    },
  });
}
