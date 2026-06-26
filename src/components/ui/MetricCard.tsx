import React from "react";

interface MetricCardProps {
  value: string | number;
  label: string;
  className?: string;
}

export default function MetricCard({ value, label, className = "" }: MetricCardProps) {
  return (
    <div className={`metric-summary-card glass-panel ${className}`}>
      <span className="metric-summary-value">{value}</span>
      <span className="metric-summary-label">{label}</span>
    </div>
  );
}
