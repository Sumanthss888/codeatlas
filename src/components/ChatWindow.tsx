"use client";

import { useEffect, useRef, useState, KeyboardEvent, useMemo } from "react";
import MessageBubble from "./MessageBubble";
import { Message, RepoFile } from "@/app/page";
import { ArrowUp } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

type Props = {
  messages: Message[];
  isTyping: boolean;
  onSendMessage: (content: string, files?: RepoFile[]) => void;
  repoFiles: RepoFile[];
  onFileSelect?: (filePath: string) => void;
  isReadOnly?: boolean;
};

const SUGGESTIONS = [
  "Explain the architecture of this codebase",
  "Find potential performance issues or N+1 queries",
  "Trace authentication flow in this repo",
  "List all API endpoints",
  "Identify tech debt and bad practices",
  "Show data models and structures",
];

// Detect stack dynamically from file structure
const getContextualSuggestions = (files: RepoFile[]) => {
  if (!files || files.length === 0) return [];

  const paths = files.map((f) => f.filePath);
  const suggestions: string[] = [];

  const hasNextjs = paths.some(
    (p) => p.includes("next.config") || p.includes("src/app/") || p.includes("src/pages/")
  );
  const hasReact = paths.some((p) => p.endsWith(".tsx") || p.endsWith(".jsx"));
  const hasPython = paths.some((p) => p.endsWith(".py"));
  const hasTailwind = paths.some((p) => p.includes("tailwind.config"));
  const hasTypeScript = paths.some((p) => p.endsWith(".ts") || p.endsWith(".tsx"));

  if (hasNextjs) {
    suggestions.push("Explain Next.js routing structure");
    suggestions.push("Analyze server vs client components");
  } else if (hasReact) {
    suggestions.push("Explain React component hierarchy");
  }

  if (hasPython) {
    suggestions.push("Explain package structure & main execution");
  }

  if (hasTailwind) {
    suggestions.push("Show Tailwind CSS configurations");
  }

  if (hasTypeScript && suggestions.length < 2) {
    suggestions.push("Explain TypeScript declarations");
  }

  return suggestions;
};

export default function ChatWindow({
  messages,
  isTyping,
  onSendMessage,
  repoFiles,
  onFileSelect,
  isReadOnly = false,
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

    onSendMessage(trimmed, repoFiles);

    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "36px";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestion = (suggestion: string) => {
    onSendMessage(suggestion, repoFiles);
  };

  const shouldReduceMotion = useReducedMotion();

  const chipHover = shouldReduceMotion
    ? {}
    : { y: -2, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)" };
  const chipTap = shouldReduceMotion ? {} : { scale: 0.97 };

  // Generate contextual suggestions dynamically
  const contextualPrompts = useMemo(() => getContextualSuggestions(repoFiles), [repoFiles]);
  
  const activeSuggestions = useMemo(() => {
    // Combine contextual recommendations at front, then default suggestions
    const all = [...contextualPrompts, ...SUGGESTIONS];
    return Array.from(new Set(all)).slice(0, 6);
  }, [contextualPrompts]);

  return (
    <div className="chat-window">
      {/* Messages Area */}
      <div className="messages-area">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            repoFiles={repoFiles}
            onFileSelect={onFileSelect}
          />
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="typing-indicator">
            <div className="avatar ai">A</div>
            <div>
              <div className="typing-bubble">
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor: "var(--accent-color)",
                      }}
                      animate={
                        shouldReduceMotion
                          ? { opacity: [0.4, 0.8, 0.4] }
                          : {
                              opacity: [0.3, 1, 0.3],
                              scale: [0.9, 1.1, 0.9],
                            }
                      }
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: i * 0.15,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </div>
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
      {!isReadOnly && messages.length > 0 &&
        messages[messages.length - 1].role === "assistant" &&
        !isTyping && (
          <div className="suggestion-chips" style={{ marginBottom: "116px" }}>
            {activeSuggestions.map((s) => (
              <motion.button
                key={s}
                whileHover={chipHover}
                whileTap={chipTap}
                className="chip"
                onClick={() => handleSuggestion(s)}
              >
                {s}
              </motion.button>
            ))}
          </div>
        )}

      {/* Upgraded Floating Command Bar */}
      {!isReadOnly ? (
        <div className="chat-input-area floating">
          <div className="chat-input-wrapper-floating">
            <textarea
              ref={textareaRef}
              className="chat-input-floating"
              placeholder="Ask anything about this codebase…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={isTyping}
            />
            <motion.button
              whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
              className="send-btn"
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              title="Send message (Enter)"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                marginBottom: "2px",
              }}
            >
              <ArrowUp size={16} />
            </motion.button>
          </div>
          <div className="chat-input-footer-floating">
            <div className="chat-input-meta">
              <span className="chat-model-badge">Llama 3.1 8B</span>
              <span className="chat-hint-floating">Enter to send · Shift+Enter for new line</span>
            </div>
            <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>CodeAtlas AI</span>
          </div>
        </div>
      ) : (
        <div className="chat-input-area floating" style={{ zIndex: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", gap: "8px", color: "var(--text-muted)", fontSize: "11.5px", background: "var(--bg-glass)", border: "1px solid var(--border-default)", padding: "10px 14px", borderRadius: "var(--radius-sm)" }}>
            <span>🔒 This report is read-only. Live queries are disabled.</span>
          </div>
        </div>
      )}
    </div>
  );
}