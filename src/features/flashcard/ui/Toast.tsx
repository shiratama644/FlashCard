"use client";

// トーストコンテナ（index.html の .toast-container 相当）
import { useEffect } from "react";
import { useStoreInstance, useStoreView } from "@/features/flashcard/state/StoreProvider";
import type { Toast as ToastType } from "@/features/flashcard/data/types";
import type { FlashcardStore } from "@/features/flashcard/state/FlashcardStore";
import { Transition } from "./Transition";

// トーストが表示する全要素（id / 表示状態 / 種別 / 文言）のシグネチャ。
// 文言にユーザー由来の文字が入りうるため、区切り文字の衝突を防ぐべく JSON でエンコードする。
// いずれかが変われば文字列も変わり、コンテナだけが選択的に再描画される。
function toastSignature(store: FlashcardStore): string {
  return JSON.stringify(store.toasts.map((t) => [t.id, t.show, t.type, t.message]));
}

function ToastItem({ toast }: { toast: ToastType }) {
  // 表示内容は props の toast から読む。再描画は親（ToastContainer）が担うため購読しない。
  const store = useStoreInstance();
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
  const store = useStoreView(toastSignature);
  return (
    <div className="toast-container">
      {store.toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
