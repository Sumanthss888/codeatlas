import React from "react";

interface MetricCardProps {
  value: string | number;
  label: string;
  className?: string;
}

export default function MetricCard({ value, label, className = "" }: MetricCardProps) {
  return (
    <div className={`metric-summary-card glass-panel ${className}`} title={String(value)}>
      <span className="metric-summary-value" style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {value}
      </span>
      <span className="metric-summary-label">{label}</span>
    </div>
  );
}
