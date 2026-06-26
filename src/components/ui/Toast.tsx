"use client";
import React, { createContext, useContext, useState } from "react";
type ToastType = "success" | "error" | "info";
type ToastContextType = {
  showToast: (text: string, type?: ToastType) => void;
};
const ToastContext = createContext<ToastContextType | undefined>(undefined);
export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
