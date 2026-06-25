"use client";

import React, { useState, KeyboardEvent } from "react";
import GitHubIcon from "./GitHubIcon";
import AnalyzeButton from "./AnalyzeButton";
import ExampleChips from "./ExampleChips";

type Props = {
  onAnalyze: (url: string) => void;
  isAnalyzing: boolean;
};

function isLikelyGitHubUrl(value: string): boolean {
  return value.trim().length > 0 && value.includes("github.com/");
}

export default function RepositoryInput({ onAnalyze, isAnalyzing }: Props) {
  const [url, setUrl] = useState("");
  const [isFocused, setIsFocused] = useState(false);

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
    <div className="signature-input-wrapper">
      <div className={`signature-input-console ${isFocused ? "focused" : ""}`}>
        {/* Left GitHub Icon */}
        <div className="console-left-icon">
          <GitHubIcon isFocused={isFocused} />
        </div>

        {/* Input Text Field */}
        <input
          type="text"
          className="console-input-field"
          placeholder="https://github.com/owner/repository"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          disabled={isAnalyzing}
          aria-label="GitHub repository URL"
        />

        {/* Subtle Vertical Divider */}
        <div className="console-divider" />

        {/* Analyze button CTA */}
        <div className="console-right-action">
          <AnalyzeButton
            onClick={handleAnalyze}
            isAnalyzing={isAnalyzing}
            disabled={!canSubmit}
          />
        </div>
      </div>

      {/* Example Repository shortcuts */}
      <ExampleChips
        onSelect={(repoUrl) => setUrl(repoUrl)}
        visible={!url && !isAnalyzing}
      />

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
  );
}
