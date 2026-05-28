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
      className="modal-overlay"
      style={{ zIndex: 100 }}
      onClick={(e) => {
        if (e.target === e.currentTarget && dialog.type === "alert") onCancel();
      }}
    >
      <div className="modal-content" style={{ maxWidth: "24rem" }}>
        <h2
          className={`modal-title ${dialog.type === "confirm" ? "text-red-400" : ""}`}
        >
          {dialog.title}
        </h2>
        <div className="modal-body" style={{ marginBottom: "1.5rem" }}>
          <p
            style={{
              color: "rgba(255,255,255,0.8)",
              whiteSpace: "pre-wrap",
              fontSize: "0.875rem",
            }}
          >
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
