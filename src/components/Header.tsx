"use client";

import { useEffect, useState } from "react";
import Logo from "./Logo";
import { Settings } from "lucide-react";
import Avatar from "./user/Avatar";
import ProfileDropdown from "./user/ProfileDropdown";

type Props = {
  activeRepo: string | null;
  isAnalyzing?: boolean;
  onChangeRepo?: () => void;
  theme?: "light" | "dark" | "system";
  applyTheme?: (theme: "light" | "dark" | "system") => void;
  onSettingsClick?: () => void;
};

export default function Header({
  activeRepo,
  isAnalyzing = false,
  onChangeRepo,
  theme = "system",
  applyTheme = () => {},
  onSettingsClick,
}: Props) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Extract simple repository name for the indicator
  const cleanRepoName = activeRepo
    ? activeRepo.split("/").filter(Boolean).slice(-2).join("/")
    : null;

  return (
    <header className="app-header glass-panel animate-header-entrance">
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
          id="header-settings-btn"
          onClick={onSettingsClick}
          aria-label="Open workspace preferences panel"
          className="header-action-btn"
          title="Settings"
        >
          <Settings size={16} />
        </button>

        <div className="profile-container" style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <Avatar onClick={() => setIsDropdownOpen(!isDropdownOpen)} />
          <ProfileDropdown
            isOpen={isDropdownOpen}
            onClose={() => setIsDropdownOpen(false)}
            onSettingsClick={onSettingsClick}
          />
        </div>
      </div>
    </header>
  );
}
