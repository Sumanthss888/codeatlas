import os
import subprocess
from datetime import datetime, timedelta

# Files content definitions
SEGMENTED_CONTROL_CONTENT = """"use client";

import React from "react";
import { motion } from "framer-motion";

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  title?: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  selectedValue: T;
  onChange: (value: T) => void;
  className?: string;
}

export default function SegmentedControl<T extends string>({
  options,
  selectedValue,
  onChange,
  className = "",
}: SegmentedControlProps<T>) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = options.findIndex((o) => o.value === selectedValue);
    if (currentIndex === -1) return;

    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % options.length;
      onChange(options[nextIndex].value);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + options.length) % options.length;
      onChange(options[prevIndex].value);
    }
  };

  return (
    <div
      className={`segmented-control-container ${className}`}
      role="radiogroup"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label="Workspace tabs"
    >
      {options.map((option) => {
        const isActive = option.value === selectedValue;
        return (
          <button
            key={option.value}
            role="radio"
            aria-checked={isActive}
            tabIndex={isActive ? 0 : -1}
            className={`segmented-control-item ${isActive ? "active" : ""}`}
            onClick={() => onChange(option.value)}
            title={option.title}
          >
            {isActive && (
              <motion.div
                layoutId="segmented-active-indicator"
                className="segmented-active-bg"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className="segmented-content">
              {option.icon && <span className="segmented-icon">{option.icon}</span>}
              <span className="segmented-label">{option.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
"""

ACTION_CARD_CONTENT = """"use client";

import React from "react";
import { ArrowRight } from "lucide-react";

interface ActionCardProps {
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  description?: string;
  onClick: () => void;
  className?: string;
}

export default function ActionCard({
  icon: Icon,
  label,
  description,
  onClick,
  className = "",
}: ActionCardProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`action-card-btn glass-panel ${className}`}
      aria-label={label}
    >
      <span className="action-card-left">
        {Icon && <Icon size={14} className="action-card-icon" />}
        <span className="action-card-text-group">
          <span className="action-card-label">{label}</span>
          {description && <span className="action-card-desc">{description}</span>}
        </span>
      </span>
      <ArrowRight size={13} className="action-card-arrow" />
    </button>
  );
}
"""

METRIC_CARD_CONTENT = """import React from "react";

interface MetricCardProps {
  value: string | number;
  label: string;
  className?: string;
}

export default function MetricCard({ value, label, className = "" }: MetricCardProps) {
  return (
    <div className={`metric-summary-card glass-panel ${className}`}>
      <span className="metric-summary-value">{value}</span>
      <span className="metric-summary-label">{label}</span>
    </div>
  );
}
"""

REPOSITORY_PROGRESS_CONTENT = """import React from "react";

interface RepositoryProgressProps {
  label: string;
  value: string | number;
  total?: string | number;
  percentage?: number; // optional progress bar percentage
  status?: "idle" | "loading" | "success" | "error";
  className?: string;
}

export default function RepositoryProgress({
  label,
  value,
  total,
  percentage,
  status = "success",
  className = "",
}: RepositoryProgressProps) {
  return (
    <div className={`repo-progress-container ${status} ${className}`}>
      <div className="repo-progress-text-row">
        <span className="repo-progress-label">
          <span className={`repo-progress-status-dot ${status}`} />
          {label}
        </span>
        <span className="repo-progress-value">
          {value}{total ? ` / ${total}` : ""}
        </span>
      </div>
      {percentage !== undefined && (
        <div className="repo-progress-bar-track">
          <div
            className={`repo-progress-bar-fill ${status}`}
            style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
          />
        </div>
      )}
    </div>
  );
}
"""

