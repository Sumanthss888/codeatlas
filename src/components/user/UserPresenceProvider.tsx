"use client";

import React, { createContext, useContext, useState } from "react";

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

  const login = (name: string) => {};
  const logout = () => {};
  const getInitials = () => "";

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
