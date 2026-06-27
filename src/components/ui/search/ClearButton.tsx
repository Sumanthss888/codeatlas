import React from "react";
import { X } from "lucide-react";
interface Props { onClick: (e: React.MouseEvent) => void; }
export default function ClearButton({ onClick }: Props) {
  return <button onClick={onClick} aria-label="Clear"><X size={12} /></button>;
}
