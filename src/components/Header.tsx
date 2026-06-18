"use client";

import { useEffect, useState } from "react";
import Logo from "./Logo";
import { Settings, User } from "lucide-react";

type Props = {
  activeRepo: string | null;
  isAnalyzing?: boolean;
  onChangeRepo?: () => void;
  theme?: "light" | "dark" | "system";
  applyTheme?: (theme: "light" | "dark" | "system") => void;
};

export default function Header({
  activeRepo,
  isAnalyzing = false,
  onChangeRepo,
  theme = "system",
  applyTheme = () => {},
}: Props) {
  // Extract simple repository name for the indicator
  const cleanRepoName = activeRepo
    ? activeRepo.split("/").filter(Boolean).slice(-2).join("/")
    : null;

  return (
    <header className="app-header glass-panel">
      <div className="header-brand">
        <Logo size={18} />
      </div>

      {cleanRepoName && (
        <div className="repo-badge">
          <span className={`repo-badge-dot ${isAnalyzing ? "indexing" : ""}`} />
          <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>
            {cleanRepoName}
          </span>
          <span style={{ color: "var(--text-muted)", fontSize: "10.5px" }}>
            {isAnalyzing ? "indexing" : "indexed"}
          </span>
          {onChangeRepo && (
            <button
              onClick={onChangeRepo}
              className="change-repo-btn"
              title="Switch to another repository"
            >
              Change
            </button>
          )}
        </div>
      )}

      <div className="header-actions">
        <div className="theme-switch-group">
          <button
            onClick={() => applyTheme("light")}
            className={`theme-switch-btn ${theme === "light" ? "active" : ""}`}
            aria-label="Light mode"
          >
            Light
          </button>
          <button
            onClick={() => applyTheme("dark")}
            className={`theme-switch-btn ${theme === "dark" ? "active" : ""}`}
            aria-label="Dark mode"
          >
            Dark
          </button>
          <button
            onClick={() => applyTheme("system")}
            className={`theme-switch-btn ${theme === "system" ? "active" : ""}`}
            aria-label="System theme"
          >
            System
          </button>
        </div>

        <button
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-secondary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "6px",
            borderRadius: "6px",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--bg-glass-hover)";
            e.currentTarget.style.color = "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--text-secondary)";
          }}
          title="Settings"
        >
          <Settings size={16} />
        </button>

        <button
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-secondary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "6px",
            borderRadius: "6px",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--bg-glass-hover)";
            e.currentTarget.style.color = "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--text-secondary)";
          }}
          title="User Profile"
        >
          <User size={16} />
        </button>
      </div>
    </header>
  );
}
