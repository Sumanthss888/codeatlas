"use client";

import React from "react";
import { motion } from "framer-motion";

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  title?: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  selectedValue: T;
  onChange: (value: T) => void;
  className?: string;
}

export default function SegmentedControl<T extends string>({
  options,
  selectedValue,
  onChange,
  className = "",
}: SegmentedControlProps<T>) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = options.findIndex((o) => o.value === selectedValue);
    if (currentIndex === -1) return;

    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % options.length;
      onChange(options[nextIndex].value);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + options.length) % options.length;
      onChange(options[prevIndex].value);
    }
  };

  return (
    <div
      className={`segmented-control-container ${className}`}
      role="radiogroup"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label="Workspace tabs"
    >
      {options.map((option) => {
        const isActive = option.value === selectedValue;
        return (
          <button
            key={option.value}
            role="radio"
            aria-checked={isActive}
            tabIndex={isActive ? 0 : -1}
            className={`segmented-control-item ${isActive ? "active" : ""}`}
            onClick={() => onChange(option.value)}
            title={option.title}
          >
            {isActive && (
              <motion.div
                layoutId="segmented-active-indicator"
                className="segmented-active-bg"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className="segmented-content">
              {option.icon && <span className="segmented-icon">{option.icon}</span>}
              <span className="segmented-label">{option.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
