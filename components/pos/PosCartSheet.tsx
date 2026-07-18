"use client";

import { useState, type ReactNode } from "react";
import { ShoppingCart, X } from "lucide-react";

export function PosCartSheet({
  itemCount,
  cartTotalLabel,
  children
}: {
  itemCount: number;
  cartTotalLabel: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-2xl bg-navy-800 px-5 py-3.5 text-sm font-bold text-white shadow-lg ring-2 ring-gold-400/40 lg:hidden"
        aria-label="Buka keranjang"
      >
        <ShoppingCart className="h-5 w-5" aria-hidden />
        <span>Bayar</span>
        <span className="rounded-md bg-navy-950/40 px-2 py-0.5 text-xs">{itemCount}</span>
        <span className="text-gold-400">{cartTotalLabel}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40"
            aria-label="Tutup keranjang"
            onClick={() => setOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-surface p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-black text-navy-900">Keranjang & Bayar</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Tutup"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            {children}
          </div>
        </div>
      )}
    </>
  );
}
