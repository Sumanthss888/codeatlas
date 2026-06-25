"use client";

import React from "react";
import { useUserPresence } from "./UserPresenceProvider";
import { User } from "lucide-react";

type Props = {
  onClick?: (e: React.MouseEvent) => void;
  size?: number;
};

export default function Avatar({ onClick, size = 28 }: Props) {
  const { user, getInitials } = useUserPresence();
  const initials = getInitials();

  if (!user) {
    return (
      <button
        onClick={onClick}
        className="header-action-btn presence-trigger-btn logged-out"
        title="Sign in"
        aria-label="Sign in"
      >
        <User size={16} />
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="presence-trigger-btn logged-in"
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
      title={`Logged in as ${user.name}`}
      aria-label={`Logged in as ${user.name}`}
    >
      <span className="avatar-initials">{initials}</span>
    </button>
  );
}
