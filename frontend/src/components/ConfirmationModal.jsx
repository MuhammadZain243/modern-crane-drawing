import { useEffect, useId, useRef } from "react";
import Button from "./Button.jsx";

export default function ConfirmationModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);
  const id = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function handleCancel(event) {
    event.preventDefault();
    if (!busy) onCancel();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      aria-modal="true"
      className="confirmation-modal m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl border border-line bg-surface p-0 text-ink shadow-2xl backdrop:bg-ink/45"
      onCancel={handleCancel}
    >
      <div className="p-6 sm:p-7">
        <span
          aria-hidden="true"
          className={`grid size-11 place-items-center rounded-2xl text-lg font-black ${
            destructive ? "bg-danger-tint text-danger" : "bg-brand-tint text-brand"
          }`}
        >
          {destructive ? "!" : "↗"}
        </span>
        <h2 id={`${id}-title`} className="mt-4 text-xl font-black tracking-tight">
          {title}
        </h2>
        <p id={`${id}-description`} className="mt-2 text-sm leading-6 text-ink-soft">
          {description}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={busy}
            autoFocus
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={destructive ? "danger" : "primary"}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Working…" : confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
