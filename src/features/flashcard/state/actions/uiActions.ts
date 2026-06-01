import type { FlashcardStore } from "../FlashcardStore";
import type { Toast } from "../../data/types";

export interface UiActions {
  goBackFromSubView(): void;
  addToast(message: string, type?: Toast["type"]): void;
  removeToast(id: number): void;
  showToast(id: number): void;
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
    const id = Date.now() + Math.random();
    store.toasts.push({ id, message, type, show: false });
    store.commit();
    setTimeout(() => store.removeToast(id), 3000);
  },
  removeToast(id: number): void {
    const toast = store.toasts.find((t) => t.id === id);
    if (toast) {
      toast.show = false;
      store.commit();
      setTimeout(() => {
        store.toasts = store.toasts.filter((t) => t.id !== id);
        store.commit();
      }, 500);
    }
  },
  // トーストの表示フラグを次フレームで立てる（x-init の $nextTick 相当）
  showToast(id: number): void {
    const toast = store.toasts.find((t) => t.id === id);
    if (toast && !toast.show) {
      toast.show = true;
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
    store.dialog.show = false;
    store.commit();
  },
  cancelDialog(): void {
    store.dialog.show = false;
    store.commit();
  },
});
