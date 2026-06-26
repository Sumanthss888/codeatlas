"use client";

import React from "react";
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

  const showCursor = !prefersReducedMotion && phase !== "cycling";
  const isCursorBlinking = phase === "paused";

  return (
    <>
      {/* Screen Reader Accessible Content */}
      <span className="sr-only">Understand any codebase in minutes.</span>

      {/* Visually Displayed Content - Pure Inline Flow */}
      <span aria-hidden="true" className="onboarding-title-display" style={{ display: "inline" }}>
        Understand{" "}
        <span
          className={`inline-block transition-all duration-300 ${
            isTransitioning ? "opacity-0 translate-y-[6px]" : "opacity-100 translate-y-0"
          }`}
          style={{
            fontFamily: "JetBrains Mono, var(--font-mono-family), monospace",
            fontWeight: 500,
            background: "linear-gradient(135deg, var(--accent-color) 0%, #a855f7 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            verticalAlign: "baseline",
          }}
        >
          {displayText}
        </span>
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
        {" "}in minutes.
      </span>
    </>
  );
}
