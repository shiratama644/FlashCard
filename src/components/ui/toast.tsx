"use client";

import type { Toast } from "@/features/flashcard/hooks/use-toast";

type ToastContainerProps = {
  toasts: Toast[];
};

export function ToastContainer({ toasts }: ToastContainerProps) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
          style={{
            opacity: toast.show ? 1 : 0,
            transform: toast.show ? "translateY(0)" : "translateY(-1rem)",
            transition: "all 0.3s ease",
          }}
        >
          <i
            className={`fa-solid ${
              toast.type === "error"
                ? "fa-circle-exclamation"
                : toast.type === "success"
                  ? "fa-circle-check"
                  : "fa-circle-info"
            }`}
          />
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
