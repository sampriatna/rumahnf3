"use client";

import { useEffect } from "react";

export function SaveToast({
  message,
  onDismiss
}: {
  message: string | null;
  onDismiss?: () => void;
}) {
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => onDismiss?.(), 2500);
    return () => window.clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg"
    >
      {message}
    </div>
  );
}
