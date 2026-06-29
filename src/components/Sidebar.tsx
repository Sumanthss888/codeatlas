"use client";

import { useMemo, useState } from "react";
import type { RepoFile } from "@/app/page";
import {
  Folder,
  FolderOpen,
  FileText,
  FileCode,
  FileJson,
  File,
  Terminal,
  Settings as SettingsIcon,
  Search,
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react";
import { LogoIcon } from "./Logo";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import SearchField from "@/components/ui/search/SearchField";

type TreeNode =
  | { kind: "folder"; name: string; path: string; children: TreeNode[] }
  | { kind: "file"; name: string; path: string; file: RepoFile };

function buildTree(files: RepoFile[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const file of files) {
    const parts = file.filePath.split("/");
    let current = root;

    parts.forEach((part, i) => {
      const path = parts.slice(0, i + 1).join("/");
      const isFile = i === parts.length - 1;

      if (isFile) {
        current.push({ kind: "file", name: part, path, file });
      } else {
        let folder = current.find(
          (n) => n.kind === "folder" && n.name === part
        ) as TreeNode | undefined;

        if (!folder || folder.kind !== "folder") {
          folder = {
            kind: "folder",
            name: part,
            path,
            children: [],
          };
          current.push(folder);
        }

        current = (folder as any).children;
      }
    });
  }

  return root;
}

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "ts":
      return <FileCode className="file-icon ext-ts" />;
    case "tsx":
      return <FileCode className="file-icon ext-tsx" />;
    case "js":
      return <FileCode className="file-icon ext-js" />;
    case "jsx":
      return <FileCode className="file-icon ext-jsx" />;
    case "py":
      return <FileCode className="file-icon ext-py" />;
    case "json":
      return <FileJson className="file-icon ext-json" />;
    case "md":
      return <FileText className="file-icon ext-md" />;
    case "css":
    case "scss":
    case "sass":
      return <FileCode className="file-icon ext-css" />;
    case "html":
      return <FileCode className="file-icon ext-html" />;
    case "yml":
    case "yaml":
      return <Terminal className="file-icon ext-yml" />;
    default:
      if (
        name === ".gitignore" ||
        name.startsWith("tsconfig") ||
        name.startsWith("package")
      ) {
        return <SettingsIcon className="file-icon ext-yml" />;
      }
      return <File className="file-icon ext-generic" />;
  }
}

type Props = {
  activeFile: string | null;
  onFileSelect: (filePath: string) => void;
  files: RepoFile[];
  isOpen?: boolean;
  onClose?: () => void;
};

