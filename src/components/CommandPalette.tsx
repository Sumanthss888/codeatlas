"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SearchField from "@/components/ui/search/SearchField";
import type { RepoFile } from "@/app/page";
import {
  Search,
  FileCode,
  Terminal,
  Settings,
  Sparkles,
  Sun,
  Moon,
  Monitor,
  RefreshCw,
  Hash,
} from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  repoFiles: RepoFile[];
  onFileSelect?: (filePath: string) => void;
  onSendMessage: (content: string) => void;
  onChangeRepo: () => void;
  onSelectExampleRepo: (repoUrl: string) => void;
  currentTheme: "light" | "dark" | "system";
  applyTheme: (theme: "light" | "dark" | "system") => void;
};

type CommandItem = {
  id: string;
  category: "Files" | "Prompts" | "Theme" | "Repository" | "Suggestions";
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
};

export default function CommandPalette({
  isOpen,
  onClose,
  repoFiles,
  onFileSelect,
  onSendMessage,
  onChangeRepo,
  onSelectExampleRepo,
  currentTheme,
  applyTheme,
}: Props) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const activeElementRef = useRef<HTMLElement | null>(null);

  // Focus preservation: focus search on open, restore on close
  useEffect(() => {
    if (isOpen) {
      activeElementRef.current = document.activeElement as HTMLElement;
      setQuery("");
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      activeElementRef.current?.focus();
    }
  }, [isOpen]);

  // Construct command palette registry
  const commands = useMemo<CommandItem[]>(() => {
    const list: CommandItem[] = [];
    const isRepoActive = repoFiles.length > 0;

    // 1. FILES SECTION
    if (isRepoActive) {
      repoFiles.forEach((file) => {
        const ext = file.fileName.split(".").pop()?.toLowerCase();
        let fileIcon = <FileCode className="command-palette-item-icon" />;
        if (ext === "json") fileIcon = <Settings className="command-palette-item-icon" />;
        else if (ext === "md") fileIcon = <FileCode className="command-palette-item-icon" />;
        else if (ext === "yml" || ext === "yaml") {
          fileIcon = <Terminal className="command-palette-item-icon" />;
        }

        list.push({
          id: `file-${file.filePath}`,
          category: "Files",
          title: file.fileName,
          subtitle: file.filePath,
          icon: fileIcon,
          action: () => {
            onFileSelect?.(file.filePath);
            onClose();
          },
        });
      });
    }

    // 2. PROMPTS SECTION
    const defaultPrompts = [
      "Explain the architecture of this codebase",
      "Find potential performance issues or N+1 queries",
      "Trace authentication flow in this repo",
      "List all API endpoints",
      "Identify tech debt and bad practices",
      "Show data models and structures",
    ];

    defaultPrompts.forEach((prompt, idx) => {
      list.push({
        id: `prompt-default-${idx}`,
        category: "Prompts",
        title: prompt,
        icon: <Sparkles className="command-palette-item-icon" />,
        action: () => {
          onSendMessage(prompt);
          onClose();
        },
      });
    });

    // Dynamic contextual prompts based on detected tech
    if (isRepoActive) {
      const paths = repoFiles.map((f) => f.filePath);
      const hasNextjs = paths.some(
        (p) => p.includes("next.config") || p.includes("src/app/") || p.includes("src/pages/")
      );
      const hasReact = paths.some((p) => p.endsWith(".tsx") || p.endsWith(".jsx"));
      const hasPython = paths.some((p) => p.endsWith(".py"));
      const hasTailwind = paths.some((p) => p.includes("tailwind.config"));
      const hasTypeScript = paths.some((p) => p.endsWith(".ts") || p.endsWith(".tsx"));

      const contextPrompts: string[] = [];
      if (hasNextjs) {
        contextPrompts.push("Explain Next.js routing structure");
        contextPrompts.push("Analyze server vs client components");
      } else if (hasReact) {
        contextPrompts.push("Explain React component hierarchy");
      }

      if (hasPython) {
        contextPrompts.push("Explain package structure & main execution");
      }

      if (hasTailwind) {
        contextPrompts.push("Show Tailwind CSS configurations");
      }

      if (hasTypeScript && contextPrompts.length < 2) {
        contextPrompts.push("Explain TypeScript declarations");
      }

      contextPrompts.forEach((prompt, idx) => {
        list.push({
          id: `prompt-context-${idx}`,
          category: "Prompts",
          title: prompt,
          subtitle: "Contextual prompt",
          icon: (
            <Sparkles
              className="command-palette-item-icon"
              style={{ color: "var(--accent-color)" }}
            />
          ),
          action: () => {
            onSendMessage(prompt);
            onClose();
          },
        });
      });
    }

    // 3. EXAMPLE SUGGESTIONS (if no repo loaded)
    if (!isRepoActive) {
      const examples = ["vercel/next.js", "shadcn-ui/ui", "tailwindlabs/tailwindcss"];
      examples.forEach((ex) => {
        list.push({
          id: `example-${ex}`,
          category: "Suggestions",
          title: `Analyze example: ${ex}`,
          icon: <Sparkles className="command-palette-item-icon" />,
          action: () => {
            onSelectExampleRepo(`https://github.com/${ex}`);
            onClose();
          },
        });
      });
    }

    // 4. THEME SECTION
    const themeModes: Array<{
      name: "light" | "dark" | "system";
      lbl: string;
      ic: React.ReactNode;
    }> = [
      { name: "light", lbl: "Switch to Light Mode", ic: <Sun className="command-palette-item-icon" /> },
      { name: "dark", lbl: "Switch to Dark Mode", ic: <Moon className="command-palette-item-icon" /> },
      { name: "system", lbl: "Switch to System Mode", ic: <Monitor className="command-palette-item-icon" /> },
    ];

    themeModes.forEach((t) => {
      list.push({
        id: `theme-${t.name}`,
        category: "Theme",
        title: t.lbl,
        subtitle: currentTheme === t.name ? "active" : undefined,
        icon: t.ic,
        action: () => {
          applyTheme(t.name);
          onClose();
        },
      });
    });

    // 5. REPOSITORY SECTION
    if (isRepoActive) {
      list.push({
        id: "repo-change",
        category: "Repository",
        title: "Analyze New Repository",
        subtitle: "Close active workspace",
        icon: <RefreshCw className="command-palette-item-icon" />,
        action: () => {
          onChangeRepo();
          onClose();
          setTimeout(() => {
            (document.querySelector(".repo-input-field") as HTMLInputElement)?.focus();
          }, 200);
        },
      });
    } else {
      list.push({
        id: "repo-focus",
        category: "Repository",
        title: "Focus Repository Input",
        icon: <RefreshCw className="command-palette-item-icon" />,
        action: () => {
          onClose();
          (document.querySelector(".repo-input-field") as HTMLInputElement)?.focus();
        },
      });
    }

    return list;
  }, [
    repoFiles,
    currentTheme,
    applyTheme,
    onChangeRepo,
    onSelectExampleRepo,
    onSendMessage,
    onFileSelect,
    onClose,
  ]);

  // Client-side fuzzy and matching filter
  const filteredCommands = useMemo(() => {
    if (!query.trim()) {
      // Empty query: show everything except Files (prevents list overload)
      return commands.filter((c) => c.category !== "Files");
    }

    const lowerQuery = query.toLowerCase();

    return commands
      .map((cmd) => {
        let score = 0;
        const titleLower = cmd.title.toLowerCase();
        const subtitleLower = cmd.subtitle?.toLowerCase() || "";

        if (titleLower.includes(lowerQuery)) {
          score += 10;
          if (titleLower.startsWith(lowerQuery)) score += 5;
        }

        if (subtitleLower.includes(lowerQuery)) {
          score += 5;
        }

        if (titleLower === lowerQuery) {
          score += 15;
        }

        return { cmd, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.cmd);
  }, [commands, query]);

  // Reset selected item when filtered results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard Navigation handlers
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  // Group commands by category for display
  const grouped = useMemo(() => {
    const map: Record<string, CommandItem[]> = {};
    filteredCommands.forEach((cmd) => {
      if (!map[cmd.category]) map[cmd.category] = [];
      map[cmd.category].push(cmd);
    });
    return map;
  }, [filteredCommands]);

  const categoriesOrder = ["Files", "Prompts", "Suggestions", "Theme", "Repository"] as const;

  // Render variables
  let flatIndexCounter = 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="command-palette-backdrop" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="command-palette-container"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="CodeAtlas Command Palette"
          >
            {/* Search Input Area */}
            <div className="command-palette-search-wrapper" style={{ borderBottom: "none", padding: "12px 16px" }}>
              <div style={{ flexGrow: 1, position: "relative" }}>
                <SearchField
                  ref={inputRef}
                  value={query}
                  onChange={setQuery}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a file path or command..."
                  size="default"
                  font="body"
                  clearable={false}
                />
              </div>
              <span className="command-palette-kbd-hint">ESC</span>
            </div>

            {/* List area */}
            <div className="command-palette-list">
              {filteredCommands.length > 0 ? (
                categoriesOrder.map((cat) => {
                  const items = grouped[cat];
                  if (!items || items.length === 0) return null;

                  return (
                    <div key={cat}>
                      <div className="command-palette-group-label">{cat}</div>
                      {items.map((item) => {
                        const currentIndex = flatIndexCounter++;
                        const isSelected = currentIndex === selectedIndex;

                        return (
                          <div
                            key={item.id}
                            className={`command-palette-item ${isSelected ? "selected" : ""}`}
                            onClick={item.action}
                            onMouseEnter={() => setSelectedIndex(currentIndex)}
                          >
                            <div className="command-palette-item-left">
                              {item.icon}
                              <span className="command-palette-item-text">{item.title}</span>
                              {item.subtitle && (
                                <span className="command-palette-item-subtitle">
                                  {item.subtitle}
                                </span>
                              )}
                            </div>
                            <div className="command-palette-item-right">
                              {isSelected && (
                                <span
                                  style={{
                                    fontSize: "10px",
                                    color: "var(--accent-color)",
                                    opacity: 0.8,
                                  }}
                                >
                                  ↵ Enter
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })
              ) : (
                <div className="command-palette-empty">
                  <span>No results found for "{query}"</span>
                  <span style={{ fontSize: "11px", opacity: 0.6 }}>
                    Try searching for themes, suggestions, or other prompts.
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
