"use client";
import React, { createContext, useContext, useState, useCallback } from "react";
type ToastType = "success" | "error" | "info";
type ToastMessage = {
  id: string;
  text: string;
  type: ToastType;
};
type ToastContextType = {
  showToast: (text: string, type?: ToastType) => void;
};
const ToastContext = createContext<ToastContextType | undefined>(undefined);
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const showToast = useCallback((text: string, type: ToastType = "success") => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);
  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-popup ${toast.type}`}>
            <span className="toast-text">{toast.text}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
