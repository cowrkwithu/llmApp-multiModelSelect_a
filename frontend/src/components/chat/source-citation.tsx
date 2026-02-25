"use client";

import type { Source } from "@/lib/types";

interface Props {
  sources: Source[];
}

export function SourceCitation({ sources }: Props) {
  if (sources.length === 0) return null;

  return (
    <div className="mt-2 border-t border-gray-200 pt-2">
      <p className="text-xs font-semibold text-gray-500 mb-1">Sources:</p>
      <div className="space-y-1">
        {sources.map((src) => (
          <div
            key={`${src.filename}-${src.chunk_index}`}
            className="text-xs text-gray-500"
          >
            [{src.index}] {src.filename}
            <span className="ml-1 text-gray-400">
              (chunk {src.chunk_index}, score: {src.score})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
