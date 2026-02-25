"use client";

import { useState } from "react";

interface Props {
  onSend: (message: string) => void;
  isStreaming: boolean;
  onStop: () => void;
  sendDisabled?: boolean;
}

export function ChatInput({ onSend, isStreaming, onStop, sendDisabled }: Props) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming || sendDisabled) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={sendDisabled ? "Select a collection to use RAG" : "Ask a question..."}
        className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
      />
      {isStreaming ? (
        <button
          type="button"
          onClick={onStop}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
        >
          Stop
        </button>
      ) : (
        <button
          type="submit"
          disabled={!input.trim() || sendDisabled}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Send
        </button>
      )}
    </form>
  );
}
