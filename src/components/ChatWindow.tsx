"use client";

import { useEffect, useRef, useState, KeyboardEvent } from "react";
import MessageBubble from "./MessageBubble";
import { Message, RepoFile } from "@/app/page";

type Props = {
  messages: Message[];
  isTyping: boolean;
  onSendMessage: (content: string, files?: RepoFile[]) => void; // 🔥 UPDATED
  repoFiles: RepoFile[]; // 🔥 NEW
};

const SUGGESTIONS = [
  "Explain the architecture of this codebase",
  "Find potential performance issues or N+1 queries",
  "Trace authentication flow in this repo",
  "List all API endpoints",
  "Identify tech debt and bad practices",
  "Show data models and structures",
];

export default function ChatWindow({
  messages,
  isTyping,
  onSendMessage,
  repoFiles,
}: Props) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [input]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    onSendMessage(trimmed, repoFiles); // 🔥 PASS FILES

    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "46px";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestion = (suggestion: string) => {
    onSendMessage(suggestion, repoFiles); // 🔥 PASS FILES
  };

  return (
    <div className="chat-window">
      {/* Messages */}
      <div className="messages-area">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="typing-indicator">
            <div className="avatar ai" style={{ fontSize: "14px" }}>
              🗺
            </div>
            <div>
              <div className="typing-bubble">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
              <span
                style={{
                  display: "block",
                  fontSize: "10px",
                  color: "var(--text-muted)",
                  marginTop: "5px",
                  paddingLeft: "4px",
                }}
              >
                CodeAtlas is thinking…
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggestion chips */}
      {messages.length > 0 &&
        messages[messages.length - 1].role === "assistant" &&
        !isTyping && (
          <div className="suggestion-chips">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                className="chip"
                onClick={() => handleSuggestion(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}

      {/* Input */}
      <div className="chat-input-area">
        <div className="chat-input-wrapper">
          <textarea
            ref={textareaRef}
            className="chat-input"
            placeholder="Ask anything about this codebase…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isTyping}
          />
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            title="Send message (Enter)"
          >
            ↑
          </button>
        </div>
        <p className="chat-hint">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}