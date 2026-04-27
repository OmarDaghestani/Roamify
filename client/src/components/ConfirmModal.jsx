import React, { useEffect, useId, useRef } from "react";

/**
 * Native `<dialog>` confirm. Parent sets `open`; closing clears via `onClose`.
 */
export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  confirmBusy = false,
  onConfirm,
  onClose,
}) {
  const ref = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open) {
      if (!el.open) el.showModal();
    } else if (el.open) {
      el.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`confirm-dialog ${variant === "danger" ? "confirm-dialog--danger" : ""}`}
      aria-labelledby={titleId}
      onClose={() => onClose?.()}
    >
      <div className="confirm-dialog-inner">
        <h2 id={titleId} className="confirm-dialog-title">
          {title}
        </h2>
        {description ? <p className="confirm-dialog-desc muted">{description}</p> : null}
        <div className="confirm-dialog-actions">
          <button type="button" className="btn secondary" onClick={() => ref.current?.close()} disabled={confirmBusy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn ${variant === "danger" ? "danger" : "primary"}`}
            disabled={confirmBusy}
            onClick={async () => {
              try {
                await onConfirm?.();
                ref.current?.close();
              } catch {
                /* keep dialog open; parent shows error */
              }
            }}
          >
            {confirmBusy ? "…" : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
