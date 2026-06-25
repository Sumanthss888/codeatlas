"use client";

import React from "react";
import type { RepoFile } from "@/app/page";
import WorkspaceOverlay from "../WorkspaceOverlay";
import WorkspaceOverlayHeader from "../WorkspaceOverlayHeader";
import WorkspaceOverlayBody from "../WorkspaceOverlayBody";
import ArchitectureMap from "@/components/ArchitectureMap";
import { Link } from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  files: RepoFile[];
  activeFile: string | null;
  onFileSelect: (filePath: string) => void;
  onSendMessage: (content: string) => void;
};

export default function ArchitectureOverlay({
  isOpen,
  onClose,
  files,
  activeFile,
  onFileSelect,
  onSendMessage,
}: Props) {
  return (
    <WorkspaceOverlay isOpen={isOpen} onClose={onClose} title="Architecture Map">
      <WorkspaceOverlayHeader
        title="Architecture Map"
        subtitle="Visual code dependency map and modular graph inspector"
        icon={<Link size={16} className="text-accent" />}
        onClose={onClose}
      />
      <WorkspaceOverlayBody>
        <ArchitectureMap
          files={files}
          activeFile={activeFile}
          onFileSelect={onFileSelect}
          onSendMessage={onSendMessage}
          isOverlay={true}
        />
      </WorkspaceOverlayBody>
    </WorkspaceOverlay>
  );
}
