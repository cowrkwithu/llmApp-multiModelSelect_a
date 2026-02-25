"use client";

import { useDeleteDocument, useDocuments } from "@/hooks/use-documents";

interface Props {
  collection: string | null;
}

export function DocumentList({ collection }: Props) {
  const { data } = useDocuments(collection || "");
  const deleteDoc = useDeleteDocument();

  if (!collection) {
    return (
      <p className="text-xs text-gray-400">
        Select a collection to view documents
      </p>
    );
  }

  const documents = data?.documents || [];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">Documents</h3>
      {documents.length === 0 ? (
        <p className="text-xs text-gray-400">No documents in this collection</p>
      ) : (
        <div className="space-y-1">
          {documents.map((doc) => (
            <div
              key={doc.document_id}
              className="flex items-center justify-between rounded px-3 py-2 text-sm hover:bg-gray-50"
            >
              <div>
                <span className="font-medium text-gray-900">{doc.filename}</span>
                <span className="ml-2 text-xs text-gray-400">
                  {doc.chunks_count} chunks
                </span>
              </div>
              <button
                onClick={() =>
                  deleteDoc.mutate({
                    documentId: doc.document_id,
                    collection,
                  })
                }
                disabled={deleteDoc.isPending}
                className="text-red-400 hover:text-red-600 text-xs"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
