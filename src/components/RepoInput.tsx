"use client";

import { useState, KeyboardEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  onAnalyze: (url: string) => void;
  isAnalyzing: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EXAMPLE_REPOS = [
  "vercel/next.js",
  "shadcn-ui/ui",
  "tailwindlabs/tailwindcss",
];

/** Lightweight client-side check — real validation happens in the API route. */
function isLikelyGitHubUrl(value: string): boolean {
  return value.trim().length > 0 && value.includes("github.com/");
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RepoInput({ onAnalyze, isAnalyzing }: Props) {
  const [url, setUrl] = useState("");
  const shouldReduceMotion = useReducedMotion();

  const handleAnalyze = () => {
    const trimmed = url.trim();
    if (!trimmed || isAnalyzing) return;
    onAnalyze(trimmed);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleAnalyze();
  };

  const canSubmit = !isAnalyzing && isLikelyGitHubUrl(url);

  const buttonHover = shouldReduceMotion || !canSubmit ? {} : { scale: 1.01 };
  const buttonTap = shouldReduceMotion || !canSubmit ? {} : { scale: 0.97 };
  const chipHover = shouldReduceMotion ? {} : { scale: 1.02, y: -1 };
  const chipTap = shouldReduceMotion ? {} : { scale: 0.98, y: 0 };

  return (
    <div className="repo-input-section glass-panel">
      <div className="repo-input-inner">
        <div className="repo-input-row">
          {/* URL field */}
          <div className="repo-input-wrapper">
            <span className="repo-input-icon">
              {isAnalyzing ? (
                <span className="btn-spinner" style={{ width: 12, height: 12 }} />
              ) : (
                "⌥"
              )}
            </span>
            <input
              type="text"
              className="repo-input-field"
              placeholder="https://github.com/owner/repository"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isAnalyzing}
              aria-label="GitHub repository URL"
            />
          </div>

          {/* CTA button */}
          <motion.button
            whileHover={buttonHover}
            whileTap={buttonTap}
            className="analyze-btn"
            onClick={handleAnalyze}
            disabled={!canSubmit}
            aria-busy={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <span className="btn-spinner" />
                Analyzing…
              </>
            ) : (
              <>
                <span>⚡</span>
                Analyze Repository
              </>
            )}
          </motion.button>
        </div>

        {/* Example repo shortcuts — only shown when the field is empty */}
        {!url && !isAnalyzing && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "4px",
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: "11px", color: "var(--text-muted)", flexShrink: 0 }}>
              Try:
            </span>
            {EXAMPLE_REPOS.map((repo) => (
              <motion.button
                key={repo}
                whileHover={chipHover}
                whileTap={chipTap}
                onClick={() => setUrl(`https://github.com/${repo}`)}
                style={{
                  background: "var(--bg-glass)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-sm)",
                  padding: "4px 12px",
                  fontSize: "11px",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  fontFamily: "var(--font-mono-family)",
                  transition: "all 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.borderColor = "var(--accent-color)";
                  el.style.color = "var(--text-primary)";
                  el.style.background = "var(--bg-glass-hover)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.borderColor = "var(--border-default)";
                  el.style.color = "var(--text-secondary)";
                  el.style.background = "var(--bg-glass)";
                }}
              >
                {repo}
              </motion.button>
            ))}
          </div>
        )}

        {/* Inline validation hint */}
        {url && !isLikelyGitHubUrl(url) && !isAnalyzing && (
          <p
            style={{
              marginTop: "4px",
              fontSize: "11px",
              color: "var(--color-error)",
            }}
          >
            Enter a valid GitHub URL, e.g.{" "}
            <code
              style={{
                fontFamily: "var(--font-mono-family)",
                background: "var(--color-error-soft)",
                padding: "2px 6px",
                borderRadius: "4px",
                border: "1px solid rgba(255, 59, 48, 0.15)",
              }}
            >
              https://github.com/owner/repo
            </code>
          </p>
        )}
      </div>
    </div>
  );
}