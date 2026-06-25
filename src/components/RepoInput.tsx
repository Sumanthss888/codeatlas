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
          <div className="repo-shortcuts-list">
            <span className="repo-shortcuts-label">
              Try:
            </span>
            {EXAMPLE_REPOS.map((repo) => (
              <motion.button
                key={repo}
                whileHover={chipHover}
                whileTap={chipTap}
                onClick={() => setUrl(`https://github.com/${repo}`)}
                className="repo-shortcut-btn"
              >
                {repo}
              </motion.button>
            ))}
          </div>
        )}

        {/* Inline validation hint */}
        {url && !isLikelyGitHubUrl(url) && !isAnalyzing && (
          <p className="repo-validation-error">
            Enter a valid GitHub URL, e.g.{" "}
            <code className="repo-validation-code">
              https://github.com/owner/repo
            </code>
          </p>
        )}
      </div>
    </div>
  );
}