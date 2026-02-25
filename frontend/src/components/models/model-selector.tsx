"use client";

import { useActiveModel, useModels, useSwitchModel } from "@/hooks/use-models";

export function ModelSelector() {
  const { data: modelsData } = useModels();
  const { data: active } = useActiveModel();
  const switchModel = useSwitchModel();

  const models = modelsData?.models || [];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">Model</h3>
      <div className="mb-2 text-xs text-gray-500">
        Status:{" "}
        <span
          className={
            active?.vllm_status === "healthy"
              ? "text-green-600"
              : "text-red-500"
          }
        >
          {active?.vllm_status || "unknown"}
        </span>
        {active?.model_id && (
          <span className="ml-2 text-gray-600">| {active.model_id}</span>
        )}
      </div>
      <select
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        value={active?.model_id || ""}
        onChange={(e) => {
          if (e.target.value) switchModel.mutate(e.target.value);
        }}
        disabled={switchModel.isPending}
      >
        <option value="">Select model...</option>
        {models.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name} ({m.size_gb}GB)
          </option>
        ))}
      </select>
      {switchModel.isPending && (
        <p className="mt-1 text-xs text-blue-600">Switching model...</p>
      )}
    </div>
  );
}
