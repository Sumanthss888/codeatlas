"use client";

import React from "react";
import { ArrowRight } from "lucide-react";

interface ActionCardProps {
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  description?: string;
  onClick: () => void;
  className?: string;
}

export default function ActionCard({
  icon: Icon,
  label,
  description,
  onClick,
  className = "",
}: ActionCardProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`action-card-btn glass-panel ${className}`}
      aria-label={label}
    >
      <span className="action-card-left">
        {Icon && <Icon size={14} className="action-card-icon" />}
        <span className="action-card-text-group">
          <span className="action-card-label">{label}</span>
          {description && <span className="action-card-desc">{description}</span>}
        </span>
      </span>
      <ArrowRight size={13} className="action-card-arrow" />
    </button>
  );
}
