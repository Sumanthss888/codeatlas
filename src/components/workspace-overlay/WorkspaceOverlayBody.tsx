"use client";

import React from "react";

type Props = {
  children: React.ReactNode;
};

export default function WorkspaceOverlayBody({ children }: Props) {
  return <div className="workspace-overlay-body">{children}</div>;
}
