"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import ChatWindow from "@/components/ChatWindow";
import RepositoryInput from "@/components/RepositoryInput/RepositoryInput";
import Header from "@/components/Header";
import CommandPalette from "@/components/CommandPalette";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import PreferencesPanel from "@/components/PreferencesPanel";
import useWorkspaceOverlay from "@/components/workspace-overlay/useWorkspaceOverlay";
import OverviewOverlay from "@/components/workspace-overlay/overlays/OverviewOverlay";
import ArchitectureOverlay from "@/components/workspace-overlay/overlays/ArchitectureOverlay";
import { buildPermalink } from "@/lib/share/buildPermalink";
import { copyToClipboard } from "@/lib/share/copyToClipboard";
import { parsePermalink } from "@/lib/share/parsePermalink";
import { useToast } from "@/components/ui/Toast";
import { Sparkles } from "lucide-react";

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
  content?: string;
};

export type FetchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; totalFiles: number }
  | { status: "error"; message: string };

// ─── Component ─────────────────────────────────────────

export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [recentRepos, setRecentRepos] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("codeatlas_recent_repos");
      if (saved) {
        setRecentRepos(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const addRecentRepo = (url: string) => {
    try {
      const saved = localStorage.getItem("codeatlas_recent_repos");
      let list: string[] = saved ? JSON.parse(saved) : [];
      list = [url, ...list.filter((x) => x !== url)].slice(0, 10);
      setRecentRepos(list);
      localStorage.setItem("codeatlas_recent_repos", JSON.stringify(list));
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearRecentRepos = () => {
    try {
      localStorage.removeItem("codeatlas_recent_repos");
      setRecentRepos([]);
    } catch {}
  };

  const handleClearCache = () => {
    try {
      sessionStorage.clear();
      handleSetActiveTab("chat");
    } catch {}
  };

  const handleResetWorkspace = () => {
    try {
      localStorage.removeItem("theme");
      localStorage.removeItem("codeatlas_recent_repos");
      sessionStorage.clear();

      setRecentRepos([]);
      setTheme("system");
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", isDark);

      setMessages([
        {
          id: "1",
          role: "assistant",
          content:
            "Welcome to **CodeAtlas** 🗺️ — paste a GitHub repository URL above and I'll analyze your codebase.",
          timestamp: new Date(),
        },
      ]);
      setRepoFiles([]);
      setActiveFile(null);
      setFetchState({ status: "idle" });
      setCurrentRepoUrl(null);
      handleSetActiveTab("chat");
      setRepoSummary(null);
      setIsSummaryLoading(false);
      setGithubMetadata(null);
      setIsDemoMode(false);
      setIsSettingsOpen(false);
    } catch {}
  };

  useEffect(() => {
    // Read persisted theme from localStorage on mount
    try {
      const saved = localStorage.getItem("theme") as "light" | "dark" | "system" | null;
      if (saved) {
        setTheme(saved);
      }
    } catch {}
  }, []);

  const applyTheme = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    try {
      localStorage.setItem("theme", newTheme);
      const isDark =
        newTheme === "dark" ||
        (newTheme === "system" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.classList.toggle("dark", isDark);
    } catch {}
  };

  // Sync with OS color scheme when in "system" mode
  useEffect(() => {
    if (theme !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle("dark", e.matches);
    };

    media.addEventListener("change", handler);
    return () => {
      media.removeEventListener("change", handler);
    };
  }, [theme]);

  // Command palette hotkey shortcut
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      const isK = e.key === "k" || e.key === "K";
      const isMetaOrCtrl = e.metaKey || e.ctrlKey;

      if (isMetaOrCtrl && isK) {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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
  const [currentRepoUrl, setCurrentRepoUrl] = useState<string | null>(null);

  const { activeOverlay, openOverlay, closeOverlay, toggleOverlay } = useWorkspaceOverlay();

  const activeTab = activeOverlay === "overview" ? "overview" : activeOverlay === "architecture" ? "map" : "chat";
  const [repoSummary, setRepoSummary] = useState<string | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [githubMetadata, setGithubMetadata] = useState<any | null>(null);

  // Deep-linking restoration states
  const [initialRepoInput, setInitialRepoInput] = useState("");
  const [targetTabAfterLoad, setTargetTabAfterLoad] = useState<"chat" | "overview" | "map" | null>(null);
  const { showToast } = useToast();

  const handleSetActiveTab = (tab: "chat" | "overview" | "map") => {
    if (tab === "overview") {
      toggleOverlay("overview");
    } else if (tab === "map") {
      toggleOverlay("architecture");
    } else {
      closeOverlay();
    }
    try {
      sessionStorage.setItem("codeatlas_active_tab", tab === activeTab ? "chat" : tab);
    } catch {}
  };

  // Load active tab from sessionStorage on mount
  useEffect(() => {
    try {
      const savedTab = sessionStorage.getItem("codeatlas_active_tab") as "chat" | "overview" | "map" | null;
      if (savedTab) {
        setTimeout(() => {
          if (savedTab === "overview") openOverlay("overview");
          else if (savedTab === "map") openOverlay("architecture");
          else closeOverlay();
        }, 50);
      }
    } catch {}
  }, []);

  // ── Share & Demo states ──────────────────────────────
  const [shareStatus, setShareStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [isDemoMode, setIsDemoMode] = useState(false);

  const handleShare = async () => {
    if (shareStatus === "loading" || shareStatus === "success") return;
    if (!currentRepoUrl) return;

    setShareStatus("loading");
    try {
      const permalink = buildPermalink(currentRepoUrl);
      const copied = await copyToClipboard(permalink);

      if (copied) {
        setShareStatus("success");
        setTimeout(() => setShareStatus("idle"), 2500);
      } else {
        throw new Error("Copy failed");
      }
    } catch (err) {
      console.error("Failed to copy link:", err);
      setShareStatus("error");
      setTimeout(() => setShareStatus("idle"), 2500);
    }
  };

  const handleLoadDemo = async (repoName: "nextjs" | "shadcn" | "tailwind") => {
    setFetchState({ status: "loading" });
    try {
      const res = await fetch(`/demos/${repoName}.json`);
      if (!res.ok) throw new Error("Failed to load demo dataset");
      const data = await res.json();

      const repoUrls = {
        nextjs: "https://github.com/vercel/next.js",
        shadcn: "https://github.com/shadcn-ui/ui",
        tailwind: "https://github.com/tailwindlabs/tailwindcss"
      };

      setCurrentRepoUrl(repoUrls[repoName]);
      setRepoFiles(data.files);
      setGithubMetadata(data.githubMetadata);
      setRepoSummary(data.repoSummary);
      setMessages(data.messages);
      setIsDemoMode(true);
      setFetchState({ status: "success", totalFiles: data.totalFiles });
      handleSetActiveTab("overview");
    } catch (err) {
      console.error("Failed to load demo:", err);
      setFetchState({ status: "error", message: "Failed to load demo" });
    }
  };

  // ── GitHub Fetch ─────────────────────────────────────
  const handleAnalyze = async (url: string) => {
    if (!url.trim()) return;

    setRepoFiles([]);
    setActiveFile(null);
    setFetchState({ status: "loading" });
    setCurrentRepoUrl(url.trim());

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

      const data: { totalFiles: number; files: RepoFile[]; githubMetadata?: any } =
        await res.json();

      setRepoFiles(data.files);
      setGithubMetadata(data.githubMetadata || null);
      setFetchState({ status: "success", totalFiles: data.totalFiles });
      addRecentRepo(url.trim());

      // Default activeTab to overview when loaded, unless they previously closed it
      const wasClosed = sessionStorage.getItem("codeatlas_overview_closed") === "true";
      if (!wasClosed) {
        handleSetActiveTab("overview");
      } else {
        handleSetActiveTab("chat");
      }

      // Fetch AI summary asynchronously
      setIsSummaryLoading(true);
      setRepoSummary(null);
      fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "summary",
          files: data.files,
        }),
      })
        .then((r) => r.json())
        .then((sData) => {
          setRepoSummary(sData.answer || null);
        })
        .catch((err) => {
          console.error("Failed to fetch repository summary:", err);
        })
        .finally(() => {
          setIsSummaryLoading(false);
        });

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

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "AI request failed");
      }

      const contentType = res.headers.get("Content-Type") || "";
      if (contentType.includes("text/event-stream")) {
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) throw new Error("Stream reader not available");

        const assistantMessageId = (Date.now() + 1).toString();
        // Insert empty assistant message
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMessageId,
            role: "assistant",
            content: "",
            timestamp: new Date(),
          },
        ]);

        let partialLine = "";
        let fullAnswer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = (partialLine + chunk).split("\n");
          partialLine = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            if (trimmed === "data: [DONE]") continue;

            if (trimmed.startsWith("data: ")) {
              try {
                const data = JSON.parse(trimmed.slice(6));
                const token = data.choices?.[0]?.delta?.content || "";
                if (token) {
                  fullAnswer += token;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: fullAnswer }
                        : msg
                    )
                  );
                }
              } catch (e) {
                // ignore incomplete lines
              }
            }
          }
        }
      } else {
        // Fallback for non-streaming response
        const data = await res.json();
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.answer,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
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

  // ── 🔥 NEW: CHANGE REPO ACTION ──────────────────────
  const handleChangeRepo = () => {
    setCurrentRepoUrl(null);
    setRepoFiles([]);
    setActiveFile(null);
    setFetchState({ status: "idle" });
    setRepoSummary(null);
    setGithubMetadata(null);
    setIsSummaryLoading(false);
    setIsDemoMode(false);
    handleSetActiveTab("chat");
    try {
      sessionStorage.removeItem("codeatlas_overview_closed");
    } catch {}
    setMessages([
      {
        id: "1",
        role: "assistant",
        content:
          "Welcome to **CodeAtlas** 🗺️ — paste a GitHub repository URL above and I'll analyze your codebase.",
        timestamp: new Date(),
      },
    ]);
  };

  // ── 🔥 NEW: FILE CLICK → AI EXPLAIN ───────────────────
  const handleFileClick = (filePath: string) => {
    setActiveFile(filePath);
    setIsSidebarOpen(false);

    const question = `Explain this file: ${filePath}. What does it do and where is it used?`;

    handleSendMessage(question);
  };

  const shouldReduceMotion = useReducedMotion();

  const sidebarTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.3, ease: [0.22, 1, 0.36, 1] };

  const contentTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.3, delay: 0.05, ease: [0.22, 1, 0.36, 1] };

  const isWorkspaceActive = currentRepoUrl !== null;

  // ── Render ───────────────────────────────────────────
  return (
    <div className={`app-shell ${activeOverlay ? "overlay-open" : ""}`}>
      <Header
        activeRepo={currentRepoUrl}
        isAnalyzing={fetchState.status === "loading"}
        onChangeRepo={handleChangeRepo}
        theme={theme}
        applyTheme={applyTheme}
        onSettingsClick={() => setIsSettingsOpen(true)}
      />

      <div className="app-viewport">
        {isWorkspaceActive ? (
          <>
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={sidebarTransition}
              style={{ display: "flex", height: "100%" }}
              className={`sidebar-wrapper ${isSidebarOpen ? "open" : ""}`}
            >
              <Sidebar
                activeFile={activeFile}
                onFileSelect={handleFileClick}
                files={repoFiles}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
              />
            </motion.div>

            {isSidebarOpen && (
              <div
                className="sidebar-backdrop mobile-only-block"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}

            <motion.main
              className="main-content"
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={contentTransition}
            >
              <div className="workspace-tab-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="workspace-tabs-group">
                  {/* Mobile-only Files Explorer Trigger */}
                  <button
                    className="workspace-tab-btn mobile-only-flex"
                    onClick={() => setIsSidebarOpen(true)}
                    title="Open repository files explorer"
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="tab-icon"
                    >
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                    Files
                  </button>
                  <button
                    className={`workspace-tab-btn ${activeTab === "overview" ? "active" : ""}`}
                    onClick={() => handleSetActiveTab("overview")}
                    title="View repository metrics, tech stack, and summaries"
                  >
                    <Sparkles size={13} className="tab-icon" />
                    Overview
                  </button>
                  <button
                    className={`workspace-tab-btn ${activeTab === "map" ? "active" : ""}`}
                    onClick={() => handleSetActiveTab("map")}
                    title="Explore codebase dependency graph"
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="tab-icon"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                    Architecture Map
                  </button>
                  <button
                    className={`workspace-tab-btn ${activeTab === "chat" ? "active" : ""}`}
                    onClick={() => handleSetActiveTab("chat")}
                    title="View full-width chat interface"
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="tab-icon"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    Chat
                  </button>
                </div>

                {/* Share Report Button */}
                {fetchState.status === "success" && (
                  <button
                    onClick={handleShare}
                    disabled={shareStatus === "loading"}
                    className="share-report-btn"
                    title="Copy public read-only analysis report link"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "12px",
                      fontWeight: 500,
                      color: shareStatus === "success" ? "var(--color-success)" : "var(--text-secondary)",
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border-default)",
                      padding: "6px 12px",
                      borderRadius: "var(--radius-sm)",
                      cursor: shareStatus === "loading" ? "not-allowed" : "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    {shareStatus === "loading" ? (
                      <>
                        <span className="btn-spinner" style={{ width: 10, height: 10 }} />
                        Sharing…
                      </>
                    ) : shareStatus === "success" ? (
                      <>
                        <span>✓</span>
                        Copied Link!
                      </>
                    ) : shareStatus === "error" ? (
                      <>
                        <span>⚠️</span>
                        Failed
                      </>
                    ) : (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                          <polyline points="16 6 12 2 8 6" />
                          <line x1="12" y1="2" x2="12" y2="15" />
                        </svg>
                        Share Report
                      </>
                    )}
                  </button>
                )}
              </div>

              <ChatWindow
                messages={messages}
                isTyping={isTyping}
                onSendMessage={handleSendMessage}
                repoFiles={repoFiles}
                onFileSelect={(filePath) => {
                  setActiveFile(filePath);
                  setTimeout(() => {
                    const el = document.querySelector(`[data-filepath="${filePath}"]`);
                    if (el) {
                      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
                    }
                  }, 100);
                }}
              />
            </motion.main>

            <OverviewOverlay
              isOpen={activeOverlay === "overview"}
              onClose={() => handleSetActiveTab("chat")}
              files={repoFiles}
              summary={repoSummary}
              isSummaryLoading={isSummaryLoading}
              githubMetadata={githubMetadata}
              onSendMessage={(content) => {
                handleSendMessage(content);
                handleSetActiveTab("chat");
              }}
            />

            <ArchitectureOverlay
              isOpen={activeOverlay === "architecture"}
              onClose={() => handleSetActiveTab("chat")}
              files={repoFiles}
              activeFile={activeFile}
              onFileSelect={(filePath) => {
                setActiveFile(filePath);
                setTimeout(() => {
                  const el = document.querySelector(`[data-filepath="${filePath}"]`);
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
                  }
                }, 100);
              }}
              onSendMessage={(content) => {
                handleSendMessage(content);
                handleSetActiveTab("chat");
              }}
            />
          </>
        ) : (
          <div className="onboarding-hero">
            {/* Layer 1: Animated Gradient Base */}
            <div className="bg-layer-1-gradient" />
            
            {/* Layer 2: Ambient Color Fields (4 blurred atmospheric orbs) */}
            <div className="bg-layer-2-orbs">
              <div className="orb orb-1" />
              <div className="orb orb-2" />
              <div className="orb orb-3" />
              <div className="orb orb-4" />
            </div>
            
            {/* Layer 3: Animated Dot Grid */}
            <div className="bg-layer-3-dot-grid" />
            
            {/* Layer 4: Film Grain Overlay */}
            <svg className="bg-layer-4-grain" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
              <filter id="noiseFilter">
                <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
              </filter>
              <rect width="100%" height="100%" filter="url(#noiseFilter)" />
            </svg>

            <div className="onboarding-content">
              <div className="onboarding-content-header">
                <span className="onboarding-logo-icon-wrapper">
                  <svg
                    width="36"
                    height="36"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ color: "var(--accent-color)" }}
                  >
                    <circle cx="12" cy="12" r="10" strokeDasharray="3 3" opacity="0.5" />
                    <circle cx="12" cy="8" r="2.5" fill="currentColor" />
                    <circle cx="7" cy="15" r="2" fill="currentColor" />
                    <circle cx="17" cy="15" r="2" fill="currentColor" />
                    <line x1="12" y1="8" x2="7" y2="15" stroke="currentColor" strokeWidth="1.5" />
                    <line x1="12" y1="8" x2="17" y2="15" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </span>
                <span className="onboarding-logo-text">
                  CodeAtlas
                </span>
              </div>

              <h1 className="onboarding-title">
                {"Understand any codebase in minutes.".split(" ").map((word, index) => (
                  <span
                    key={index}
                    className="headline-word"
                    style={{ "--delay": `${index * 80 + 350}ms` } as React.CSSProperties}
                  >
                    {word}&nbsp;
                  </span>
                ))}
              </h1>
              <p className="onboarding-tagline">
                AI-powered repository intelligence for developers. Trace architecture, ask questions, and explore file structures.
              </p>

              <div className="onboarding-input-container">
                <RepositoryInput
                  onAnalyze={handleAnalyze}
                  isAnalyzing={fetchState.status === "loading"}
                  initialValue={initialRepoInput}
                />

                {/* Instant sandbox demo entry points */}
                <div 
                  className="demo-section onboarding-demo-container"
                  style={{ opacity: 0, animation: "cssFade 0.6s ease-out forwards", animationDelay: "1250ms" }}
                >
                  <span className="onboarding-demo-label">
                    ⚡ Instant Sandbox Showcases
                  </span>
                  <div className="onboarding-demo-list">
                    <button
                      onClick={() => handleLoadDemo("nextjs")}
                      className="demo-card-btn glass-panel"
                      title="Load vercel/next.js interactive demo"
                      style={{ opacity: 0, animation: "cssFadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards", animationDelay: "1350ms" }}
                    >
                      vercel/next.js
                    </button>
                    <button
                      onClick={() => handleLoadDemo("shadcn")}
                      className="demo-card-btn glass-panel"
                      title="Load shadcn-ui/ui interactive demo"
                      style={{ opacity: 0, animation: "cssFadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards", animationDelay: "1450ms" }}
                    >
                      shadcn-ui/ui
                    </button>
                    <button
                      onClick={() => handleLoadDemo("tailwind")}
                      className="demo-card-btn glass-panel"
                      title="Load tailwindlabs/tailwindcss interactive demo"
                      style={{ opacity: 0, animation: "cssFadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards", animationDelay: "1550ms" }}
                    >
                      tailwind/tailwindcss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        repoFiles={repoFiles}
        onFileSelect={(filePath) => {
          setActiveFile(filePath);
          setTimeout(() => {
            const el = document.querySelector(`[data-filepath="${filePath}"]`);
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
          }, 100);
        }}
        onSendMessage={handleSendMessage}
        onChangeRepo={handleChangeRepo}
        onSelectExampleRepo={(repoUrl) => {
          handleAnalyze(repoUrl);
        }}
        currentTheme={theme}
        applyTheme={applyTheme}
      />

      <AnimatePresence>
        {isSettingsOpen && (
          <PreferencesPanel
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            theme={theme}
            applyTheme={applyTheme}
            onClearRecentRepos={handleClearRecentRepos}
            onClearCache={handleClearCache}
            onResetWorkspace={handleResetWorkspace}
            recentReposCount={recentRepos.length}
          />
        )}
      </AnimatePresence>
    </div>
  );
}