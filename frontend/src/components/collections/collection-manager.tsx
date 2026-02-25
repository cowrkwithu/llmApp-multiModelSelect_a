"use client";

import { useState } from "react";
import {
  useCollections,
  useCreateCollection,
  useDeleteCollection,
} from "@/hooks/use-collections";

interface Props {
  modelId: string | null;
  selectedCollection: string | null;
  onSelect: (name: string) => void;
}

export function CollectionManager({
  modelId,
  selectedCollection,
  onSelect,
}: Props) {
  const { data } = useCollections(modelId || undefined);
  const createCollection = useCreateCollection();
  const deleteCollection = useDeleteCollection();
  const [newLabel, setNewLabel] = useState("");

  const collections = data?.collections || [];

  const handleCreate = () => {
    if (!modelId || !newLabel.trim()) return;
    createCollection.mutate(
      { modelId, label: newLabel.trim() },
      {
        onSuccess: (col) => {
          onSelect(col.name);
          setNewLabel("");
        },
      }
    );
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">Collections</h3>
      <div className="mb-3 space-y-1">
        {collections.map((col) => (
          <div
            key={col.name}
            className={`flex items-center justify-between rounded px-3 py-2 text-sm cursor-pointer ${
              selectedCollection === col.name
                ? "bg-blue-50 border border-blue-200"
                : "hover:bg-gray-50"
            }`}
            onClick={() => onSelect(col.name)}
          >
            <span className="truncate">{col.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">
                {col.points_count} chunks
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete collection "${col.name}"?`)) {
                    deleteCollection.mutate(col.name);
                  }
                }}
                className="text-red-400 hover:text-red-600 text-xs"
              >
                x
              </button>
            </div>
          </div>
        ))}
        {collections.length === 0 && (
          <p className="text-xs text-gray-400">No collections yet</p>
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="New collection label"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
        />
        <button
          onClick={handleCreate}
          disabled={!modelId || !newLabel.trim() || createCollection.isPending}
          className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  );
}
