"use client";

import { useMemo, useState } from "react";
import type { RepoFile } from "@/app/page";
import {
  Folder,
  FolderOpen,
  FileText,
  FileCode,
  FileJson,
} from "lucide-react";

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
  if (name.endsWith(".ts") || name.endsWith(".tsx"))
    return <FileCode className="file-icon" />;
  if (name.endsWith(".json"))
    return <FileJson className="file-icon" />;
  if (name.endsWith(".md"))
    return <FileText className="file-icon" />;

  return <FileText className="file-icon" />;
}

type Props = {
  activeFile: string | null;
  onFileSelect: (filePath: string) => void;
  files: RepoFile[];
};

export default function Sidebar({
  activeFile,
  onFileSelect,
  files,
}: Props) {
  const tree = useMemo(() => buildTree(files), [files]);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const toggle = (path: string) =>
    setOpen((prev) => ({ ...prev, [path]: !prev[path] }));

  const renderTree = (nodes: TreeNode[], depth = 0) =>
    nodes.map((node) => {
      if (node.kind === "folder") {
        const isOpen = open[node.path] ?? true;

        return (
          <div key={node.path}>
            <div
              className="folder-header"
              onClick={() => toggle(node.path)}
              style={{ paddingLeft: depth * 12 + 8 }}
            >
              {isOpen ? (
                <FolderOpen className="folder-icon" />
              ) : (
                <Folder className="folder-icon" />
              )}
              <span>{node.name}</span>
            </div>

            {isOpen && renderTree(node.children, depth + 1)}
          </div>
        );
      }

      return (
        <div
          key={node.path}
          className={`file-item ${
            activeFile === node.path ? "active" : ""
          }`}
          onClick={() => onFileSelect(node.file.filePath)}
          style={{ paddingLeft: depth * 12 + 20 }}
        >
          {getFileIcon(node.name)}
          <span>{node.name}</span>
        </div>
      );
    });

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-mark">
          <div className="logo-icon">🗺</div>
          <div className="logo-text">CodeAtlas</div>
        </div>
        <div className="logo-tagline">AI Codebase Intelligence</div>
      </div>

      {/* Section */}
      <div className="sidebar-section">
        <div className="sidebar-section-label">
          Explorer <span>{files.length} files</span>
        </div>
      </div>

      {/* File Tree */}
      <div className="file-list">{renderTree(tree)}</div>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="stat-pill">
          <span className="stat-pill-value">{files.length}</span>
          <span className="stat-pill-label">Files</span>
        </div>
      </div>
    </aside>
  );
}