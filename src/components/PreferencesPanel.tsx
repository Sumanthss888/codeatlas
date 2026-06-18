"use client";

import { useEffect, useRef, useState } from "react";
import { X, ShieldAlert, Sparkles, Check, Trash2, Database, Laptop } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  theme: "light" | "dark" | "system";
  applyTheme: (theme: "light" | "dark" | "system") => void;
  onClearRecentRepos: () => void;
  onClearCache: () => void;
  onResetWorkspace: () => void;
  recentReposCount: number;
};

export default function PreferencesPanel({
  isOpen,
  onClose,
  theme,
  applyTheme,
  onClearRecentRepos,
  onClearCache,
  onResetWorkspace,
  recentReposCount,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pendingConfirm, setPendingConfirm] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();

  // Focus Trapping
  useEffect(() => {
    if (!isOpen) return;

    const el = panelRef.current;
    if (!el) return;

    const focusableElements = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];

    // Focus close button initially
    first.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Focus Restoration
  useEffect(() => {
    if (!isOpen) {
      document.getElementById("header-settings-btn")?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Declare registry sections dynamically using props
  const sections = [
    {
      id: "appearance",
      title: "Appearance",
      items: [
        {
          id: "theme",
          label: "Interface Theme",
          description: "Choose how CodeAtlas looks on your screen.",
          type: "segmented" as const,
          options: [
            { label: "Light", value: "light" as const },
            { label: "Dark", value: "dark" as const },
            { label: "System", value: "system" as const },
          ],
          value: theme,
          onChange: applyTheme,
        },
      ],
    },
    {
      id: "ai-model",
      title: "AI & Intelligence",
      items: [
        {
          id: "model",
          label: "AI Model",
          type: "info" as const,
          infoValue: "Llama 3.1 8B",
        },
        {
          id: "provider",
          label: "API Provider",
          type: "info" as const,
          infoValue: "Groq Cloud",
        },
      ],
    },
    {
      id: "local-data",
      title: "Workspace & Caching",
      items: [
        {
          id: "clear-recents",
          label: "Recent Repositories",
          description: `${recentReposCount} stored repo location${recentReposCount === 1 ? "" : "s"}.`,
          type: "action" as const,
          actionLabel: "Clear List",
          disabled: recentReposCount === 0,
          onAction: onClearRecentRepos,
          confirmMessage: "Clear recently analyzed list?",
        },
        {
          id: "clear-cache",
          label: "Clear Cache",
          description: "Reset layout options and cached tabs.",
          type: "action" as const,
          actionLabel: "Clear Cache",
          onAction: onClearCache,
          confirmMessage: "Clear layout cache?",
        },
        {
          id: "reset-workspace",
          label: "Reset Workspace",
          description: "Wipe all settings, theme preferences, and history.",
          type: "action" as const,
          actionLabel: "Reset All",
          danger: true,
          onAction: onResetWorkspace,
          confirmMessage: "Reset workspace? This removes all local preferences.",
        },
      ],
    },
  ];

  const handleActionClick = (itemId: string) => {
    setPendingConfirm(itemId);
  };

  const handleActionConfirm = (onAction: () => void) => {
    onAction();
    setPendingConfirm(null);
  };

  return (
    <div className="preferences-backdrop" onClick={onClose}>
      <motion.div
        ref={panelRef}
        className="preferences-drawer glass-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="preferences-title"
        initial={shouldReduceMotion ? { x: 0, opacity: 1 } : { x: "100%", opacity: 0.95 }}
        animate={{ x: 0, opacity: 1 }}
        exit={shouldReduceMotion ? { x: 0, opacity: 1 } : { x: "100%", opacity: 0.95 }}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.18, ease: "easeInOut" }}
      >
        {/* Drawer Header */}
        <div className="preferences-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Laptop size={15} style={{ color: "var(--accent-color)" }} />
            <h2 id="preferences-title" style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
              Workspace Preferences
            </h2>
          </div>
          <button
            className="preferences-close-btn"
            onClick={onClose}
            aria-label="Close preferences panel"
          >
            <X size={15} />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="preferences-content">
          {sections.map((section) => (
            <div key={section.id} className="preferences-section">
              <h3 className="preferences-section-title">{section.title}</h3>
              <div className="preferences-section-items">
                {section.items.map((item) => (
                  <div key={item.id} className="preferences-item">
                    {/* Item Information */}
                    <div className="preferences-item-info">
                      <label className="preferences-item-label">{item.label}</label>
                      {"description" in item && item.description && (
                        <span className="preferences-item-desc">{item.description}</span>
                      )}
                    </div>

                    {/* Segmented Control Theme Selector */}
                    {item.type === "segmented" && item.options && (
                      <div className="preferences-segmented" role="radiogroup" aria-label={item.label}>
                        {item.options.map((opt) => (
                          <button
                            key={opt.value}
                            role="radio"
                            aria-checked={item.value === opt.value}
                            className={`preferences-segmented-btn ${item.value === opt.value ? "active" : ""}`}
                            onClick={() => item.onChange?.(opt.value)}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Info display row (Read only) */}
                    {item.type === "info" && (
                      <span className="preferences-item-value">{item.infoValue}</span>
                    )}

                    {/* Action buttons with inline confirmations */}
                    {item.type === "action" && (
                      <div className="preferences-action-wrapper">
                        {pendingConfirm === item.id ? (
                          <div className="preferences-confirm-row">
                            <span className="preferences-confirm-text">Are you sure?</span>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button
                                className="preferences-confirm-btn cancel"
                                onClick={() => setPendingConfirm(null)}
                              >
                                Cancel
                              </button>
                              <button
                                className={`preferences-confirm-btn confirm ${item.danger ? "danger" : ""}`}
                                onClick={() => handleActionConfirm(item.onAction)}
                              >
                                Confirm
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            disabled={item.disabled}
                            className={`preferences-action-btn ${item.danger ? "danger" : ""}`}
                            onClick={() => handleActionClick(item.id)}
                          >
                            {item.actionLabel}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Drawer Footer info */}
        <div className="preferences-footer">
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Sparkles size={11} style={{ color: "var(--accent-color)" }} />
            <span>CodeAtlas v0.1.0 · Sonoma System Layout</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
