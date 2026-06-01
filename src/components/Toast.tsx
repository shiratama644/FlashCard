"use client";

// トーストコンテナ（index.html の .toast-container 相当）
import { useEffect } from "react";
import { useStore } from "@/store/StoreProvider";
import type { Toast as ToastType } from "@/lib/types";
import { Transition } from "./Transition";

function ToastItem({ toast }: { toast: ToastType }) {
  const store = useStore();
  // x-init="$nextTick(() => toast.show = true)" 相当
  useEffect(() => {
    requestAnimationFrame(() => store.showToast(toast.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const icon = toast.type === "error" ? "fa-circle-exclamation" : toast.type === "success" ? "fa-circle-check" : "fa-circle-info";

  return (
    <Transition
      show={toast.show}
      className={`toast toast-${toast.type}`}
      enter="toast-enter-active"
      enterStart="toast-enter-start"
      enterEnd="toast-enter-end"
      leave="toast-leave-active"
      leaveStart="toast-leave-start"
      leaveEnd="toast-leave-end"
    >
      <i className={`fa-solid ${icon}`}></i>
      <span>{toast.message}</span>
    </Transition>
  );
}

export function ToastContainer() {
  const store = useStore();
  return (
    <div className="toast-container">
      {store.toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
