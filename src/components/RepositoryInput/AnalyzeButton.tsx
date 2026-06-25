"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

type Props = {
  onClick: () => void;
  isAnalyzing: boolean;
  disabled: boolean;
};

export default function AnalyzeButton({ onClick, isAnalyzing, disabled }: Props) {
  const shouldReduceMotion = useReducedMotion();

  const buttonHover = shouldReduceMotion || disabled ? {} : { y: -0.5 };
  const buttonTap = shouldReduceMotion || disabled ? {} : { scale: 0.98, y: 0.5 };

  return (
    <motion.button
      whileHover={buttonHover}
      whileTap={buttonTap}
      onClick={onClick}
      disabled={disabled}
      className="analyze-btn integrated"
      aria-busy={isAnalyzing}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
      }}
    >
      {isAnalyzing ? (
        <>
          <span className="btn-spinner" />
          Analyzing…
        </>
      ) : (
        <>
          <span>⚡</span>
          Analyze
        </>
      )}
    </motion.button>
  );
}
