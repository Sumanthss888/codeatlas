"use client";

import { useState, useMemo } from "react";
import { Message, RepoFile } from "@/app/page";
import { Copy, Check, FileCode, Hash } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  message: Message;
  repoFiles?: RepoFile[];
  onFileSelect?: (filePath: string) => void;
};

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy code: ", err);
    }
  };

  return (
    <div className="code-block-container">
      <div className="code-block-header">
        <span className="code-block-lang">{language || "code"}</span>
        <button
          className="code-block-copy"
          onClick={handleCopy}
          title="Copy Code"
        >
          {copied ? (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "11px",
                color: "var(--color-success)",
              }}
            >
              <Check size={12} />
              Copied
            </span>
          ) : (
            <Copy size={12} />
          )}
        </button>
      </div>
      <pre className="code-block-pre">
        <code className="code-block-code">{code}</code>
      </pre>
    </div>
  );
}

function preprocessMarkdown(content: string, repoFiles?: RepoFile[]): string {
  if (!repoFiles || repoFiles.length === 0) return content;

  // Sort paths by length descending to replace longer paths first
  const sortedPaths = [...repoFiles]
    .map((f) => f.filePath)
    .sort((a, b) => b.length - a.length);

  let processed = content;

  for (const path of sortedPaths) {
    if (!path || path.length < 3) continue;
    const escapedPath = path.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    
    // Matches path if not enclosed in backticks or word parts
    const regex = new RegExp("(?<!`)(?<![\\w\\/\\-\\.\\`])" + escapedPath + "(?![\\w\\/\\-\\.\\`])", "g");
    processed = processed.replace(regex, "`" + path + "`");
  }

  return processed;
}

const getMarkdownComponents = (
  repoFiles?: RepoFile[],
  onFileSelect?: (filePath: string) => void
) => ({
  code({ node, inline, className, children, ...props }: any) {
    const codeText = String(children).replace(/\n$/, "");
    const match = /language-(\w+)/.exec(className || "");
    const language = match ? match[1] : "";

    if (!inline && (language || codeText.includes("\n"))) {
      return <CodeBlock code={codeText} language={language || "code"} />;
    }

    const cleanToken = codeText.trim();

    // 1. Direct file match
    const matchingFile = repoFiles?.find(
      (f) => f.filePath === cleanToken || f.fileName === cleanToken
    );

    if (matchingFile && onFileSelect) {
      return (
        <button
          onClick={() => onFileSelect(matchingFile.filePath)}
          className="citation-chip"
          title={`View file: ${matchingFile.filePath}`}
        >
          <FileCode className="citation-icon" />
          {matchingFile.fileName}
        </button>
      );
    }

    // 2. Symbol definition match
    if (cleanToken.length > 3 && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(cleanToken)) {
      const definingFile = repoFiles?.find((f) => {
        const content = f.content || "";
        return (
          content.includes(`function ${cleanToken}`) ||
          content.includes(`const ${cleanToken}`) ||
          content.includes(`class ${cleanToken}`) ||
          content.includes(`def ${cleanToken}`) ||
          content.includes(`export const ${cleanToken}`) ||
          content.includes(`interface ${cleanToken}`) ||
          content.includes(`type ${cleanToken}`)
        );
      });

      if (definingFile && onFileSelect) {
        return (
          <button
            onClick={() => onFileSelect(definingFile.filePath)}
            className="citation-chip"
            title={`Symbol in: ${definingFile.filePath}`}
          >
            <Hash className="citation-icon" />
            {cleanToken}
          </button>
        );
      }
    }

    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
});

function formatTime(date: any) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function MessageBubble({ message, repoFiles, onFileSelect }: Props) {
  const isUser = message.role === "user";

  const processedContent = useMemo(() => {
    if (isUser) return message.content;
    return preprocessMarkdown(message.content, repoFiles);
  }, [message.content, isUser, repoFiles]);

  const mdComponents = useMemo(
    () => getMarkdownComponents(repoFiles, onFileSelect),
    [repoFiles, onFileSelect]
  );

  return (
    <div className={`message-row ${isUser ? "user" : "assistant"}`}>
      {/* Avatar */}
      <div className={`avatar ${isUser ? "user" : "ai"}`}>
        {isUser ? "U" : "A"}
      </div>

      {/* Content */}
      <div>
        <div className={`bubble ${isUser ? "user" : "ai"}`}>
          <div className="message-content">
            {isUser ? (
              processedContent
            ) : (
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents as any}>
                {processedContent}
              </ReactMarkdown>
            )}
          </div>
        </div>
        <span className="bubble-time">{formatTime(message.timestamp)}</span>
      </div>
    </div>
  );
}