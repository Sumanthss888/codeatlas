import React from "react";
interface Props { onClick: (e: React.MouseEvent) => void; }
export default function ClearButton({ onClick }: Props) {
  return <button onClick={onClick} aria-label="Clear">x</button>;
}
