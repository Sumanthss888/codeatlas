"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import ChatWindow from "@/components/ChatWindow";
import RepositoryOverview from "@/components/RepositoryOverview";
import ArchitectureMap from "@/components/ArchitectureMap";
import Logo from "@/components/Logo";
import { Sparkles, ArrowRight, ShieldAlert, X } from "lucide-react";
import { motion } from "framer-motion";

export default function ShareReportPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "map" | "chat">("overview");
  const [activeFile, setActiveFile] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/share?id=${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Report not found");
        return res.json();
      })
      .then((data) => {
        setSnapshot(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load share report:", err);
        setError("This share report does not exist or has expired.");
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="app-shell flex" style={{ height: "100vh", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          <span className="btn-spinner" style={{ width: 36, height: 36 }} />
          <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>
            Loading shared workspace atlas...
          </span>
        </div>
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="app-shell flex" style={{ height: "100vh", alignItems: "center", justifyContent: "center" }}>
        <div className="glass-panel" style={{ padding: "32px", borderRadius: "16px", maxWidth: "400px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          <ShieldAlert size={40} style={{ color: "var(--color-error)" }} />
          <h2 style={{ fontSize: "18px", fontWeight: 600 }}>Report Not Found</h2>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            {error || "The requested repository intelligence report could not be loaded."}
          </p>
          <button
            onClick={() => router.push("/")}
            className="analyze-btn"
            style={{ width: "100%", marginTop: "8px" }}
          >
            Go to CodeAtlas Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {/* Sonoma Header */}
      <header className="app-header glass-panel">
        <div className="header-brand">
          <Logo size={18} />
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              color: "var(--accent-color)",
              textTransform: "uppercase",
              border: "1px solid var(--accent-color-soft)",
              padding: "2px 8px",
              borderRadius: "6px",
              background: "var(--accent-color-soft)",
              marginLeft: "8px"
            }}
          >
            Report
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div className="repo-badge">
            <span className="repo-badge-dot" style={{ background: "var(--color-success)" }} />
            <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>
              {snapshot.githubMetadata?.language || "Codebase"} Report
            </span>
            <span style={{ color: "var(--text-muted)", fontSize: "10.5px" }}>
              read-only
            </span>
          </div>

          <button
            onClick={() => router.push("/")}
            className="analyze-btn"
            style={{
              padding: "6px 14px",
              fontSize: "12px",
              background: "transparent",
              border: "1px solid var(--border-strong)",
              color: "var(--text-secondary)",
              boxShadow: "none"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--text-primary)";
              e.currentTarget.style.background = "var(--bg-glass-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-secondary)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            Analyze Your Repo
          </button>
        </div>
      </header>

      {/* Main Viewport */}
      <div className="app-viewport" style={{ height: "calc(100vh - var(--header-height) - 44px)" }}>
        {/* Left Sidebar explorer */}
        <Sidebar
          activeFile={activeFile}
          onFileSelect={(filePath) => setActiveFile(filePath)}
          files={snapshot.files || []}
        />

        {/* Workspace views split */}
        <main className="main-content">
          <div className="workspace-tab-header">
            <div className="workspace-tabs-group">
              <button
                className={`workspace-tab-btn ${activeTab === "overview" ? "active" : ""}`}
                onClick={() => setActiveTab("overview")}
                title="View repo overview details"
              >
                <Sparkles size={13} className="tab-icon" />
                Overview
              </button>
              <button
                className={`workspace-tab-btn ${activeTab === "map" ? "active" : ""}`}
                onClick={() => setActiveTab("map")}
                title="Explore interactive dependency graph map"
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
                onClick={() => setActiveTab("chat")}
                title="Read archived chat conversation"
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
                Chat History
              </button>
            </div>
          </div>

          {activeTab === "overview" ? (
            <div className="workspace-split-view">
              <RepositoryOverview
                files={snapshot.files || []}
                summary={snapshot.summary}
                isSummaryLoading={false}
                githubMetadata={snapshot.githubMetadata}
                onSendMessage={() => {}}
                onClose={() => setActiveTab("chat")}
              />
              <div className="workspace-split-chat">
                <ChatWindow
                  messages={snapshot.messages || []}
                  isTyping={false}
                  onSendMessage={() => {}}
                  repoFiles={snapshot.files || []}
                  onFileSelect={(filePath) => setActiveFile(filePath)}
                  isReadOnly={true}
                />
              </div>
            </div>
          ) : activeTab === "map" ? (
            <div className="workspace-split-view">
              <ArchitectureMap
                files={snapshot.files || []}
                activeFile={activeFile}
                onFileSelect={(filePath) => setActiveFile(filePath)}
                onSendMessage={() => {}}
              />
              <div className="workspace-split-chat">
                <ChatWindow
                  messages={snapshot.messages || []}
                  isTyping={false}
                  onSendMessage={() => {}}
                  repoFiles={snapshot.files || []}
                  onFileSelect={(filePath) => setActiveFile(filePath)}
                  isReadOnly={true}
                />
              </div>
            </div>
          ) : (
            <ChatWindow
              messages={snapshot.messages || []}
              isTyping={false}
              onSendMessage={() => {}}
              repoFiles={snapshot.files || []}
              onFileSelect={(filePath) => setActiveFile(filePath)}
              isReadOnly={true}
            />
          )}
        </main>
      </div>

      {/* Footer CTA Banner */}
      <footer
        className="glass-panel"
        style={{
          height: "44px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderTop: "1px solid var(--border-subtle)",
          background: "var(--accent-color-soft)",
          fontSize: "12px",
          gap: "8px",
          zIndex: 40
        }}
      >
        <span style={{ color: "var(--text-secondary)" }}>
          Interested in this codebase intelligence map?
        </span>
        <button
          onClick={() => router.push("/")}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--accent-color)",
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px"
          }}
        >
          Analyze your own repository on CodeAtlas
          <ArrowRight size={12} />
        </button>
      </footer>
    </div>
  );
}
