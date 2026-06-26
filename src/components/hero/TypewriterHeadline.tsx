"use client";

import React, { useMemo } from "react";
import { useTypewriter } from "./useTypewriter";
import { HERO_REPOSITORIES } from "./heroRepositories";

interface TypewriterHeadlineProps {
  repositories?: string[];
  typingSpeed?: number;
  deleteSpeed?: number;
  pauseDuration?: number;
  cycleDuration?: number;
}

export default function TypewriterHeadline({
  repositories = HERO_REPOSITORIES,
  typingSpeed = 45,
  deleteSpeed = 25,
  pauseDuration = 2000,
  cycleDuration = 3000,
}: TypewriterHeadlineProps) {
  const {
    displayText,
    phase,
    isTransitioning,
    prefersReducedMotion,
  } = useTypewriter(
    repositories,
    typingSpeed,
    deleteSpeed,
    pauseDuration,
    cycleDuration
  );

  // Find the longest repository name to reserve grid layout space and prevent CLS
  const longestRepoName = useMemo(() => {
    return repositories.reduce(
      (longest, current) => (current.length > longest.length ? current : longest),
      ""
    );
  }, [repositories]);

  const showCursor = !prefersReducedMotion && phase !== "cycling";
  const isCursorBlinking = phase === "paused";

  return (
    <>
      {/* Screen Reader Accessible Content */}
      <span className="sr-only">Understand any codebase in minutes.</span>

      {/* Visually Displayed Content */}
      <span aria-hidden="true" className="onboarding-title-display">
        <span>Understand </span>
        <span 
          className="inline-grid grid-cols-1 grid-rows-1" 
          style={{ 
            verticalAlign: "bottom",
            display: "inline-grid"
          }}
        >
          {/* Invisible Anchor to reserve exact space */}
          <span
            className="invisible pointer-events-none select-none col-start-1 row-start-1"
            style={{
              fontFamily: "JetBrains Mono, var(--font-mono-family), monospace",
              fontWeight: 500,
              whiteSpace: prefersReducedMotion ? "normal" : "nowrap",
              wordBreak: "break-word",
            }}
          >
            {prefersReducedMotion ? "any codebase" : longestRepoName}
          </span>

          {/* Active Animated Content */}
          <span
            className={`col-start-1 row-start-1 flex items-center transition-all duration-300 ${
              isTransitioning ? "opacity-0 translate-y-[6px]" : "opacity-100 translate-y-0"
            }`}
            style={{
              fontFamily: "JetBrains Mono, var(--font-mono-family), monospace",
              fontWeight: 500,
              background: "linear-gradient(135deg, var(--accent-color) 0%, #a855f7 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              whiteSpace: prefersReducedMotion ? "normal" : "nowrap",
              wordBreak: "break-word",
            }}
          >
            {displayText}
            {showCursor && (
              <span
                className={`inline-block w-[2px] h-[0.9em] ml-1 bg-current ${
                  isCursorBlinking ? "animate-cursor-blink" : ""
                }`}
                style={{
                  verticalAlign: "middle",
                  backgroundColor: "var(--accent-color)",
                }}
              />
            )}
          </span>
        </span>
        <span> in minutes.</span>
      </span>
    </>
  );
}
