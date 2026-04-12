"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import ChatWindow from "@/components/ChatWindow";
import RepoInput from "@/components/RepoInput";

// ─── Types ─────────────────────────────────────────────

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

export type RepoFile = {
  fileName: string;
  filePath: string;
};

export type FetchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; totalFiles: number }
  | { status: "error"; message: string };

// ─── Component ─────────────────────────────────────────

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Welcome to **CodeAtlas** 🗺️ — paste a GitHub repository URL above and I'll analyze your codebase.",
      timestamp: new Date(),
    },
  ]);

  const [isTyping, setIsTyping] = useState(false);

  const [repoFiles, setRepoFiles] = useState<RepoFile[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [fetchState, setFetchState] = useState<FetchState>({ status: "idle" });

  // ── GitHub Fetch ─────────────────────────────────────
  const handleAnalyze = async (url: string) => {
    if (!url.trim()) return;

    setRepoFiles([]);
    setActiveFile(null);
    setFetchState({ status: "loading" });

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: `Analyze this repository: ${url}`,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const encodedUrl = encodeURIComponent(url.trim());

      const res = await fetch(`/api/github?url=${encodedUrl}`);

      if (!res.ok) {
        const text = await res.text();
        console.error("GitHub API Error:", text);
        throw new Error("Failed to fetch repository data");
      }

      const data: { totalFiles: number; files: RepoFile[] } =
        await res.json();

      setRepoFiles(data.files);
      setFetchState({ status: "success", totalFiles: data.totalFiles });

      const repoName = url.split("/").filter(Boolean).at(-1) ?? "repository";

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Repository loaded successfully ✅  
Indexed ${data.totalFiles} files from ${repoName}.  

You can now:
• Click any file to understand it  
• Ask architecture questions  
• Explore the codebase`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error("Fetch error:", err);

      const message =
        err instanceof Error ? err.message : "Unexpected error";

      setFetchState({ status: "error", message });

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Analysis failed ❌\n${message}`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // ── AI Chat ──────────────────────────────────────────
  const handleSendMessage = async (
    content: string,
    files?: RepoFile[]
  ) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: content,
          files: files ?? repoFiles,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "AI request failed");
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      console.error("AI error:", error);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          error?.message ||
          "⚠️ AI failed. Check API / model configuration.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // ── 🔥 NEW: FILE CLICK → AI EXPLAIN ───────────────────
  const handleFileClick = (filePath: string) => {
    setActiveFile(filePath);

    const question = `Explain this file: ${filePath}. What does it do and where is it used?`;

    handleSendMessage(question);
  };

  // ── Render ───────────────────────────────────────────
  return (
    <div className="app-shell">
      <Sidebar
        activeFile={activeFile}
        onFileSelect={handleFileClick}
        files={repoFiles}
        
      />

      <main className="main-content">
        <RepoInput
          onAnalyze={handleAnalyze}
          isAnalyzing={fetchState.status === "loading"}
        />

        <ChatWindow
          messages={messages}
          isTyping={isTyping}
          onSendMessage={handleSendMessage}
          repoFiles={repoFiles}
        />
      </main>
    </div>
  );
}