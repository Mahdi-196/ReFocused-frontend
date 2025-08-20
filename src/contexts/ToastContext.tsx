"use client";

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: string;
  message: string;
  type: ToastType;
  durationMs: number;
};

interface ToastContextValue {
  showToast: (message: string, options?: { type?: ToastType; durationMs?: number }) => void;
  showSuccess: (message: string, durationMs?: number) => void;
  showError: (message: string, durationMs?: number) => void;
  showInfo: (message: string, durationMs?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Record<string, NodeJS.Timeout>>({});

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const timer = timersRef.current[id];
    if (timer) {
      clearTimeout(timer);
      delete timersRef.current[id];
    }
  }, []);

  const showToast = useCallback((message: string, options?: { type?: ToastType; durationMs?: number }) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const toast: Toast = {
      id,
      message,
      type: options?.type ?? "info",
      durationMs: options?.durationMs ?? 2500,
    };
    setToasts(prev => [...prev, toast]);
    timersRef.current[id] = setTimeout(() => removeToast(id), toast.durationMs);
  }, [removeToast]);

  const showSuccess = useCallback((message: string, durationMs = 2500) => showToast(message, { type: "success", durationMs }), [showToast]);
  const showError = useCallback((message: string, durationMs = 3000) => showToast(message, { type: "error", durationMs }), [showToast]);
  const showInfo = useCallback((message: string, durationMs = 2500) => showToast(message, { type: "info", durationMs }), [showToast]);

  const value = useMemo<ToastContextValue>(() => ({ showToast, showSuccess, showError, showInfo }), [showToast, showSuccess, showError, showInfo]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast viewport */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] space-y-2 w-[calc(100%-2rem)] max-w-md">
        {toasts.map(toast => (
          <div
            key={toast.id}
            role="status"
            className={
              `flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
                toast.type === "success" ? "bg-green-600 text-white border-green-500/60" :
                toast.type === "error" ? "bg-red-600 text-white border-red-500/60" :
                "bg-gray-800 text-gray-100 border-gray-700/60"
              }`
            }
          >
            <span className="flex-1 text-sm">{toast.message}</span>
            <button
              aria-label="Dismiss"
              onClick={() => removeToast(toast.id)}
              className="text-white/80 hover:text-white focus:outline-none"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}


