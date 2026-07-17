"use client";

import type { ReactNode } from "react";

export function ConfirmationDialog({
  open,
  title,
  message,
  confirmLabel = "Ya, lanjutkan",
  cancelLabel = "Batal",
  onConfirm,
  onCancel,
  tone = "default"
}: {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  tone?: "default" | "danger";
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/45"
        aria-label="Tutup dialog"
        onClick={onCancel}
      />
      <div
        role="alertdialog"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-desc"
        className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
      >
        <h2 id="confirm-title" className="text-lg font-black text-navy-900">
          {title}
        </h2>
        <div id="confirm-desc" className="mt-2 text-sm text-slate-600">
          {message}
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onCancel} className="btn-secondary px-4 py-2 text-sm">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={
              tone === "danger"
                ? "inline-flex items-center justify-center rounded-lg bg-rose-700 px-4 py-2 text-sm font-bold text-white hover:bg-rose-800"
                : "btn-primary px-4 py-2 text-sm"
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
