"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useDocuments(collection: string) {
  return useQuery({
    queryKey: ["documents", collection],
    queryFn: () => api.documents.list(collection),
    enabled: !!collection,
  });
}

export function useUploadDocuments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ files, collection }: { files: File[]; collection: string }) =>
      api.documents.upload(files, collection),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      documentId,
      collection,
    }: {
      documentId: string;
      collection: string;
    }) => api.documents.delete(documentId, collection),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}
