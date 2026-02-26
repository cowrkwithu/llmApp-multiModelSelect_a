"use client";

import { ModelSelector } from "@/components/models/model-selector";
import { useActiveModel, useModels } from "@/hooks/use-models";
import { useCollections } from "@/hooks/use-collections";

export default function Dashboard() {
  const { data: modelsData } = useModels();
  const { data: active } = useActiveModel();
  const { data: collectionsData } = useCollections();

  const models = modelsData?.models || [];
  const collections = collectionsData?.collections || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-gray-500">Ollama Status</h2>
          <p
            className={`mt-1 text-2xl font-bold ${
              active?.status === "healthy"
                ? "text-green-600"
                : "text-red-500"
            }`}
          >
            {active?.status || "Unknown"}
          </p>
          {active?.model_id && (
            <p className="mt-1 text-sm text-gray-500 truncate">
              {active.model_id}
            </p>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-gray-500">
            Available Models
          </h2>
          <p className="mt-1 text-2xl font-bold text-gray-800">
            {models.length}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-gray-500">Collections</h2>
          <p className="mt-1 text-2xl font-bold text-gray-800">
            {collections.length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <ModelSelector />

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">
            Quick Links
          </h3>
          <div className="space-y-2">
            <a
              href="/chat"
              className="block rounded px-3 py-2 text-sm text-blue-600 hover:bg-blue-50"
            >
              Start chatting with RAG
            </a>
            <a
              href="/documents"
              className="block rounded px-3 py-2 text-sm text-blue-600 hover:bg-blue-50"
            >
              Upload documents
            </a>
            <a
              href="/collections"
              className="block rounded px-3 py-2 text-sm text-blue-600 hover:bg-blue-50"
            >
              Manage collections
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
