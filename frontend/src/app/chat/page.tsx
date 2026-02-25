"use client";

import { useState } from "react";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ModelSelector } from "@/components/models/model-selector";
import { CollectionManager } from "@/components/collections/collection-manager";
import { useActiveModel } from "@/hooks/use-models";
import { useChat } from "@/hooks/use-chat";

export default function ChatPage() {
  const { data: active } = useActiveModel();
  const [selectedCollection, setSelectedCollection] = useState<string | null>(
    null
  );
  const [useRag, setUseRag] = useState(true);
  const { messages, isStreaming, sendMessage, stopStreaming, clearMessages } =
    useChat();

  const handleSend = (question: string) => {
    sendMessage(
      question,
      useRag ? selectedCollection : null,
      active?.model_id || undefined
    );
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-120px)]">
      {/* Sidebar */}
      <div className="w-72 flex-shrink-0 space-y-4 overflow-y-auto">
        <ModelSelector />
        <CollectionManager
          modelId={active?.model_id || null}
          selectedCollection={selectedCollection}
          onSelect={setSelectedCollection}
        />
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <label className="flex items-center gap-2 text-sm text-gray-900">
            <input
              type="checkbox"
              checked={useRag}
              onChange={(e) => setUseRag(e.target.checked)}
              className="rounded"
            />
            Use RAG (document context)
          </label>
          {useRag && !selectedCollection && (
            <p className="mt-1 text-xs text-amber-600">
              Select a collection to use RAG
            </p>
          )}
        </div>
        <button
          onClick={clearMessages}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          Clear Chat
        </button>
      </div>

      {/* Chat area */}
      <div className="flex flex-1 flex-col rounded-lg border border-gray-200 bg-white">
        <ChatMessages messages={messages} isStreaming={isStreaming} />
        <div className="border-t border-gray-200 p-4">
          <ChatInput
            onSend={handleSend}
            isStreaming={isStreaming}
            onStop={stopStreaming}
            sendDisabled={useRag && !selectedCollection}
          />
        </div>
      </div>
    </div>
  );
}
