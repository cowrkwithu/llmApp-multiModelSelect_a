const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8020";

async function fetchJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }
  return res.json();
}

// Models
export const api = {
  models: {
    list: () =>
      fetchJSON<{ models: import("./types").ModelInfo[] }>("/api/v1/models/"),
    active: () =>
      fetchJSON<import("./types").ActiveModel>("/api/v1/models/active"),
    switch: (model_id: string) =>
      fetchJSON<{ message: string; model_id: string }>("/api/v1/models/switch", {
        method: "POST",
        body: JSON.stringify({ model_id }),
      }),
    status: () => fetchJSON<{ status: string }>("/api/v1/models/status"),
  },

  collections: {
    list: (model_id?: string) => {
      const params = model_id ? `?model_id=${encodeURIComponent(model_id)}` : "";
      return fetchJSON<{ collections: import("./types").CollectionInfo[] }>(
        `/api/v1/collections/${params}`
      );
    },
    create: (model_id: string, label: string) =>
      fetchJSON<import("./types").CollectionInfo>("/api/v1/collections/", {
        method: "POST",
        body: JSON.stringify({ model_id, label }),
      }),
    delete: (name: string) =>
      fetchJSON<{ message: string }>(`/api/v1/collections/${encodeURIComponent(name)}`, {
        method: "DELETE",
      }),
  },

  documents: {
    upload: async (files: File[], collection: string) => {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));
      const res = await fetch(
        `${API_BASE}/api/v1/documents/upload?collection=${encodeURIComponent(collection)}`,
        { method: "POST", body: formData }
      );
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      return res.json() as Promise<import("./types").UploadResult>;
    },
    list: (collection: string) =>
      fetchJSON<{ documents: import("./types").DocumentInfo[]; collection: string }>(
        `/api/v1/documents/?collection=${encodeURIComponent(collection)}`
      ),
    delete: (documentId: string, collection: string) =>
      fetchJSON<{ message: string }>(
        `/api/v1/documents/${documentId}?collection=${encodeURIComponent(collection)}`,
        { method: "DELETE" }
      ),
  },

  chat: {
    querySSE: (
      question: string,
      collection: string,
      model_id?: string,
      top_k?: number
    ) => {
      return fetch(`${API_BASE}/api/v1/chat/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          collection,
          ...(model_id && { model_id }),
          ...(top_k && { top_k }),
        }),
      });
    },
    queryNoRagSSE: (question: string, model_id?: string) => {
      return fetch(`${API_BASE}/api/v1/chat/query-no-rag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, ...(model_id && { model_id }) }),
      });
    },
  },
};
