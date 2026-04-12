"use client";

import { Message } from "@/app/page";

type Props = {
  message: Message;
};

function formatContent(content: string) {
  // Split by code blocks first
  const parts = content.split(/(```[\s\S]*?```)/g);

  return parts.map((part, i) => {
    if (part.startsWith("```")) {
      const lines = part.split("\n");
      const lang = lines[0].replace("```", "").trim();
      const code = lines.slice(1, -1).join("\n");
      return (
        <pre key={i}>
          {lang && (
            <span
              style={{
                display: "block",
                fontSize: "10px",
                color: "var(--accent-blue)",
                marginBottom: "6px",
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 600,
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              {lang}
            </span>
          )}
          <code>{code}</code>
        </pre>
      );
    }

    // Process inline markdown: **bold**, `code`
    const inlineParts = part.split(/(\*\*[^*]+\*\*|`[^`]+`|\n)/g);
    return (
      <span key={i}>
        {inlineParts.map((chunk, j) => {
          if (chunk === "\n") return <br key={j} />;
          if (chunk.startsWith("**") && chunk.endsWith("**")) {
            return <strong key={j}>{chunk.slice(2, -2)}</strong>;
          }
          if (chunk.startsWith("`") && chunk.endsWith("`")) {
            return <code key={j}>{chunk.slice(1, -1)}</code>;
          }
          return chunk;
        })}
      </span>
    );
  });
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`message-row ${isUser ? "user" : "assistant"}`}>
      {/* Avatar */}
      <div className={`avatar ${isUser ? "user" : "ai"}`}>
        {isUser ? "U" : "🗺"}
      </div>

      {/* Content */}
      <div>
        <div className={`bubble ${isUser ? "user" : "ai"}`}>
          <div className="message-content">{formatContent(message.content)}</div>
        </div>
        <span className="bubble-time">{formatTime(message.timestamp)}</span>
      </div>
    </div>
  );
}