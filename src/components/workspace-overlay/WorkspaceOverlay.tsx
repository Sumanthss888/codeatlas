"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion, Variants } from "framer-motion";
import WorkspaceOverlayBackdrop from "./WorkspaceOverlayBackdrop";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
};

export default function WorkspaceOverlay({ isOpen, onClose, children, title }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const shouldReduceMotion = useReducedMotion();

  // Save focus and restore it on unmount
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement;
      
      // Auto-focus panel header close button or first input
      setTimeout(() => {
        const focusable = panelRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable && focusable.length > 0) {
          (focusable[0] as HTMLElement).focus();
        } else {
          panelRef.current?.focus();
        }
      }, 50);

      // Disable background scrolling
      document.body.style.overflow = "hidden";
    }

    return () => {
      if (!isOpen) {
        document.body.style.overflow = "";
        if (previouslyFocusedRef.current) {
          previouslyFocusedRef.current.focus();
        }
      }
    };
  }, [isOpen]);

  // Handle escape key listener & click outside
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Trap focus tab loops
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab") return;

    const focusable = panelRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
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
  };

  // Motion specifications
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const panelVariants: Variants = shouldReduceMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        hidden: { opacity: 0, y: 16, scale: 0.98 },
        visible: { 
          opacity: 1, 
          y: 0, 
          scale: 1,
          transition: {
            duration: 0.35,
            ease: [0.16, 1, 0.3, 1], // premium out-quint curve
            when: "beforeChildren",
            staggerChildren: 0.05
          }
        },
        exit: {
          opacity: 0,
          y: 12,
          scale: 0.99,
          transition: {
            duration: 0.25,
            ease: "easeIn"
          }
        }
      };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="workspace-overlay-root"
          role="none"
        >
          {/* Reusable Backdrop */}
          <WorkspaceOverlayBackdrop onClose={onClose} />

          {/* Floating Panel wrapper */}
          <div className="workspace-overlay-container">
            <motion.div
              ref={panelRef}
              onKeyDown={handleKeyDown}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={panelVariants}
              tabIndex={-1}
              className="workspace-overlay-panel glass-panel"
              role="dialog"
              aria-modal="true"
              aria-label={title}
            >
              {children}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