export default function Sidebar({
  activeFile,
  onFileSelect,
  files,
  isOpen = false,
  onClose,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const shouldReduceMotion = useReducedMotion();

  const toggle = (path: string) =>
    setOpen((prev) => ({ ...prev, [path]: !prev[path] }));

  // Repository summary metrics computed client-side
  const stats = useMemo(() => {
    if (files.length === 0) {
      return { fileCount: 0, folderCount: 0, sizeStr: "0 KB", primaryLang: "None" };
    }

    const fileCount = files.length;

    // Folder counts
    const dirs = new Set<string>();
    files.forEach((f) => {
      const parts = f.filePath.split("/");
      for (let i = 1; i < parts.length; i++) {
        dirs.add(parts.slice(0, i).join("/"));
      }
    });
    const folderCount = dirs.size;

    // Estimated Size
    let totalBytes = 0;
    files.forEach((f) => {
      totalBytes += f.content ? f.content.length : 0;
    });
    const sizeKb = totalBytes / 1024;
    const sizeStr =
      sizeKb < 1024
        ? `${sizeKb.toFixed(1)} KB`
        : `${(sizeKb / 1024).toFixed(1)} MB`;

    // Primary language
    const extCounts: Record<string, number> = {};
    files.forEach((f) => {
      const ext = f.filePath.split(".").pop() || "";
      if (ext) {
        extCounts[ext] = (extCounts[ext] || 0) + 1;
      }
    });

    const langMap: Record<string, string> = {
      ts: "TypeScript",
      tsx: "TS (React)",
      js: "JavaScript",
      jsx: "JS (React)",
      py: "Python",
      json: "JSON",
      md: "Markdown",
      css: "CSS",
      html: "HTML",
      go: "Go",
      cpp: "C++",
      java: "Java",
      yml: "YAML",
      yaml: "YAML",
    };

    let maxCount = 0;
    let primaryExt = "";
    Object.entries(extCounts).forEach(([ext, count]) => {
      if (count > maxCount) {
        maxCount = count;
        primaryExt = ext;
      }
    });

    const primaryLang =
      langMap[primaryExt] || primaryExt.toUpperCase() || "Unknown";

    return { fileCount, folderCount, sizeStr, primaryLang };
  }, [files]);

  // Local Search Filtering
  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files;
    const lowerQuery = searchQuery.toLowerCase();
    return files.filter(
      (f) =>
        f.fileName.toLowerCase().includes(lowerQuery) ||
        f.filePath.toLowerCase().includes(lowerQuery)
    );
  }, [files, searchQuery]);

  const tree = useMemo(() => buildTree(filteredFiles), [filteredFiles]);

  const folderTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.22, ease: [0.22, 1, 0.36, 1] };

  const renderTree = (nodes: TreeNode[], depth = 0) =>
    nodes.map((node) => {
      if (node.kind === "folder") {
        const hasActiveSearch = searchQuery.trim() !== "";
        const isOpen = hasActiveSearch ? true : open[node.path] ?? true;

        return (
          <div key={node.path} className="file-folder">
            <div
              className="folder-header"
              onClick={() => toggle(node.path)}
              style={{
                paddingLeft: "6px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {isOpen ? (
                <ChevronDown className="folder-header-chevron" />
              ) : (
                <ChevronRight className="folder-header-chevron" />
              )}
              {isOpen ? (
                <FolderOpen className="folder-icon" />
              ) : (
                <Folder className="folder-icon" />
              )}
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {node.name}
              </span>
            </div>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={shouldReduceMotion ? { opacity: 1 } : { height: 0, opacity: 0, y: -4 }}
                  animate={shouldReduceMotion ? { opacity: 1 } : { height: "auto", opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0, y: -4 }}
                  transition={folderTransition}
                  style={{ overflow: "hidden" }}
                >
                  <div className="file-folder-children">
                    {renderTree(node.children, depth + 1)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      }

      const isActive = activeFile === node.path;

      return (
        <div
          key={node.path}
          className={`file-item ${isActive ? "active" : ""}`}
          onClick={() => onFileSelect(node.file.filePath)}
          style={{ paddingLeft: "18px", position: "relative" }}
          data-filepath={node.file.filePath}
        >
          {isActive && (
            <motion.div
              layoutId="activeFileIndicator"
              className="active-file-indicator"
              transition={folderTransition}
            />
          )}
          {getFileIcon(node.name)}
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {node.name}
          </span>
        </div>
      );
    });

  return (
    <aside className={`sidebar glass-panel ${isOpen ? "open" : ""}`}>
      {onClose && (
        <button
          className="sidebar-close-btn mobile-only-flex"
          onClick={onClose}
          aria-label="Close file explorer"
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            background: "transparent",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            zIndex: 10,
            padding: "4px",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--bg-glass-hover)";
            e.currentTarget.style.color = "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--text-muted)";
          }}
        >
          <X size={15} />
        </button>
      )}
      {/* Brand Logo inside Sidebar (not displayed on Desktop because it is in top bar, but styled just in case) */}
      <div className="sidebar-logo">
        <div className="logo-mark">
          <LogoIcon className="logo-icon" size={24} />
          <div className="logo-text">CodeAtlas</div>
        </div>
        <div className="logo-tagline">AI Codebase Intelligence</div>
      </div>

      {/* Repository Summary Panel */}
      <div className="repo-summary-panel">
        <div className="sidebar-section-label-alt">
          Workspace Summary
        </div>
        <div className="repo-summary-grid">
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
        </div>
      </div>

      {/* Explorer search */}
      <div className="sidebar-section search-section">
        <div className="sidebar-section-label">Explorer</div>
      </div>

      <div className="sidebar-search-wrapper">
        <span className="sidebar-search-icon">
          <Search size={12} />
        </span>
        <input
          type="text"
          className="sidebar-search-input"
          placeholder="Filter files..."
          aria-label="Filter codebase files"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* File Tree */}
      <div className="file-list">
        {tree.length > 0 ? (
          renderTree(tree)
        ) : (
          <div className="file-list-empty">
            No files found
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-footer-stats">
          <span>Indexed files:</span>
          <span className="sidebar-footer-count">
            {filteredFiles.length} / {files.length}
          </span>
        </div>
      </div>
    </aside>
  );
}