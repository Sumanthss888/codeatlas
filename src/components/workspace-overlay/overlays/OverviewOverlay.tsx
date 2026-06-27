"use client";

import React, { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { RepoFile } from "@/app/page";
import {
  Sparkles,
  Layers,
  BarChart2,
  GitBranch,
  Activity,
  ArrowRight,
  Star,
  GitFork,
  BookOpen,
  Calendar,
  Eye,
  FileCode,
  FolderOpen
} from "lucide-react";
import WorkspaceOverlay from "../WorkspaceOverlay";
import WorkspaceOverlayHeader from "../WorkspaceOverlayHeader";
import WorkspaceOverlayBody from "../WorkspaceOverlayBody";
import MarkdownRenderer from "../../markdown/MarkdownRenderer";
import ActionCard from "@/components/ui/ActionCard";
import MetricCard from "@/components/ui/MetricCard";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  files: RepoFile[];
  summary: string | null;
  isSummaryLoading: boolean;
  githubMetadata: {
    stars: number;
    forks: number;
    language: string | null;
    license: string | null;
    lastCommitDate: string | null;
    visibility: string;
    description: string;
  } | null;
  onSendMessage: (content: string) => void;
};

export default function OverviewOverlay({
  isOpen,
  onClose,
  files,
  summary,
  isSummaryLoading,
  githubMetadata,
  onSendMessage,
}: Props) {
  const shouldReduceMotion = useReducedMotion();

  // 1. Calculate Repository Metrics
  const metrics = useMemo(() => {
    if (!files || files.length === 0) {
      return { totalFiles: 0, totalFolders: 0, totalLoc: 0, maxDepth: 0 };
    }

    const totalFiles = files.length;
    const foldersSet = new Set<string>();
    files.forEach((f) => {
      const parts = f.filePath.split("/");
      for (let i = 1; i < parts.length; i++) {
        foldersSet.add(parts.slice(0, i).join("/"));
      }
    });
    const totalFolders = foldersSet.size;

    let totalLoc = 0;
    files.forEach((f) => {
      if (f.content) {
        totalLoc += f.content.split("\n").length;
      }
    });

    let maxDepth = 0;
    files.forEach((f) => {
      const depth = f.filePath.split("/").length;
      if (depth > maxDepth) maxDepth = depth;
    });

    return { totalFiles, totalFolders, totalLoc, maxDepth };
  }, [files]);

  // 2. Language Breakdown (horizontal stacked bar chart data)
  const languages = useMemo(() => {
    if (!files || files.length === 0) return [];

    const extCounts: Record<string, number> = {};
    files.forEach((f) => {
      const ext = f.filePath.split(".").pop()?.toLowerCase() || "";
      if (ext) {
        extCounts[ext] = (extCounts[ext] || 0) + 1;
      }
    });

    const langMap: Record<string, string> = {
      ts: "TypeScript",
      tsx: "TypeScript",
      js: "JavaScript",
      jsx: "JavaScript",
      py: "Python",
      go: "Go",
      java: "Java",
      cpp: "C++",
      html: "HTML",
      css: "CSS",
      json: "JSON",
      md: "Markdown",
      yml: "YAML",
      yaml: "YAML",
      sh: "Shell Script",
    };

    const aggregated: Record<string, { count: number; name: string }> = {};
    Object.entries(extCounts).forEach(([ext, count]) => {
      const name = langMap[ext] || ext.toUpperCase() || "Other";
      if (!aggregated[name]) {
        aggregated[name] = { count: 0, name };
      }
      aggregated[name].count += count;
    });

    const total = files.length;
    const sorted = Object.values(aggregated)
      .map((item) => ({
        name: item.name,
        count: item.count,
        percentage: Math.round((item.count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    const topLangs = sorted.filter((l) => l.percentage > 0).slice(0, 4);
    const topCount = topLangs.reduce((sum, l) => sum + l.count, 0);

    if (topCount < total && sorted.length > 4) {
      const otherCount = total - topCount;
      const otherPercentage = Math.round((otherCount / total) * 100);
      if (otherPercentage > 0) {
        topLangs.push({
          name: "Other",
          count: otherCount,
          percentage: otherPercentage,
        });
      }
    }

    return topLangs;
  }, [files]);

  // Color palette for languages
  const getLanguageColor = (name: string, index: number) => {
    const colors: Record<string, string> = {
      TypeScript: "#3178c6",
      JavaScript: "#f1e05a",
      CSS: "#563d7c",
      HTML: "#e34c26",
      JSON: "#00b4d8",
      Python: "#3572A5",
      Go: "#00ADD8",
      Java: "#b07219",
      Markdown: "#083fa1",
      YAML: "#cb171e",
    };

    if (colors[name]) return colors[name];
    const defaultColors = ["#6366F1", "#7209B7", "#f72585", "#4CC9F0", "#4895EF"];
    return defaultColors[index % defaultColors.length];
  };

  // 3. Tech Stack Detection
  const techStack = useMemo(() => {
    if (!files || files.length === 0) return [];

    const detected = new Set<string>();
    const filePaths = files.map((f) => f.filePath);
    const pkgJson = files.find((f) => f.filePath === "package.json");
    const pkgContent = pkgJson?.content || "";

    if (pkgJson) {
      detected.add("Node.js");
      if (pkgContent.includes('"next"')) detected.add("Next.js");
      if (pkgContent.includes('"react"')) detected.add("React");
      if (pkgContent.includes('"tailwindcss"')) detected.add("Tailwind CSS");
      if (pkgContent.includes('"prisma"')) detected.add("Prisma");
      if (pkgContent.includes('"express"')) detected.add("Express");
      if (pkgContent.includes('"typescript"')) detected.add("TypeScript");
      if (pkgContent.includes('"eslint"')) detected.add("ESLint");
    }

    filePaths.forEach((path) => {
      if (path.includes("next.config")) detected.add("Next.js");
      if (path.includes("tailwind.config")) detected.add("Tailwind CSS");
      if (path.includes("tsconfig.json")) detected.add("TypeScript");
      if (path.includes("schema.prisma") || path.includes("prisma/")) detected.add("Prisma");
      if (path.endsWith(".tsx") || path.endsWith(".jsx")) detected.add("React");
      if (path.endsWith(".py")) detected.add("Python");
      if (path.includes("manage.py")) detected.add("Django");
      if (path.endsWith("go.mod")) {
        detected.add("Go");
      }
      if (path.includes("Dockerfile") || path.includes("docker-compose")) detected.add("Docker");
      if (path.includes("eslint.config") || path.includes(".eslintrc")) detected.add("ESLint");
    });

    return Array.from(detected);
  }, [files]);

  // 4. Architecture classification
  const archSnapshot = useMemo(() => {
    if (!files || files.length === 0) {
      return { type: "Unknown", description: "Empty codebase", topDirs: [] };
    }

    const paths = files.map((f) => f.filePath);
    const topLevelDirCounts: Record<string, number> = {};
    files.forEach((f) => {
      const parts = f.filePath.split("/");
      if (parts.length > 1) {
        const topDir = parts[0] + "/";
        topLevelDirCounts[topDir] = (topLevelDirCounts[topDir] || 0) + 1;
      }
    });

    const topDirs = Object.entries(topLevelDirCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / files.length) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    let type = "Standard Repository";
    let description = "A general software development repository.";

    const hasPackages = paths.some((p) => p.startsWith("packages/"));
    const hasApps = paths.some((p) => p.startsWith("apps/"));
    const hasNext = paths.some((p) => p.includes("next.config"));
    const hasReact = paths.some((p) => p.endsWith(".tsx") || p.endsWith(".jsx"));
    const hasPython = paths.some((p) => p.endsWith(".py"));
    const hasGo = paths.some((p) => p.endsWith(".go"));
    const hasSrc = paths.some((p) => p.startsWith("src/"));
    const hasApi = paths.some((p) => p.includes("api/"));

    if ((hasPackages || hasApps) && paths.some((p) => p.includes("package.json"))) {
      type = "Monorepo Workspace";
      description = "A multi-package repository layout containing isolated micro-services or modular packages.";
    } else if (hasNext && hasApi && hasSrc) {
      type = "Full-Stack Application";
      description = "A comprehensive Next.js web application integrating page views and local API handler endpoints.";
    } else if (hasReact && !hasApi) {
      type = "Frontend Application";
      description = "A client-side UI application centered on React interfaces, state managers, and styles.";
    } else if (hasPython && (paths.some((p) => p.includes("api")) || paths.some((p) => p.includes("server")))) {
      type = "Backend Service";
      description = "A Python-based server pipeline or API provider built on FastAPI, Django, or Flask.";
    } else if (hasGo && !hasReact) {
      type = "System / CLI Tool";
      description = "A systems service, server stack, or console client compiled in Go.";
    }

    return { type, description, topDirs };
  }, [files]);

  const QUICK_ACTIONS = [
    {
      label: "Ask About Architecture",
      prompt: "Explain the overall architecture of this repository. What pattern does it follow and how do key components communicate?",
      icon: Layers,
    },
    {
      label: "Explain Folder Structure",
      prompt: "Walk me through the folder structure of this repository. What is the purpose of each top-level directory and how are source files organized?",
      icon: FolderOpen,
    },
    {
      label: "Trace Data Flow",
      prompt: "Trace the data flow in this codebase. How does a request or action process from the entry point to data persistence?",
      icon: Activity,
    },
    {
      label: "Review Tech Stack",
      prompt: "Review the technologies used in this codebase. Are there configurations or dependency alignments that look noteworthy?",
      icon: FileCode,
    },
  ];

  const cardVariants = shouldReduceMotion
    ? { hidden: {}, visible: {} }
    : {
        hidden: { opacity: 0, y: 12 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.35, ease: "easeOut" }
        }
      };

  return (
    <WorkspaceOverlay isOpen={isOpen} onClose={onClose} title="Workspace Overview">
      {/* Reusable Header */}
      <WorkspaceOverlayHeader
        title="Workspace Overview"
        subtitle="Contextual repository diagnostics and metadata briefing"
        icon={<Sparkles size={16} className="text-accent" />}
        onClose={onClose}
      />

      {/* Scrollable Body */}
      <WorkspaceOverlayBody>
        <div className="overview-dashboard-layout">
          
          <motion.div variants={cardVariants} className="overview-hero-metrics-panel">
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
          </motion.div>

          {/* Row 2: AI Summary & Exploration Actions */}
          <div className="overview-dashboard-grid col-2">
            
            {/* AI Summary Widget */}
            <motion.div variants={cardVariants} className="dashboard-widget glass-panel">
              <div className="widget-header">
                <Sparkles size={14} className="widget-header-icon text-accent" />
                <h3>Repository Summary</h3>
              </div>
              <div className="widget-content">
                {isSummaryLoading ? (
                  <div className="shimmer-container" aria-label="Loading summary">
                    <div className="shimmer-line w-full" />
                    <div className="shimmer-line w-5/6" />
                    <div className="shimmer-line w-3/4" />
                  </div>
                ) : summary ? (
                  <MarkdownRenderer content={summary} />
                ) : (
                  <p className="summary-text-styled text-muted">
                    No summary brief available. Use the chat pane beneath to query files.
                  </p>
                )}
              </div>
            </motion.div>

            {/* Guided Actions Widget */}
            <motion.div variants={cardVariants} className="dashboard-widget glass-panel">
              <div className="widget-header">
                <Activity size={14} className="widget-header-icon text-accent" />
                <h3>Guided Exploration</h3>
              </div>
              <div className="widget-content">
                <div className="guided-actions-list-styled" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
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
                </div>
              </div>
            </motion.div>
          </div>

          {/* Row 3: Technologies & Languages */}
          <div className="overview-dashboard-grid col-2">
            
            {/* Tech Stack Widget */}
            <motion.div variants={cardVariants} className="dashboard-widget glass-panel">
              <div className="widget-header">
                <Layers size={14} className="widget-header-icon text-accent" />
                <h3>Detected Technologies</h3>
              </div>
              <div className="widget-content">
                {techStack.length > 0 ? (
                  <div className="tech-badge-tags-list">
                    {techStack.map((tech) => (
                      <span key={tech} className="tech-tag-chip">
                        <span className="chip-indicator" />
                        {tech}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted py-4 text-center">No framework manifests identified.</p>
                )}
              </div>
            </motion.div>

            {/* Language Breakdown Widget */}
            <motion.div variants={cardVariants} className="dashboard-widget glass-panel">
              <div className="widget-header">
                <BarChart2 size={14} className="widget-header-icon text-accent" />
                <h3>Language Distribution</h3>
              </div>
              <div className="widget-content">
                {languages.length > 0 ? (
                  <div className="language-breakdown-panel">
                    <div className="dashboard-stacked-bar">
                      {languages.map((lang, idx) => (
                        <div
                          key={lang.name}
                          className="dashboard-bar-segment"
                          style={{
                            width: `${lang.percentage}%`,
                            backgroundColor: getLanguageColor(lang.name, idx),
                          }}
                          title={`${lang.name}: ${lang.percentage}%`}
                        />
                      ))}
                    </div>

                    <div className="dashboard-language-legend">
                      {languages.map((lang, idx) => (
                        <div key={lang.name} className="legend-row">
                          <div className="legend-row-left">
                            <span
                              className="legend-color-indicator"
                              style={{ backgroundColor: getLanguageColor(lang.name, idx) }}
                            />
                            <span className="legend-lang-lbl">{lang.name}</span>
                          </div>
                          <div className="legend-row-right">
                            <span className="legend-lang-percent-lbl">{lang.percentage}%</span>
                            <span className="legend-lang-count-lbl">({lang.count} files)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted py-4 text-center">No extensions found to parse.</p>
                )}
              </div>
            </motion.div>
          </div>

          {/* Row 4: GitHub Insights & Architecture Classifications */}
          <div className="overview-dashboard-grid col-2">
            
            {/* GitHub Insights Card */}
            <motion.div variants={cardVariants} className="dashboard-widget glass-panel">
              <div className="widget-header">
                <GitBranch size={14} className="widget-header-icon text-accent" />
                <h3>GitHub Insights</h3>
              </div>
              <div className="widget-content">
                {githubMetadata ? (
                  <div className="insights-metadata-list">
                    {githubMetadata.description && (
                      <p className="github-brief-description">
                        "{githubMetadata.description}"
                      </p>
                    )}
                    <div className="insight-item-row">
                      <span className="insight-lbl">
                        <Star size={11} className="insight-icon" /> Stars
                      </span>
                      <span className="insight-val">{githubMetadata.stars.toLocaleString()}</span>
                    </div>
                    <div className="insight-item-row">
                      <span className="insight-lbl">
                        <GitFork size={11} className="insight-icon" /> Forks
                      </span>
                      <span className="insight-val">{githubMetadata.forks.toLocaleString()}</span>
                    </div>
                    {githubMetadata.license && (
                      <div className="insight-item-row">
                        <span className="insight-lbl">
                          <BookOpen size={11} className="insight-icon" /> License
                        </span>
                        <span className="insight-val text-truncate" title={githubMetadata.license}>
                          {githubMetadata.license}
                        </span>
                      </div>
                    )}
                    {githubMetadata.lastCommitDate && (
                      <div className="insight-item-row">
                        <span className="insight-lbl">
                          <Calendar size={11} className="insight-icon" /> Last Active
                        </span>
                        <span className="insight-val">
                          {new Date(githubMetadata.lastCommitDate).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </span>
                      </div>
                    )}
                    <div className="insight-item-row">
                      <span className="insight-lbl">
                        <Eye size={11} className="insight-icon" /> Visibility
                      </span>
                      <span className="insight-val visibility-pill">{githubMetadata.visibility}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted py-4 text-center">No metadata insights loaded.</p>
                )}
              </div>
            </motion.div>

            {/* Architecture Classification Widget */}
            <motion.div variants={cardVariants} className="dashboard-widget glass-panel">
              <div className="widget-header">
                <Layers size={14} className="widget-header-icon text-accent" />
                <h3>Architecture Snapshot</h3>
              </div>
              <div className="widget-content">
                <div className="arch-brief-summary">
                  <div className="arch-brief-badge">{archSnapshot.type}</div>
                  <p className="arch-brief-desc">{archSnapshot.description}</p>
                </div>
                
                <div className="top-dirs-list-brief">
                  <span className="brief-section-subtitle">Top Subdirectories:</span>
                  <div className="top-dirs-brief-rows">
                    {archSnapshot.topDirs.map((dir) => (
                      <div key={dir.name} className="top-dir-brief-row">
                        <span className="brief-dir-name">{dir.name}</span>
                        <div className="brief-dir-bar-wrapper">
                          <div className="brief-dir-bar-fill" style={{ width: `${dir.percentage}%` }} />
                        </div>
                        <span className="brief-dir-pct">{dir.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </WorkspaceOverlayBody>
    </WorkspaceOverlay>
  );
}
