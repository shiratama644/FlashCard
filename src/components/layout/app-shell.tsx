"use client";

import { useFlashcard } from "@/features/flashcard/context/flashcard-context";
import { ToastContainer } from "@/components/ui/toast";
import { DialogOverlay } from "@/components/ui/dialog-overlay";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { toasts, dialog, confirmDialog, cancelDialog, isLoaded } = useFlashcard();

  if (!isLoaded) {
    return (
      <div className="app-wrapper">
        <div className="app-container">
          <div className="flex items-center justify-center h-full">
            <div className="loader" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      <div className="app-container">
        {children}
      </div>
      <ToastContainer toasts={toasts} />
      <DialogOverlay dialog={dialog} onConfirm={confirmDialog} onCancel={cancelDialog} />
    </div>
  );
}
