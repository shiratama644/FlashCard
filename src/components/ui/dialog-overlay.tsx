"use client";

type DialogState = {
  show: boolean;
  type: "alert" | "confirm";
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
};

type DialogOverlayProps = {
  dialog: DialogState;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DialogOverlay({ dialog, onConfirm, onCancel }: DialogOverlayProps) {
  if (!dialog.show) return null;

  return (
    <div
      className="modal-overlay modal-overlay-top"
      onClick={(e) => {
        if (e.target === e.currentTarget && dialog.type === "alert") onCancel();
      }}
    >
      <div className="modal-content modal-content-sm">
        <h2
          className={`modal-title ${dialog.type === "confirm" ? "text-red-400" : ""}`}
        >
          {dialog.title}
        </h2>
        <div className="modal-body modal-body-spaced">
          <p className="dialog-message">
            {dialog.message}
          </p>
        </div>
        <div className="modal-footer">
          {dialog.type === "confirm" && (
            <button className="btn-secondary" onClick={onCancel}>
              {dialog.cancelText}
            </button>
          )}
          <button
            className={dialog.type === "confirm" ? "btn-danger" : "btn-primary"}
            onClick={onConfirm}
          >
            {dialog.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
