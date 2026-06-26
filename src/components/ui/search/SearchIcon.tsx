import React from "react";
interface Props { size?: number; }
export default function SearchIcon({ size = 14 }: Props) {
  return <span>🔍</span>;
}
