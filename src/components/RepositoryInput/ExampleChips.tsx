"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

type Props = {
  onSelect: (repoUrl: string) => void;
  visible: boolean;
};

const EXAMPLE_REPOS = [
  "vercel/next.js",
  "shadcn-ui/ui",
  "tailwindlabs/tailwindcss",
];

export default function ExampleChips({ onSelect, visible }: Props) {
  const shouldReduceMotion = useReducedMotion();

  const chipHover = shouldReduceMotion ? {} : { y: -1.5 };
  const chipTap = shouldReduceMotion ? {} : { scale: 0.98, y: 0 };

  if (!visible) return null;

  return (
    <div className="repo-shortcuts-list">
      <span className="repo-shortcuts-label">Try:</span>
      {EXAMPLE_REPOS.map((repo, index) => (
        <motion.button
          key={repo}
          whileHover={chipHover}
          whileTap={chipTap}
          onClick={() => onSelect(`https://github.com/${repo}`)}
          className="repo-shortcut-btn"
          style={{ "--delay": `${index * 100 + 1200}ms` } as React.CSSProperties}
        >
          {repo}
        </motion.button>
      ))}
    </div>
  );
}
