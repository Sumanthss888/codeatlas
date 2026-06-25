"use client";

import React from "react";
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

  if (!isOpen) return null;

  return (
    <div
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
