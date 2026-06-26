import React from "react";
import { Search } from "lucide-react";

interface SearchIconProps {
  size?: number;
  className?: string;
}

export default function SearchIcon({ size = 14, className }: SearchIconProps) {
  return <Search size={size} className={className} />;
}
