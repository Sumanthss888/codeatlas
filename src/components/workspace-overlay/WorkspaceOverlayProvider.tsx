"use client";

import React, { createContext, useContext, useState } from "react";

type OverlayType = "overview" | "architecture" | null;

type WorkspaceOverlayContextType = {
  activeOverlay: OverlayType;
  openOverlay: (type: OverlayType) => void;
  closeOverlay: () => void;
  toggleOverlay: (type: OverlayType) => void;
};

const WorkspaceOverlayContext = createContext<WorkspaceOverlayContextType | undefined>(undefined);

export function WorkspaceOverlayProvider({ children }: { children: React.ReactNode }) {
  const [activeOverlay, setActiveOverlay] = useState<OverlayType>(null);

  const openOverlay = (type: OverlayType) => {
    setActiveOverlay(type);
  };

  const closeOverlay = () => {
    setActiveOverlay(null);
  };

  const toggleOverlay = (type: OverlayType) => {
    setActiveOverlay((prev) => (prev === type ? null : type));
  };

  return (
    <WorkspaceOverlayContext.Provider value={{ activeOverlay, openOverlay, closeOverlay, toggleOverlay }}>
      {children}
    </WorkspaceOverlayContext.Provider>
  );
}

export function useWorkspaceOverlay() {
  const context = useContext(WorkspaceOverlayContext);
  if (context === undefined) {
    throw new Error("useWorkspaceOverlay must be used within a WorkspaceOverlayProvider");
  }
  return context;
}
