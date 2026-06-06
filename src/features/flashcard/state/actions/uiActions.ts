import type { FlashcardStore } from "../FlashcardStore";
import type { Toast } from "../../data/types";

export interface UiActions {
  goBackFromSubView(): void;
  addToast(message: string, type?: Toast["type"]): void;
  removeToast(id: string): void;
  showToast(id: string): void;
  showConfirm(title: string, message: string, onConfirm: () => void, confirmText?: string, cancelText?: string): void;
  showAlert(title: string, message: string): void;
  confirmDialog(): void;
  cancelDialog(): void;
}

export const createUiActions = (store: FlashcardStore): UiActions => ({
  goBackFromSubView(): void {
    if (store.currentView === "cardList") store.currentView = "study";
    else store.goHome();
  },
  addToast(message: string, type: Toast["type"] = "info"): void {
    const id = crypto.randomUUID();
    store.toasts = [...store.toasts, { id, message, type, show: false }];
    store.commit();
    setTimeout(() => store.removeToast(id), 3000);
  },
  removeToast(id: string): void {
    const toast = store.toasts.find((t) => t.id === id);
    if (toast) {
      store.toasts = store.toasts.map((t) => (t.id === id ? { ...t, show: false } : t));
      store.commit();
      setTimeout(() => {
        store.toasts = store.toasts.filter((t) => t.id !== id);
        store.commit();
      }, 500);
    }
  },
  // トーストの表示フラグを次フレームで立てる（x-init の $nextTick 相当）
  showToast(id: string): void {
    const toast = store.toasts.find((t) => t.id === id);
    if (toast && !toast.show) {
      store.toasts = store.toasts.map((t) => (t.id === id ? { ...t, show: true } : t));
      store.commit();
    }
  },
  showConfirm(title: string, message: string, onConfirm: () => void, confirmText = "削除", cancelText = "キャンセル"): void {
    store.dialog = { show: true, type: "confirm", title, message, confirmText, cancelText, onConfirm };
    store.commit();
  },
  showAlert(title: string, message: string): void {
    store.dialog = { show: true, type: "alert", title, message, confirmText: "OK", cancelText: "", onConfirm: null };
    store.commit();
  },
  confirmDialog(): void {
    if (store.dialog.onConfirm) store.dialog.onConfirm();
    store.dialog = { ...store.dialog, show: false };
    store.commit();
  },
  cancelDialog(): void {
    store.dialog = { ...store.dialog, show: false };
    store.commit();
  },
});
