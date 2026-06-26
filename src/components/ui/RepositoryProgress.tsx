import React from "react";

interface RepositoryProgressProps {
  label: string;
  value: string | number;
  total?: string | number;
  percentage?: number; // optional progress bar percentage
  status?: "idle" | "loading" | "success" | "error";
  className?: string;
}

export default function RepositoryProgress({
  label,
  value,
  total,
  percentage,
  status = "success",
  className = "",
}: RepositoryProgressProps) {
  return (
    <div className={`repo-progress-container ${status} ${className}`}>
      <div className="repo-progress-text-row">
        <span className="repo-progress-label">
          <span className={`repo-progress-status-dot ${status}`} />
          {label}
        </span>
        <span className="repo-progress-value">
          {value}{total ? ` / ${total}` : ""}
        </span>
      </div>
      {percentage !== undefined && (
        <div className="repo-progress-bar-track">
          <div
            className={`repo-progress-bar-fill ${status}`}
            style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
          />
        </div>
      )}
    </div>
  );
}
