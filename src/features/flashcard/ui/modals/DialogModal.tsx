"use client";

// カスタムダイアログ（Alert/Confirm）index.html 581-595
import { useStore } from "@/features/flashcard/state/StoreProvider";
import { Transition } from "../Transition";

export function DialogModal() {
  const store = useStore();
  const { dialog } = store;

  return (
    <Transition
      show={dialog.show}
      className="modal-overlay modal-overlay-top"
      enter="modal-enter-active"
      enterStart="modal-enter-from"
      enterEnd="modal-enter-to"
      leave="modal-leave-active"
      leaveStart="modal-enter-to"
      leaveEnd="modal-leave-to"
      onClick={(e) => {
        if (e.target === e.currentTarget && dialog.type === "alert") store.cancelDialog();
      }}
    >
      <div className="modal-content modal-content-sm">
        <h2 className={`modal-title ${dialog.type === "confirm" ? "text-red-400" : ""}`}>{dialog.title}</h2>
        <div className="modal-body modal-body-spaced">
          <p className="dialog-message">{dialog.message}</p>
        </div>
        <div className="modal-footer">
          {dialog.type === "confirm" && (
            <button onClick={() => store.cancelDialog()} className="btn-secondary">
              {dialog.cancelText}
            </button>
          )}
          <button onClick={() => store.confirmDialog()} className={dialog.type === "confirm" ? "btn-danger" : "btn-primary"}>
            {dialog.confirmText}
          </button>
        </div>
      </div>
    </Transition>
  );
}
