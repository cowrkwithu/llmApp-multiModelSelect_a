"use client";

import { ModelSelector } from "@/components/models/model-selector";
import { useActiveModel } from "@/hooks/use-models";
import {
  useCollections,
  useCreateCollection,
  useDeleteCollection,
} from "@/hooks/use-collections";
import { useState } from "react";

export default function CollectionsPage() {
  const { data: active } = useActiveModel();
  const { data: allCollections } = useCollections();
  const { data: modelCollections } = useCollections(
    active?.model_id || undefined
  );
  const createCollection = useCreateCollection();
  const deleteCollection = useDeleteCollection();
  const [newLabel, setNewLabel] = useState("");

  const collections = allCollections?.collections || [];
  const currentModelCollections = modelCollections?.collections || [];

  const handleCreate = () => {
    if (!active?.model_id || !newLabel.trim()) return;
    createCollection.mutate({
      modelId: active.model_id,
      label: newLabel.trim(),
    });
    setNewLabel("");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">
        Collection Management
      </h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <ModelSelector />

        <div className="md:col-span-2 space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">
              Create Collection for Current Model
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Collection label"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={handleCreate}
                disabled={
                  !active?.model_id ||
                  !newLabel.trim() ||
                  createCollection.isPending
                }
                className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>

          {active?.model_id && (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">
                Current Model Collections
              </h3>
              {currentModelCollections.length === 0 ? (
                <p className="text-sm text-gray-400">
                  No collections for this model
                </p>
              ) : (
                <div className="space-y-2">
                  {currentModelCollections.map((col) => (
                    <div
                      key={col.name}
                      className="flex items-center justify-between rounded border border-gray-100 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{col.name}</p>
                        <p className="text-xs text-gray-400">
                          {col.points_count} chunks
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${col.name}"?`)) {
                            deleteCollection.mutate(col.name);
                          }
                        }}
                        className="rounded border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">
              All Collections
            </h3>
            {collections.length === 0 ? (
              <p className="text-sm text-gray-400">No collections exist yet</p>
            ) : (
              <div className="space-y-2">
                {collections.map((col) => (
                  <div
                    key={col.name}
                    className="flex items-center justify-between rounded border border-gray-100 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{col.name}</p>
                      <p className="text-xs text-gray-400">
                        {col.points_count} chunks
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${col.name}"?`)) {
                          deleteCollection.mutate(col.name);
                        }
                      }}
                      className="rounded border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
