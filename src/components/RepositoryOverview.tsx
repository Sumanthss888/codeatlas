"use client";

import { useMemo } from "react";
import type { RepoFile } from "@/app/page";
import {
  Sparkles,
  Layers,
  BarChart2,
  GitBranch,
  Activity,
  ArrowRight,
  X,
  Star,
  GitFork,
  BookOpen,
  Calendar,
  Eye,
  FileCode,
  FolderOpen
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

type Props = {
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
  onClose: () => void;
};

export default function RepositoryOverview({
  files,
  summary,
  isSummaryLoading,
  githubMetadata,
  onSendMessage,
  onClose,
}: Props) {
  const shouldReduceMotion = useReducedMotion();

  // 1. Calculate Repository Metrics
  const metrics = useMemo(() => {
    if (!files || files.length === 0) {
      return { totalFiles: 0, totalFolders: 0, totalLoc: 0, maxDepth: 0 };
    }

    const totalFiles = files.length;

    // Collect folders
    const foldersSet = new Set<string>();
    files.forEach((f) => {
      const parts = f.filePath.split("/");
      for (let i = 1; i < parts.length; i++) {
        foldersSet.add(parts.slice(0, i).join("/"));
      }
    });
    const totalFolders = foldersSet.size;

    // Estimate LOC
    let totalLoc = 0;
    files.forEach((f) => {
      if (f.content) {
        // Count line breaks
        totalLoc += f.content.split("\n").length;
      }
    });

    // Estimate total depth
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

    // Filter out 0% languages and limit to top 4, grouping others into "Other"
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

  // Color palette for languages in stacked bar chart
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

    // Look for package manifests and content indications
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

    // Heuristics based on file paths
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
        detected.add("Go Mod");
      }
      if (path.includes("Dockerfile") || path.includes("docker-compose")) detected.add("Docker");
      if (path.includes("eslint.config") || path.includes(".eslintrc")) detected.add("ESLint");
    });

    // Check for FastAPI, Django, Flask in Python requirements
    const reqTxt = files.find((f) => f.filePath === "requirements.txt" || f.filePath === "Pipfile");
    if (reqTxt && reqTxt.content) {
      if (reqTxt.content.toLowerCase().includes("fastapi")) detected.add("FastAPI");
      if (reqTxt.content.toLowerCase().includes("django")) detected.add("Django");
      if (reqTxt.content.toLowerCase().includes("flask")) detected.add("Flask");
    }

    return Array.from(detected);
  }, [files]);

  // 4. Architecture Heuristic Analysis & Top Directories
  const archSnapshot = useMemo(() => {
    if (!files || files.length === 0) {
      return { type: "Unknown", description: "Empty codebase", topDirs: [] };
    }

    const paths = files.map((f) => f.filePath);

    // Top directories analysis
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
      .slice(0, 5);

    // Heuristic Classification
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
    } else if (paths.some((p) => p.includes("docs/")) && paths.filter((p) => p.endsWith(".md")).length > files.length * 0.4) {
      type = "Documentation Workspace";
      description = "An informational repository primarily dedicated to guides, markdown assets, and text details.";
    } else if (paths.some((p) => p.includes("tsup")) || (paths.some((p) => p.includes("tsconfig.json")) && !hasReact && hasSrc)) {
      type = "Software Library / Package";
      description = "A modular utility or NPM library ready for publishing, compilation, and dependency usage.";
    }

    return { type, description, topDirs };
  }, [files]);

  // Quick action templates
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
      label: "Find Performance Issues",
      prompt: "Identify potential performance bottlenecks, inefficient algorithms, or structural flaws in this codebase.",
      icon: Sparkles,
    },
    {
      label: "Review Tech Stack",
      prompt: "Review the technologies used in this codebase. Are there configurations or dependency alignments that look noteworthy?",
      icon: FileCode,
    },
  ];

  // Motion transitions
  const cardAnimation = shouldReduceMotion
    ? { opacity: 1, y: 0 }
    : { opacity: 1, y: 0 };
  const cardInitial = shouldReduceMotion ? {} : { opacity: 0, y: 12 };

  return (
    <div className="repo-overview-container glass-panel animate-fade-in">
      <div className="overview-header">
        <div className="overview-title-section">
          <div className="overview-sparkle-pill">
            <Sparkles size={12} className="sparkle-icon" />
            <span>Repository Briefing</span>
          </div>
          <h2 className="overview-heading">Workspace Overview</h2>
        </div>
        <button
          onClick={onClose}
          className="overview-close-btn"
          aria-label="Close overview pane"
          title="Close repository overview (Go to Chat only)"
        >
          <X size={15} />
        </button>
      </div>

      <div className="overview-scroll-area">
        {/* Row 1: AI Summary & Quick Actions */}
        <div className="overview-grid col-2">
          {/* AI Summary Card */}
          <motion.div
            initial={cardInitial}
            animate={cardAnimation}
            transition={{ duration: 0.3 }}
            className="overview-card glass-panel"
          >
            <div className="card-header">
              <Sparkles size={15} className="card-header-icon text-accent" />
              <h3>What does this repository do?</h3>
            </div>
            <div className="card-content">
              {isSummaryLoading ? (
                <div className="shimmer-container" aria-label="Loading summary">
                  <div className="shimmer-line w-full" />
                  <div className="shimmer-line w-3/4" />
                  <div className="shimmer-line w-5/6" />
                </div>
              ) : summary ? (
                <p className="summary-text">{summary}</p>
              ) : (
                <p className="summary-text text-muted">
                  No summary available. Ask a question on the right to start analyzing details.
                </p>
              )}
            </div>
          </motion.div>

          {/* Quick Actions Card */}
          <motion.div
            initial={cardInitial}
            animate={cardAnimation}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="overview-card glass-panel"
          >
            <div className="card-header">
              <Activity size={15} className="card-header-icon text-accent" />
              <h3>Guided Exploration</h3>
            </div>
            <div className="card-content">
              <p className="section-subtitle">Click a quick action to launch an AI workspace query:</p>
              <div className="quick-actions-list">
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
              </div>
            </div>
          </motion.div>
        </div>

        {/* Row 2: Tech Stack & Language Breakdown */}
        <div className="overview-grid col-2">
          {/* Tech Stack Card */}
          <motion.div
            initial={cardInitial}
            animate={cardAnimation}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="overview-card glass-panel"
          >
            <div className="card-header">
              <Layers size={15} className="card-header-icon text-accent" />
              <h3>Detected Technologies</h3>
            </div>
            <div className="card-content">
              {techStack.length > 0 ? (
                <div className="tech-badges-grid">
                  {techStack.map((tech) => (
                    <span key={tech} className="tech-badge">
                      <span className="tech-badge-dot" />
                      {tech}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-center py-4">No specific frameworks detected.</p>
              )}
            </div>
          </motion.div>

          {/* Language Breakdown Card */}
          <motion.div
            initial={cardInitial}
            animate={cardAnimation}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="overview-card glass-panel"
          >
            <div className="card-header">
              <BarChart2 size={15} className="card-header-icon text-accent" />
              <h3>Language Distribution</h3>
            </div>
            <div className="card-content">
              {languages.length > 0 ? (
                <div className="language-breakdown-wrapper">
                  {/* Stacked Horizontal Bar */}
                  <div className="stacked-bar">
                    {languages.map((lang, idx) => (
                      <div
                        key={lang.name}
                        className="bar-segment"
                        style={{
                          width: `${lang.percentage}%`,
                          backgroundColor: getLanguageColor(lang.name, idx),
                        }}
                        title={`${lang.name}: ${lang.percentage}% (${lang.count} files)`}
                      />
                    ))}
                  </div>

                  {/* Legend list */}
                  <div className="language-legend">
                    {languages.map((lang, idx) => (
                      <div key={lang.name} className="legend-item">
                        <span
                          className="legend-color-dot"
                          style={{ backgroundColor: getLanguageColor(lang.name, idx) }}
                        />
                        <span className="legend-lang-name">{lang.name}</span>
                        <span className="legend-lang-percent">{lang.percentage}%</span>
                        <span className="legend-lang-count">({lang.count} files)</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-muted text-center py-4">No file extensions found to parse.</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Row 3: Repository Metrics & GitHub Metadata (Conditional) */}
        <div className={`overview-grid ${githubMetadata ? "col-2" : "col-1"}`}>
          {/* Repository Metrics Card */}
          <motion.div
            initial={cardInitial}
            animate={cardAnimation}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="overview-card glass-panel"
          >
            <div className="card-header">
              <Activity size={15} className="card-header-icon text-accent" />
              <h3>Codebase Metrics</h3>
            </div>
            <div className="card-content">
              <div className="metrics-grid">
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
              </div>
            </div>
          </motion.div>

          {/* GitHub Metadata Card */}
          {githubMetadata && (
            <motion.div
              initial={cardInitial}
              animate={cardAnimation}
              transition={{ duration: 0.3, delay: 0.25 }}
              className="overview-card glass-panel"
            >
              <div className="card-header">
                <GitBranch size={15} className="card-header-icon text-accent" />
                <h3>GitHub Insights</h3>
              </div>
              <div className="card-content">
                {githubMetadata.description && (
                  <p className="github-description" title={githubMetadata.description}>
                    "{githubMetadata.description}"
                  </p>
                )}
                <div className="github-stats-grid">
                  <div className="gh-stat-row">
                    <span className="gh-stat-lbl">
                      <Star size={12} className="gh-stat-icon" />
                      Stars
                    </span>
                    <span className="gh-stat-val">{githubMetadata.stars.toLocaleString()}</span>
                  </div>
                  <div className="gh-stat-row">
                    <span className="gh-stat-lbl">
                      <GitFork size={12} className="gh-stat-icon" />
                      Forks
                    </span>
                    <span className="gh-stat-val">{githubMetadata.forks.toLocaleString()}</span>
                  </div>
                  {githubMetadata.license && (
                    <div className="gh-stat-row">
                      <span className="gh-stat-lbl">
                        <BookOpen size={12} className="gh-stat-icon" />
                        License
                      </span>
                      <span className="gh-stat-val text-ellipsis" title={githubMetadata.license}>
                        {githubMetadata.license}
                      </span>
                    </div>
                  )}
                  {githubMetadata.lastCommitDate && (
                    <div className="gh-stat-row">
                      <span className="gh-stat-lbl">
                        <Calendar size={12} className="gh-stat-icon" />
                        Last Push
                      </span>
                      <span className="gh-stat-val">
                        {new Date(githubMetadata.lastCommitDate).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                  <div className="gh-stat-row">
                    <span className="gh-stat-lbl">
                      <Eye size={12} className="gh-stat-icon" />
                      Visibility
                    </span>
                    <span className="gh-stat-val badge-visibility">{githubMetadata.visibility}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Row 4: Architecture Snapshot */}
        <motion.div
          initial={cardInitial}
          animate={cardAnimation}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="overview-card full-width glass-panel"
        >
          <div className="card-header">
            <Layers size={15} className="card-header-icon text-accent" />
            <h3>Architecture & Layout Snapshot</h3>
          </div>
          <div className="card-content flex-row">
            <div className="arch-left">
              <div className="arch-type-pill">{archSnapshot.type}</div>
              <p className="arch-description">{archSnapshot.description}</p>
            </div>
            <div className="arch-divider" />
            <div className="arch-right">
              <span className="section-subtitle">Top directories by file volume:</span>
              <div className="top-dirs-list">
                {archSnapshot.topDirs.map((dir, idx) => (
                  <div key={dir.name} className="top-dir-item">
                    <div className="dir-item-left">
                      <span className="dir-idx">{idx + 1}</span>
                      <span className="dir-name">{dir.name}</span>
                    </div>
                    <div className="dir-item-right">
                      <span className="dir-count">{dir.count} files</span>
                      <div className="dir-track-bar">
                        <div className="dir-fill" style={{ width: `${dir.percentage}%` }} />
                      </div>
                      <span className="dir-percent">{dir.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
