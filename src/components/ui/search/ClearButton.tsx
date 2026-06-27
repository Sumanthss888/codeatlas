"use client";

import React from "react";
import { X } from "lucide-react";

interface ClearButtonProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  size?: number;
  className?: string;
}

export default function ClearButton({ onClick, size = 12, className }: ClearButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
      aria-label="Clear search input"
      tabIndex={-1}
    >
      <X size={size} />
    </button>
  );
}
