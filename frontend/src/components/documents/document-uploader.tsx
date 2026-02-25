"use client";

import { useRef } from "react";
import { useUploadDocuments } from "@/hooks/use-documents";

interface Props {
  collection: string | null;
}

export function DocumentUploader({ collection }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadDocuments();

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !collection) return;
    upload.mutate({ files: Array.from(files), collection });
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">
        Upload Documents
      </h3>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.txt"
        onChange={handleUpload}
        disabled={!collection || upload.isPending}
        className="w-full text-sm text-gray-900 file:mr-3 file:rounded file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
      />
      {upload.isPending && (
        <p className="mt-2 text-xs text-blue-600">Uploading & processing...</p>
      )}
      {upload.isSuccess && upload.data && (
        <div className="mt-2 text-xs">
          <p className="text-green-600">
            {upload.data.results.length} file(s) processed
          </p>
          {upload.data.errors.map((err, i) => (
            <p key={i} className="text-red-500">
              {err.filename}: {err.error}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
