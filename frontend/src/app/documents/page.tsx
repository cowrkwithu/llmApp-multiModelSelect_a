"use client";

import { useState } from "react";
import { ModelSelector } from "@/components/models/model-selector";
import { CollectionManager } from "@/components/collections/collection-manager";
import { DocumentUploader } from "@/components/documents/document-uploader";
import { DocumentList } from "@/components/documents/document-list";
import { useActiveModel } from "@/hooks/use-models";

export default function DocumentsPage() {
  const { data: active } = useActiveModel();
  const [selectedCollection, setSelectedCollection] = useState<string | null>(
    null
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Document Management</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="space-y-4">
          <ModelSelector />
          <CollectionManager
            modelId={active?.model_id || null}
            selectedCollection={selectedCollection}
            onSelect={setSelectedCollection}
          />
        </div>

        <div className="md:col-span-2 space-y-4">
          <DocumentUploader collection={selectedCollection} />
          <DocumentList collection={selectedCollection} />
        </div>
      </div>
    </div>
  );
}
