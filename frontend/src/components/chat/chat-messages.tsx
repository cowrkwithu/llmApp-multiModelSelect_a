"use client";

import type { Source } from "@/lib/types";
import { SourceCitation } from "./source-citation";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

interface Props {
  messages: Message[];
  isStreaming: boolean;
}

export function ChatMessages({ messages, isStreaming }: Props) {
  return (
    <div className="flex-1 overflow-y-auto space-y-4 p-4">
      {messages.length === 0 && (
        <div className="flex h-full items-center justify-center">
          <p className="text-gray-400 text-sm">
            Send a message to start the conversation
          </p>
        </div>
      )}
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
              msg.role === "user"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            <div className="whitespace-pre-wrap">{msg.content}</div>
            {msg.sources && msg.sources.length > 0 && (
              <SourceCitation sources={msg.sources} />
            )}
            {msg.role === "assistant" && !msg.content && isStreaming && (
              <span className="inline-block animate-pulse">...</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
