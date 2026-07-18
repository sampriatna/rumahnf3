import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import type { PosOrder } from "@/lib/pos-kds-roadmap";

export function PosCheckoutShell({
  outletId,
  outletName,
  order,
  children
}: {
  outletId: string;
  outletName: string;
  order: PosOrder;
  children: ReactNode;
}) {
  return (
    <div className="pos-shell flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 flex shrink-0 items-center gap-4 border-b border-navy-100 bg-white/95 px-4 py-3 backdrop-blur">
        <Link
          href={`/pos?outlet=${outletId}`}
          className="pos-toolbar-btn"
          aria-label="Kembali ke kasir"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Kasir
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-black text-navy-900">Bayar Pesanan</h1>
          <p className="truncate text-xs text-slate-600">
            {outletName} · {order.orderNumber}
            {order.tableLabel && ` · Meja ${order.tableLabel}`}
          </p>
        </div>
        <span className="hidden rounded-lg bg-navy-800 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-gold-400 sm:inline">
          Checkout
        </span>
      </header>
      <main className="flex-1 px-4 py-4 lg:px-6 lg:py-5">{children}</main>
    </div>
  );
}
