"use client";

import { useCallback, useRef, useState } from "react";

type DialogState = {
  show: boolean;
  type: "alert" | "confirm";
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
};

const initialDialog: DialogState = {
  show: false,
  type: "alert",
  title: "",
  message: "",
  confirmText: "OK",
  cancelText: "キャンセル",
};

export function useDialog() {
  const [dialog, setDialog] = useState<DialogState>(initialDialog);
  const onConfirmRef = useRef<(() => void) | null>(null);

  const showConfirm = useCallback(
    (
      title: string,
      message: string,
      onConfirm: () => void,
      confirmText = "削除",
      cancelText = "キャンセル",
    ) => {
      onConfirmRef.current = onConfirm;
      setDialog({ show: true, type: "confirm", title, message, confirmText, cancelText });
    },
    [],
  );

  const showAlert = useCallback((title: string, message: string) => {
    onConfirmRef.current = null;
    setDialog({ show: true, type: "alert", title, message, confirmText: "OK", cancelText: "" });
  }, []);

  const confirmDialog = useCallback(() => {
    onConfirmRef.current?.();
    setDialog((prev) => ({ ...prev, show: false }));
  }, []);

  const cancelDialog = useCallback(() => {
    setDialog((prev) => ({ ...prev, show: false }));
  }, []);

  return { dialog, showConfirm, showAlert, confirmDialog, cancelDialog };
}