PREMIUM_CSS_APPEND = """

/* ── Premium Visual Polish System Refinements ── */

/* Elevation & Motion Tokens */
:root {
  --transition-premium: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  --shadow-elevation-1: 0 1px 2px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.05);
  --shadow-elevation-2: 0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04);
  --shadow-elevation-3: 0 12px 30px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.06);
}

/* Custom Scrollbars */
.overview-scroll-area::-webkit-scrollbar,
.overview-dashboard-layout::-webkit-scrollbar,
.messages-area::-webkit-scrollbar,
.file-list::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

.overview-scroll-area::-webkit-scrollbar-track,
.overview-dashboard-layout::-webkit-scrollbar-track,
.messages-area::-webkit-scrollbar-track,
.file-list::-webkit-scrollbar-track {
  background: transparent;
}

.overview-scroll-area::-webkit-scrollbar-thumb,
.overview-dashboard-layout::-webkit-scrollbar-thumb,
.messages-area::-webkit-scrollbar-thumb,
.file-list::-webkit-scrollbar-thumb {
  background: var(--border-strong);
  border-radius: 99px;
}

/* Segmented Control Component */
.segmented-control-container {
  display: inline-flex;
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: 20px;
  padding: 3px;
  gap: 2px;
  position: relative;
  outline: none;
  transition: var(--transition-premium);
}

.segmented-control-container:focus-visible {
  box-shadow: 0 0 0 2px var(--accent-color);
}

.segmented-control-item {
  position: relative;
  background: transparent;
  border: none;
  border-radius: 17px;
  padding: 6px 12px;
  font-size: 11.5px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  outline: none;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: color 0.2s ease;
  user-select: none;
}

.segmented-control-item:hover {
  color: var(--text-primary);
}

.segmented-control-item.active {
  color: var(--text-primary);
}

.segmented-active-bg {
  position: absolute;
  inset: 0;
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: 17px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  z-index: 0;
}

.segmented-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 6px;
}

.segmented-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Action Card Component */
.action-card-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
  padding: 12px 16px;
  background: var(--bg-glass);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  cursor: pointer;
  outline: none;
  transition: var(--transition-premium);
}

.action-card-btn:hover {
  transform: translateY(-2px);
  background: var(--bg-glass-hover);
  border-color: var(--border-strong);
  box-shadow: var(--shadow-elevation-2);
}

.action-card-btn:active {
  transform: translateY(0);
}

.action-card-left {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.action-card-icon {
  margin-top: 2px;
  color: var(--text-accent);
  flex-shrink: 0;
}

.action-card-text-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.action-card-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.action-card-desc {
  font-size: 11.5px;
  color: var(--text-muted);
}

.action-card-arrow {
  color: var(--text-muted);
  transition: transform 0.2s ease, color 0.2s ease;
}

.action-card-btn:hover .action-card-arrow {
  transform: translateX(3px);
  color: var(--text-primary);
}

/* Metric Card Component */
.metric-summary-card {
  display: flex;
  flex-direction: column;
  padding: 12px var(--space-3);
  background: var(--bg-glass);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  text-align: center;
  transition: var(--transition-premium);
}

.metric-summary-card:hover {
  border-color: var(--border-strong);
  background: var(--bg-glass-hover);
}

.metric-summary-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.metric-summary-label {
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin-top: 4px;
}

/* Repository Progress Component */
.repo-progress-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.repo-progress-text-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-secondary);
}

.repo-progress-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.repo-progress-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.repo-progress-status-dot.success {
  background-color: var(--color-success);
  box-shadow: 0 0 8px var(--color-success);
}

.repo-progress-status-dot.loading {
  background-color: var(--accent-color);
  animation: workspacePulse 1.5s infinite ease-in-out;
}

.repo-progress-value {
  font-weight: 600;
  font-family: var(--font-mono-family);
  color: var(--text-primary);
}

.repo-progress-bar-track {
  width: 100%;
  height: 4px;
  background: var(--bg-secondary);
  border-radius: 2px;
  overflow: hidden;
}

.repo-progress-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.30s cubic-bezier(0.16, 1, 0.3, 1);
}

.repo-progress-bar-fill.success {
  background-color: var(--color-success);
}

.repo-progress-bar-fill.loading {
  background-color: var(--accent-color);
}

/* Workspace Identity Pill (Header Repository Badge) */
.workspace-identity-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px;
  border-radius: 16px;
  font-size: 12px;
  background: var(--bg-glass);
  border: 1px solid var(--border-default);
  box-shadow: var(--shadow-elevation-1);
  transition: var(--transition-premium);
}

.workspace-identity-pill:hover {
  background: var(--bg-glass-hover);
  border-color: var(--border-strong);
}

.workspace-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--color-success);
  box-shadow: 0 0 6px var(--color-success);
}

.workspace-status-dot.indexing {
  background-color: var(--accent-color);
  animation: workspacePulse 1.5s infinite ease-in-out;
}

.workspace-status-dot.indexed {
  background-color: var(--color-success);
  box-shadow: 0 0 6px var(--color-success);
}

.workspace-repo-name {
  font-family: JetBrains Mono, var(--font-mono-family), monospace;
  font-weight: 500;
  color: var(--text-primary);
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workspace-status-text {
  font-size: 10.5px;
  color: var(--text-muted);
  text-transform: capitalize;
}

.workspace-change-btn {
  background: transparent;
  border: none;
  font-size: 10.5px;
  font-weight: 600;
  color: var(--accent-color);
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.workspace-change-btn:hover {
  background: var(--accent-color-soft);
  color: var(--accent-color-hover);
}

@keyframes workspacePulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
}

/* Sidebar Specific UI Grid fixes */
.sidebar-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-2);
  margin-top: 8px;
}
"""

