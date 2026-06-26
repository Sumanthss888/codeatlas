"use client";
import React, { useState, useEffect, KeyboardEvent } from "react";
import GitHubIcon from "./GitHubIcon";
import AnalyzeButton from "./AnalyzeButton";
import ExampleChips from "./ExampleChips";

type Props = {
  onAnalyze: (url: string) => void;
  isAnalyzing: boolean;
  initialValue?: string;
};

function isLikelyGitHubUrl(value: string): boolean {
  return value.trim().length > 0 && value.includes("github.com/");
}

export default function RepositoryInput({ onAnalyze, isAnalyzing, initialValue = "" }: Props) {
  const [url, setUrl] = useState(initialValue);
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
        <div className="console-left-icon">
          <GitHubIcon isFocused={isFocused} />
        </div>
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
        <AnalyzeButton
          onClick={handleAnalyze}
          disabled={!canSubmit}
          isAnalyzing={isAnalyzing}
        />
      </div>
      <ExampleChips onChipClick={(val) => setUrl(val)} />
    </div>
  );
}
