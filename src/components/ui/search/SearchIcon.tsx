import React from "react";
interface Props { size?: number; className?: string; }
export default function SearchIcon({ size = 14, className }: Props) {
  return <span className={className}>🔍</span>;
}
