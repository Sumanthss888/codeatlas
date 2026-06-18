"use client";

import React from "react";

export function LogoIcon({ className, size = 20, style }: { className?: string; size?: number; style?: React.CSSProperties }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ flexShrink: 0, ...style }}
    >
      {/* Spherical boundary representing atlas/globe */}
      <circle cx="12" cy="12" r="10" strokeDasharray="3 3" opacity="0.5" />
      {/* Central node / map pin base */}
      <circle cx="12" cy="8" r="2.5" fill="currentColor" />
      {/* Branching leaf nodes representing code structure mapping */}
      <circle cx="7" cy="15" r="2" fill="currentColor" />
      <circle cx="17" cy="15" r="2" fill="currentColor" />
      {/* Connectivity edges */}
      <line x1="12" y1="8" x2="7" y2="15" stroke="currentColor" strokeWidth="1.5" />
      <line x1="12" y1="8" x2="17" y2="15" stroke="currentColor" strokeWidth="1.5" />
      <line x1="7" y1="15" x2="17" y2="15" stroke="currentColor" strokeWidth="1.2" opacity="0.3" strokeDasharray="2 2" />
    </svg>
  );
}

export default function Logo({ size = 20 }: { size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <LogoIcon className="logo-svg-icon" size={size} style={{ color: "var(--accent-color)" }} />
      <span
        style={{
          fontFamily: "var(--font-family)",
          fontSize: "14px",
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: "var(--text-primary)",
        }}
      >
        CodeAtlas
      </span>
    </div>
  );
}
