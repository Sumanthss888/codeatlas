"use client";

import React from "react";
import { motion } from "framer-motion";

type Props = {
  onClose: () => void;
};

export default function WorkspaceOverlayBackdrop({ onClose }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      onClick={onClose}
      className="workspace-overlay-backdrop"
      aria-hidden="true"
    />
  );
}
