"use client";

import React, { useRef } from "react";
import { useUserPresence } from "./UserPresenceProvider";
import UsernameForm from "./UsernameForm";
import { Settings, LogOut, Shield } from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSettingsClick?: () => void;
};

export default function ProfileDropdown({ isOpen, onClose, onSettingsClick }: Props) {
  const { user, logout } = useUserPresence();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Focus trap Tab loop
  const handleDropdownKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      const focusable = dropdownRef.current?.querySelectorAll(
        'button, input, [tabindex="0"]'
      );
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0] as HTMLElement;
      const last = focusable[focusable.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          last.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      onKeyDown={handleDropdownKeyDown}
      className="profile-dropdown-panel glass-panel"
      role="dialog"
      aria-label="User Profile Dropdown"
    >
      {user ? (
        <div className="dropdown-logged-in-view">
          <div className="user-details-header">
            <div className="user-name-title">{user.name}</div>
            <div className="user-role-badge">
              <Shield size={10} className="badge-icon" />
              CodeAtlas Member
            </div>
          </div>
          <div className="dropdown-divider" />
          <div className="dropdown-menu-list">
            <button
              onClick={() => {
                if (onSettingsClick) onSettingsClick();
                onClose();
              }}
              className="dropdown-menu-item"
            >
              <Settings size={14} className="menu-icon" />
              Settings
            </button>
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="dropdown-menu-item signout"
            >
              <LogOut size={14} className="menu-icon" />
              Sign Out
            </button>
          </div>
        </div>
      ) : (
        <UsernameForm onSubmitSuccess={() => {}} />
      )}
    </div>
  );
}
