"use client";

import React, { useState, useEffect } from "react";

const WORDS = [
  "vercel/next.js",
  "facebook/react",
  "tailwindcss",
  "your team's repo",
  "any codebase"
];

const TYPE_SPEED = 55;
const DELETE_SPEED = 28;
const PAUSE_AFTER_TYPE = 1800;
const PAUSE_BEFORE_TYPE = 400;
const FINAL_CURSOR_DELAY = 1200;

export default function TypewriterHeadline() {
  const [displayText, setDisplayText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [cursorOpacity, setCursorOpacity] = useState(1);
  const [isFinalWordComplete, setIsFinalWordComplete] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Detect prefers-reduced-motion
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setPrefersReducedMotion(mediaQuery.matches);

      const listener = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches);
      };
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayText("any codebase");
      setIsFinalWordComplete(true);
      return;
    }

    if (isFinalWordComplete) return;

    const currentWord = WORDS[wordIndex];

    if (!isDeleting && !isPaused) {
      // Typing phase
      if (charCount < currentWord.length) {
        const timer = setTimeout(() => {
          setDisplayText(currentWord.slice(0, charCount + 1));
          setCharCount((prev) => prev + 1);
        }, TYPE_SPEED);
        return () => clearTimeout(timer);
      } else {
        // Fully typed
        if (wordIndex === WORDS.length - 1) {
          // Final word: Stop animation entirely
          setIsFinalWordComplete(true);
          // Wait 1200ms delay, then fade out the cursor
          const fadeTimer = setTimeout(() => {
            setCursorOpacity(0);
          }, FINAL_CURSOR_DELAY);
          return () => clearTimeout(fadeTimer);
        } else {
          // Pause after typing completes
          setIsPaused(true);
          const timer = setTimeout(() => {
            setIsPaused(false);
            setIsDeleting(true);
          }, PAUSE_AFTER_TYPE);
          return () => clearTimeout(timer);
        }
      }
    } else if (isDeleting && !isPaused) {
      // Deleting phase
      if (charCount > 0) {
        const timer = setTimeout(() => {
          setDisplayText(currentWord.slice(0, charCount - 1));
          setCharCount((prev) => prev - 1);
        }, DELETE_SPEED);
        return () => clearTimeout(timer);
      } else {
        // Fully deleted: Pause before typing next word
        setIsPaused(true);
        const timer = setTimeout(() => {
          setIsPaused(false);
          setIsDeleting(false);
          setWordIndex((prev) => prev + 1);
        }, PAUSE_BEFORE_TYPE);
        return () => clearTimeout(timer);
      }
    }
  }, [wordIndex, charCount, isDeleting, isPaused, isFinalWordComplete, prefersReducedMotion]);

  // "While typing or deleting: animation-play-state: paused (cursor stays solid)
  //  While paused between words: animation-play-state: running (cursor blinks)"
  const isBlinking = isPaused && !isFinalWordComplete;

  return (
    <>
      {/* Screen Reader Accessible Content */}
      <span className="sr-only">Understand any codebase in minutes.</span>

      {/* Visually Displayed Content - Pure Inline Flow */}
      <span aria-hidden="true" style={{ display: "inline" }}>
        Understand{" "}
        <span
          style={{
            display: "inline", // critical — never block or inline-block
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 500,
            background: "linear-gradient(135deg, #818CF8 0%, #A78BFA 50%, #C084FC 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            letterSpacing: "-0.01em"
          }}
        >
          {displayText}
        </span>
        {!prefersReducedMotion && (
          <span
            className="typewriter-cursor"
            style={{
              display: "inline-block",
              width: "3px",
              height: "0.85em",
              background: "#A78BFA",
              borderRadius: "1.5px",
              marginLeft: "3px",
              verticalAlign: "baseline",
              position: "relative",
              top: "0.05em",
              transition: "opacity 0.8s ease",
              opacity: cursorOpacity,
              animation: isFinalWordComplete ? "none" : "cursorBlink 0.75s ease infinite",
              animationPlayState: isBlinking ? "running" : "paused"
            }}
          />
        )}
        {" "}in minutes.
      </span>
    </>
  );
}
