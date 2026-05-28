"use client";

import { useCallback, useState } from "react";

export type ToastType = "info" | "success" | "error";

export type Toast = {
  id: number;
  message: string;
  type: ToastType;
  show: boolean;
};

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, show: true }]);
    setTimeout(() => {
      setToasts((prev) => {
        const toast = prev.find((t) => t.id === id);
        if (!toast) return prev;
        return prev.map((t) => (t.id === id ? { ...t, show: false } : t));
      });
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 500);
    }, 3000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, show: false } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 500);
  }, []);

  return { toasts, addToast, removeToast };
}