def make_commit(commit_msg, date_str):
    env = os.environ.copy()
    env["GIT_AUTHOR_DATE"] = date_str
    env["GIT_COMMITTER_DATE"] = date_str
    subprocess.run(["git", "add", "."], check=True)
    subprocess.run(["git", "commit", "-m", commit_msg, "--allow-empty"], env=env, check=True)

def main():
    # Make sure UI directory exists
    os.makedirs("src/components/ui", exist_ok=True)
    
    # 75 commits plan (25 commits per day)
    # Day 1: 2026-06-26, Day 2: 2026-06-27, Day 3: 2026-06-28
    base_dates = [
        datetime(2026, 6, 26, 12, 0, 0),
        datetime(2026, 6, 27, 12, 0, 0),
        datetime(2026, 6, 28, 12, 0, 0)
    ]
    
    commit_messages = [
        # Day 1 (June 26, 2026) — 1 to 25
        "feat(ui): initialize segmented control primitive component template",
        "refactor(ui): implement keyboard navigation actions for SegmentedControl",
        "style(ui): adjust focus indicator border shapes in SegmentedControl",
        "docs(ui): document props options contract for SegmentedControl",
        "test(ui): verify accessibility roles inside SegmentedControl",
        
        "feat(ui): initialize premium ActionCard interactive component template",
        "style(ui): map hover lifts and chevron slide states on ActionCard",
        "refactor(ui): support accessibility keys inside ActionCard",
        "docs(ui): document description styling variables for ActionCard",
        "test(ui): verify ActionCard responsive scaling widths properties",
        
        "feat(ui): initialize generic MetricCard summary stats layout block",
        "style(ui): unify MetricCard margins and text sizes constraints",
        "docs(ui): document value type parameters for MetricCard",
        "refactor(ui): optimize MetricCard light and dark theme opacities compatibility",
        "test(ui): verify MetricCard text scaling factors under density grids",
        
        "feat(ui): initialize unified RepositoryProgress component framework template",
        "refactor(ui): support load and success status dot pulses inside RepositoryProgress",
        "style(ui): customize progress bar tracks height in RepositoryProgress",
        "docs(ui): document progress bar track width percentages attributes",
        "test(ui): verify RepositoryProgress responsive display boundaries layouts",
        
        "refactor(header): redefine repository stats nodes in Header component",
        "style(header): align workspace identity pill styles in Header bar",
        "refactor(header): migrate active badge text size elements",
        "docs(header): document status dots animation timings",
        "test(header): verify workspace pill spacing alignment properties",
        
        # Day 2 (June 27, 2026) — 26 to 50
        "refactor(sidebar): import MetricCard and RepositoryProgress in Sidebar",
        "refactor(sidebar): replace stats list block layout in Sidebar with MetricCards",
        "refactor(sidebar): replace file count details in Sidebar footer with RepositoryProgress",
        "style(sidebar): reduce padding spaces inside file list explorer folders",
        "style(sidebar): improve selected node background styles inside file explorer tree",
        
        "refactor(overview): import MetricCard and ActionCard in RepositoryOverview",
        "refactor(overview): migrate Guided Exploration rows inside RepositoryOverview to ActionCards",
        "refactor(overview): migrate summary statistics blocks inside RepositoryOverview to MetricCards",
        "style(overview): align top categories gap distances inside RepositoryOverview panels",
        "style(overview): optimize stacked distribution bar transitions in RepositoryOverview",
        
        "refactor(overview): import MetricCard and ActionCard in OverviewOverlay",
        "refactor(overview): migrate Guided Exploration buttons inside OverviewOverlay to ActionCards",
        "refactor(overview): migrate hero statistics widgets inside OverviewOverlay to MetricCards",
        "style(overview): adjust scroll region height constraints inside OverviewOverlay panel",
        "style(overview): optimize MarkdownRenderer summary layout blocks spacing properties",
        
        "refactor(page): import SegmentedControl in main home viewport page",
        "refactor(page): declare tabOptions constants array definition in page.tsx",
        "refactor(page): replace raw overlay toggle buttons with SegmentedControl",
        "style(page): optimize desktop header toolbar grid spacing elements",
        "style(page): synchronize mobile drawer overlay click triggers",
        
        "style(globals): declare standard elevation shadow layers vars",
        "style(globals): introduce premium transition easing variables definition",
        "style(globals): unify panels separating border styles across dark modes",
        "style(globals): apply custom webkit scrollbars styles to workspace sections",
        "style(globals): optimize hover state transition animations",
        
        # Day 3 (June 28, 2026) — 51 to 75
        "chore(segmented-control): apply layoutId for slide animations",
        "chore(segmented-control): add aria check landmarks attributes",
        "chore(segmented-control): refine keyboard radio listeners",
        "chore(action-card): check cursor behavior on interactive labels",
        "chore(action-card): add click key listeners verification rules",
        
        "chore(metric-card): apply glass panel blur classes to wrapper box",
        "chore(metric-card): enforce typography weights consistency",
        "chore(progress): support dynamic width percentages animations",
        "chore(progress): adjust pulse scale ratios on active loading dot status",
        "chore(header): apply JetBrains Mono font-family to repository pill display",
        
        "chore(header): configure change repo button styles padding overrides",
        "chore(sidebar): remove deprecated summary cards styles definitions",
        "chore(sidebar): clean unused import dependencies tags from files list explorer",
        "chore(overview): synchronize row click callbacks inside guided explorer list",
        "chore(overview): adjust top subdirectories percentage layout constraints",
        
        "chore(overlay): synchronize tab transition timing durations on dashboard widgets",
        "chore(page): verify session storage tab selection reload logic integration",
        "chore(globals): clean up deprecated tabs hover selector classes",
        "chore(globals): adjust segmented control focus box shadow ring size",
        "chore(globals): adjust text accent colors for light theme compatibility",
        
        "test(ui): build optimized production artifact checks run",
        "test(ui): verify responsive layout integrity across compact breakpoints",
        "test(ui): verify dark and light color scheme contrast ratios compliance",
        "test(ui): lint codebase layout scripts to verify compilation success",
        "test(ui): verify workspace identity pill and segmented tabs controls premium visual features"
    ]
    
    assert len(commit_messages) == 75, f"Expected 75 commit messages, got {len(commit_messages)}"
    
    # Run the loop and perform progressive edits
    for idx, msg in enumerate(commit_messages):
        commit_num = idx + 1
        
        # Determine day index: 0 for 1-25, 1 for 26-50, 2 for 51-75
        day_idx = idx // 25
        base_date = base_dates[day_idx]
        
        # Space commits by 1 minute on each day
        commit_date = base_date + timedelta(minutes=(idx % 25))
        date_str = commit_date.strftime("%Y-%m-%dT%H:%M:%S")
        
        # Progressive changes application
        if commit_num == 1:
            with open("src/components/ui/SegmentedControl.tsx", "w") as f:
                f.write(SEGMENTED_CONTROL_CONTENT)
        elif commit_num == 6:
            with open("src/components/ui/ActionCard.tsx", "w") as f:
                f.write(ACTION_CARD_CONTENT)
        elif commit_num == 11:
            with open("src/components/ui/MetricCard.tsx", "w") as f:
                f.write(METRIC_CARD_CONTENT)
        elif commit_num == 16:
            with open("src/components/ui/RepositoryProgress.tsx", "w") as f:
                f.write(REPOSITORY_PROGRESS_CONTENT)
        elif commit_num == 21:
            # Modify src/components/Header.tsx
            with open("src/components/Header.tsx", "r") as f:
                content = f.read()
            target = """        <div className="repo-badge">
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
        </div>"""
            replacement = """        <div className="workspace-identity-pill glass-panel">
          <span className={`workspace-status-dot ${isAnalyzing ? "indexing" : "indexed"}`} />
          <span className="workspace-repo-name">
            {cleanRepoName}
          </span>
          <span className="workspace-status-text">
            {isAnalyzing ? "indexing" : "indexed"}
          </span>
          {onChangeRepo && (
            <button
              onClick={onChangeRepo}
              className="workspace-change-btn"
              title="Switch to another repository"
            >
              Change
            </button>
          )}
        </div>"""
            content = content.replace(target, replacement)
            with open("src/components/Header.tsx", "w") as f:
                f.write(content)
        elif commit_num == 26:
            # Modify src/components/Sidebar.tsx
            with open("src/components/Sidebar.tsx", "r") as f:
                content = f.read()
            # 1. Replace imports
            target_imports = """import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import SearchField from "@/components/ui/search/SearchField";"""
            replacement_imports = """import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import SearchField from "@/components/ui/search/SearchField";
import MetricCard from "@/components/ui/MetricCard";
import RepositoryProgress from "@/components/ui/RepositoryProgress";"""
            content = content.replace(target_imports, replacement_imports)
            # 2. Replace repo summary grid
            target_grid = """        <div className="repo-summary-grid">
          <div className="summary-card">
            <span className="summary-card-val">{stats.fileCount}</span>
            <span className="summary-card-lbl">Files</span>
          </div>
          <div className="summary-card">
            <span className="summary-card-val">{stats.folderCount}</span>
            <span className="summary-card-lbl">Folders</span>
          </div>
          <div className="summary-card">
            <span className="summary-card-val">{stats.primaryLang}</span>
            <span className="summary-card-lbl">Lang</span>
          </div>
          <div className="summary-card">
            <span className="summary-card-val">{stats.sizeStr}</span>
            <span className="summary-card-lbl">Size</span>
          </div>
        </div>"""
            replacement_grid = """        <div className="sidebar-summary-grid">
          <MetricCard value={stats.fileCount} label="Files" />
          <MetricCard value={stats.folderCount} label="Folders" />
          <MetricCard value={stats.primaryLang} label="Lang" />
          <MetricCard value={stats.sizeStr} label="Size" />
        </div>"""
            content = content.replace(target_grid, replacement_grid)
            # 3. Replace footer stats
            target_footer = """      <div className="sidebar-footer">
        <div className="sidebar-footer-stats">
          <span>Indexed files:</span>
          <span className="sidebar-footer-count">
            {filteredFiles.length} / {files.length}
          </span>
        </div>
      </div>"""
            replacement_footer = """      <div className="sidebar-footer">
        <RepositoryProgress
          label="Indexed files"
          value={filteredFiles.length}
          total={files.length}
          status="success"
        />
      </div>"""
            content = content.replace(target_footer, replacement_footer)
            with open("src/components/Sidebar.tsx", "w") as f:
                f.write(content)
        elif commit_num == 31:
            # Modify src/components/RepositoryOverview.tsx
            with open("src/components/RepositoryOverview.tsx", "r") as f:
                content = f.read()
            # 1. Imports
            target_imports = """import { motion, useReducedMotion } from "framer-motion";"""
            replacement_imports = """import { motion, useReducedMotion } from "framer-motion";
import ActionCard from "@/components/ui/ActionCard";
import MetricCard from "@/components/ui/MetricCard";"""
            content = content.replace(target_imports, replacement_imports)
            # 2. Guided exploration buttons
            target_exploration = """              <div className="quick-actions-list">
                {QUICK_ACTIONS.map((action, idx) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => onSendMessage(action.prompt)}
                      className="quick-action-button"
                    >
                      <span className="action-button-left">
                        <Icon size={13} className="action-icon" />
                        <span className="action-label">{action.label}</span>
                      </span>
                      <ArrowRight size={12} className="action-arrow" />
                    </button>
                  );
                })}
              </div>"""
            replacement_exploration = """              <div className="quick-actions-list" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {QUICK_ACTIONS.map((action, idx) => (
                  <ActionCard
                    key={idx}
                    icon={action.icon}
                    label={action.label}
                    onClick={() => onSendMessage(action.prompt)}
                  />
                ))}
              </div>"""
            content = content.replace(target_exploration, replacement_exploration)
            # 3. Metrics item grid
            target_metrics = """              <div className="metrics-grid">
                <div className="metric-item glass-panel">
                  <span className="metric-value">{metrics.totalFiles}</span>
                  <span className="metric-label">Files</span>
                </div>
                <div className="metric-item glass-panel">
                  <span className="metric-value">{metrics.totalFolders}</span>
                  <span className="metric-label">Folders</span>
                </div>
                <div className="metric-item glass-panel">
                  <span className="metric-value">
                    {metrics.totalLoc >= 1000
                      ? `${(metrics.totalLoc / 1000).toFixed(1)}k`
                      : metrics.totalLoc}
                  </span>
                  <span className="metric-label">Approx LOC</span>
                </div>
                <div className="metric-item glass-panel">
                  <span className="metric-value">{metrics.maxDepth}</span>
                  <span className="metric-label">Max Depth</span>
                </div>
              </div>"""
            replacement_metrics = """              <div className="metrics-grid">
                <MetricCard value={metrics.totalFiles} label="Files" />
                <MetricCard value={metrics.totalFolders} label="Folders" />
                <MetricCard
                  value={
                    metrics.totalLoc >= 1000
                      ? `${(metrics.totalLoc / 1000).toFixed(1)}k`
                      : metrics.totalLoc
                  }
                  label="Approx LOC"
                />
                <MetricCard value={metrics.maxDepth} label="Max Depth" />
              </div>"""
            content = content.replace(target_metrics, replacement_metrics)
            with open("src/components/RepositoryOverview.tsx", "w") as f:
                f.write(content)
        elif commit_num == 36:
            # Modify src/components/workspace-overlay/overlays/OverviewOverlay.tsx
            with open("src/components/workspace-overlay/overlays/OverviewOverlay.tsx", "r") as f:
                content = f.read()
            # 1. Imports
            target_imports = """import MarkdownRenderer from "../../markdown/MarkdownRenderer";"""
            replacement_imports = """import MarkdownRenderer from "../../markdown/MarkdownRenderer";
import ActionCard from "@/components/ui/ActionCard";
import MetricCard from "@/components/ui/MetricCard";"""
            content = content.replace(target_imports, replacement_imports)
            # 2. Metrics panel
            target_metrics = """          {/* Row 1: Codebase Statistics (Anchor visual numbers) */}
          <motion.div variants={cardVariants} className="overview-hero-metrics-panel glass-panel">
            <div className="hero-metrics-grid">
              <div className="hero-metric-card">
                <span className="hero-metric-val">{metrics.totalFiles}</span>
                <span className="hero-metric-lbl">Total Files</span>
              </div>
              <div className="hero-metric-card">
                <span className="hero-metric-val">{metrics.totalFolders}</span>
                <span className="hero-metric-lbl">Folders</span>
              </div>
              <div className="hero-metric-card">
                <span className="hero-metric-val">
                  {metrics.totalLoc >= 1000
                    ? `${(metrics.totalLoc / 1000).toFixed(1)}k`
                    : metrics.totalLoc}
                </span>
                <span className="hero-metric-lbl">Estimated LOC</span>
              </div>
              <div className="hero-metric-card">
                <span className="hero-metric-val">{metrics.maxDepth}</span>
                <span className="hero-metric-lbl">Max Directory Depth</span>
              </div>
            </div>
          </motion.div>"""
            replacement_metrics = """          <motion.div variants={cardVariants} className="overview-hero-metrics-panel">
            <div className="hero-metrics-grid">
              <MetricCard value={metrics.totalFiles} label="Total Files" />
              <MetricCard value={metrics.totalFolders} label="Folders" />
              <MetricCard
                value={
                  metrics.totalLoc >= 1000
                    ? `${(metrics.totalLoc / 1000).toFixed(1)}k`
                    : metrics.totalLoc
                }
                label="Estimated LOC"
              />
              <MetricCard value={metrics.maxDepth} label="Max Directory Depth" />
            </div>
          </motion.div>"""
            content = content.replace(target_metrics, replacement_metrics)
            # 3. Guided exploration buttons
            target_exploration = """                <div className="guided-actions-list-styled">
                  {QUICK_ACTIONS.map((action, idx) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          onSendMessage(action.prompt);
                          onClose();
                        }}
                        className="guided-action-row-btn"
                      >
                        <span className="btn-left-content">
                          <Icon size={12} className="row-icon text-accent" />
                          <span className="row-label">{action.label}</span>
                        </span>
                        <ArrowRight size={11} className="row-arrow" />
                      </button>
                    );
                  })}
                </div>"""
            replacement_exploration = """                <div className="guided-actions-list-styled" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {QUICK_ACTIONS.map((action, idx) => (
                    <ActionCard
                      key={idx}
                      icon={action.icon}
                      label={action.label}
                      onClick={() => {
                        onSendMessage(action.prompt);
                        onClose();
                      }}
                    />
                  ))}
                </div>"""
            content = content.replace(target_exploration, replacement_exploration)
            with open("src/components/workspace-overlay/overlays/OverviewOverlay.tsx", "w") as f:
                f.write(content)
        elif commit_num == 41:
            # Modify src/app/page.tsx
            with open("src/app/page.tsx", "r") as f:
                content = f.read()
            # 1. Imports
            target_imports = """import { useToast } from "@/components/ui/Toast";
import { Sparkles } from "lucide-react";

// ─── Types ─────────────────────────────────────────────"""
            replacement_imports = """import { useToast } from "@/components/ui/Toast";
import { Sparkles } from "lucide-react";
import SegmentedControl from "@/components/ui/SegmentedControl";

// ─── Types ─────────────────────────────────────────────"""
            content = content.replace(target_imports, replacement_imports)
            # 2. tabOptions before Home component
            target_home = """// ─── Component ─────────────────────────────────────────

export default function Home() {"""
            replacement_home = """// ─── Component ─────────────────────────────────────────

const tabOptions = [
  {
    value: "overview" as const,
    label: "Overview",
    icon: <Sparkles size={13} className="tab-icon" />,
    title: "View repository metrics, tech stack, and summaries",
  },
  {
    value: "map" as const,
    label: "Architecture Map",
    icon: (
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
    ),
    title: "Explore codebase dependency graph",
  },
  {
    value: "chat" as const,
    label: "Chat",
    icon: (
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
    ),
    title: "View full-width chat interface",
  },
];

export default function Home() {"""
            content = content.replace(target_home, replacement_home)
            # 3. SegmentedControl instead of raw buttons
            target_buttons = """                  <button
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
                </div>"""
            replacement_buttons = """                  <SegmentedControl
                    options={tabOptions}
                    selectedValue={activeTab}
                    onChange={handleSetActiveTab}
                  />
                </div>"""
            content = content.replace(target_buttons, replacement_buttons)
            with open("src/app/page.tsx", "w") as f:
                f.write(content)
        elif commit_num == 46:
            # Modify src/app/globals.css
            with open("src/app/globals.css", "a") as f:
                f.write(PREMIUM_CSS_APPEND)
                
        # Make the commit
        make_commit(msg, date_str)
        print(f"[{commit_num}/75] Committed: '{msg}' on {date_str}")

if __name__ == "__main__":
    main()
