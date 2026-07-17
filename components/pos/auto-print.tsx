"use client";

import { useEffect } from "react";

/** Trigger window.print() saat halaman struk dibuka (auto-print kasir). */
export function AutoPrintOnLoad({ active }: { active: boolean }) {
  useEffect(() => {
    if (!active) return;
    const id = window.setTimeout(() => window.print(), 400);
    return () => window.clearTimeout(id);
  }, [active]);
  return null;
}

/** Buka struk di tab baru & cetak otomatis setelah bayar. */
export function AutoPrintReceiptTrigger({
  orderId,
  outletId,
  enabled,
  copies
}: {
  orderId: string;
  outletId: string;
  enabled: boolean;
  copies?: 1 | 2;
}) {
  useEffect(() => {
    if (!enabled) return;
    const n = copies === 2 ? 2 : 1;
    const open = () => {
      window.open(
        `/pos/receipt/${orderId}?outlet=${outletId}&autoprint=1`,
        "_blank",
        "width=420,height=640"
      );
    };
    open();
    if (n === 2) {
      const id = window.setTimeout(open, 1200);
      return () => window.clearTimeout(id);
    }
  }, [orderId, outletId, enabled, copies]);
  return null;
}
