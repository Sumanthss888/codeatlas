"use client";

import { useState, KeyboardEvent } from "react";

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

  const handleAnalyze = () => {
    const trimmed = url.trim();
    if (!trimmed || isAnalyzing) return;
    onAnalyze(trimmed);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleAnalyze();
  };

  const canSubmit = !isAnalyzing && isLikelyGitHubUrl(url);

  return (
    <div className="repo-input-section">
      <div className="repo-input-inner">
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
        <button
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
        </button>
      </div>

      {/* Example repo shortcuts — only shown when the field is empty */}
      {!url && !isAnalyzing && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "10px",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "11px", color: "var(--text-muted)", flexShrink: 0 }}>
            Try:
          </span>
          {EXAMPLE_REPOS.map((repo) => (
            <button
              key={repo}
              onClick={() => setUrl(`https://github.com/${repo}`)}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "99px",
                padding: "3px 10px",
                fontSize: "11px",
                color: "var(--text-secondary)",
                cursor: "pointer",
                fontFamily: "'JetBrains Mono', monospace",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = "var(--border-strong)";
                el.style.color = "var(--text-accent)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = "var(--border-subtle)";
                el.style.color = "var(--text-secondary)";
              }}
            >
              {repo}
            </button>
          ))}
        </div>
      )}

      {/* Inline validation hint */}
      {url && !isLikelyGitHubUrl(url) && !isAnalyzing && (
        <p
          style={{
            marginTop: "8px",
            fontSize: "11px",
            color: "#f87171",
          }}
        >
          Enter a valid GitHub URL, e.g.{" "}
          <code
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              background: "rgba(239,68,68,0.1)",
              padding: "1px 4px",
              borderRadius: "4px",
            }}
          >
            https://github.com/owner/repo
          </code>
        </p>
      )}
    </div>
  );
}