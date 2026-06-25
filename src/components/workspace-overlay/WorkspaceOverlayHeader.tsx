"use client";

import React from "react";
import { X } from "lucide-react";

type Props = {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onClose: () => void;
  actions?: React.ReactNode;
};

export default function WorkspaceOverlayHeader({ title, subtitle, icon, onClose, actions }: Props) {
  return (
    <div className="workspace-overlay-header">
      <div className="header-left">
        {icon && <span className="header-icon-wrapper">{icon}</span>}
        <div className="header-text">
          <h2 className="header-title">{title}</h2>
          {subtitle && <p className="header-subtitle">{subtitle}</p>}
        </div>
      </div>
      
      <div className="header-right">
        {actions && <div className="header-action-slots">{actions}</div>}
        <button
          onClick={onClose}
          className="header-close-btn"
          aria-label="Close overlay"
          title="Close (Esc)"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
