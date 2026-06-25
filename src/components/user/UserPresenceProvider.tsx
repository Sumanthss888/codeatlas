"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type User = {
  name: string;
};

type UserPresenceContextType = {
  user: User | null;
  login: (name: string) => void;
  logout: () => void;
  getInitials: () => string;
};

const UserPresenceContext = createContext<UserPresenceContextType | undefined>(undefined);

export function UserPresenceProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("codeatlas_user");
      if (stored) {
        setUser({ name: stored });
      }
    } catch (e) {
      console.error("Failed to read user presence from localStorage", e);
    }
    setIsInitialized(true);
  }, []);

  const login = (name: string) => {
    const trimmed = name.trim();
    if (trimmed.length >= 2 && trimmed.length <= 24) {
      setUser({ name: trimmed });
      try {
        localStorage.setItem("codeatlas_user", trimmed);
      } catch (e) {
        console.error("Failed to save user presence to localStorage", e);
      }
    }
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem("codeatlas_user");
    } catch (e) {
      console.error("Failed to remove user presence from localStorage", e);
    }
  };

  const getInitials = () => {
    if (!user) return "";
    const parts = user.name.split(" ").filter(Boolean);
    if (parts.length === 0) return "";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <UserPresenceContext.Provider value={{ user, login, logout, getInitials }}>
      {children}
    </UserPresenceContext.Provider>
  );
}

export function useUserPresence() {
  const context = useContext(UserPresenceContext);
  if (context === undefined) {
    throw new Error("useUserPresence must be used within a UserPresenceProvider");
  }
  return context;
}
