import Link from "next/link";
import { formatRp } from "@/lib/finance";
import type { PosShift } from "@/lib/pos-kds-roadmap";
import type { PosOrder } from "@/lib/pos-kds-roadmap";
import { StatCard } from "@/components/ui/StatCard";
import { labelFor, orderStatusLabel } from "@/lib/ui-labels";
import { OpStatusBadge } from "@/components/ui/OpStatusBadge";

type DrawerSummary = {
  payIn: number;
  payOut: number;
  outletExpensesTotal: number;
  totalKasAkhir: number;
  expectedCash: number;
  entries: Array<{ id: string; type: string; amount: number; reason: string; createdBy: string }>;
};

export function ShiftSummaryCard({
  variant,
  shift,
  outletName,
  outletId,
  completedCount,
  openCount,
  heldCount,
  drawer,
  orders = []
}: {
  variant: "close" | "drawer";
  shift: PosShift;
  outletName?: string;
  outletId: string;
  completedCount?: number;
  openCount?: number;
  heldCount?: number;
  drawer?: DrawerSummary | null;
  orders?: PosOrder[];
}) {
  const wallets = [
    { label: "Tunai", value: shift.systemCashTotal ?? 0 },
    { label: "QRIS", value: shift.systemQrisTotal ?? 0 },
    { label: "Online", value: shift.systemOnlineTotal ?? 0 },
    { label: "Total Penjualan", value: shift.systemGrandTotal ?? 0 }
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black text-navy-900">
          {variant === "close" ? "Tutup Shift" : "Laci Kas"}
        </h1>
        <p className="text-sm text-slate-600">
          {outletName} · Shift {shift.shiftLabel}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {wallets.map((w) => (
          <StatCard key={w.label} label={w.label} value={formatRp(w.value)} />
        ))}
      </div>

      {variant === "drawer" && drawer && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Modal Awal" value={formatRp(shift.openingFloat ?? 0)} tone="neutral" />
            <StatCard label="Penjualan Tunai" value={formatRp(shift.systemCashTotal ?? 0)} />
            <StatCard
              label="Pengeluaran Outlet"
              value={formatRp(drawer.outletExpensesTotal)}
              tone="warning"
            />
            <StatCard
              label="Pay In"
              value={formatRp(drawer.payIn)}
              tone="success"
              hint="Uang masuk laci"
            />
            <StatCard
              label="Pay Out"
              value={formatRp(drawer.payOut)}
              tone="warning"
              hint="Uang keluar laci"
            />
          </div>
          <div className="pos-total-box text-center">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Total Kas Akhir
            </p>
            <p className="mt-1 text-3xl font-black text-navy-900">
              {formatRp(drawer.totalKasAkhir)}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Kas awal + tunai − pengeluaran outlet. Perkiraan laci fisik:{" "}
              {formatRp(drawer.expectedCash)}
            </p>
          </div>
        </>
      )}

      {variant === "close" && (
        <>
          <p className="text-sm text-slate-600">
            <span className="font-bold text-navy-800">{completedCount ?? 0}</span> pesanan selesai
            {openCount != null && openCount > 0 && (
              <span className="font-semibold text-amber-800">
                {" "}
                · {openCount} belum selesai
                {(heldCount ?? 0) > 0 && ` (${heldCount} ditahan)`}
              </span>
            )}
          </p>

          {drawer && (
            <div className="pos-total-box">
              <p className="text-xs font-bold uppercase text-slate-500">Total Kas Akhir</p>
              <p className="mt-1 text-2xl font-black text-navy-900">{formatRp(drawer.totalKasAkhir)}</p>
              <p className="mt-2 text-xs text-slate-500">
                Kas awal + tunai − pengeluaran outlet. Perkiraan laci fisik:{" "}
                {formatRp(drawer.expectedCash)}
              </p>
              <Link
                href={`/pos/expenses?outlet=${outletId}&shift=${shift.id}`}
                className="mt-1 inline-block text-xs font-bold text-navy-700 underline"
              >
                Pengeluaran outlet →
              </Link>
              <Link
                href={`/pos/drawer?outlet=${outletId}&shift=${shift.id}`}
                className="mt-1 ml-3 inline-block text-xs font-bold text-navy-700 underline"
              >
                Pay in/out →
              </Link>
            </div>
          )}

          {orders.length > 0 && (
            <ul className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-slate-100 bg-white p-3 text-sm">
              {orders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-2 border-b border-slate-50 pb-1">
                  <span className="font-semibold text-navy-900">{o.orderNumber}</span>
                  <span className="flex items-center gap-2 text-slate-600">
                    {formatRp(o.total)}
                    <OpStatusBadge tone={o.status === "void" ? "danger" : "muted"}>
                      {labelFor(orderStatusLabel, o.status, o.status)}
                    </OpStatusBadge>
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            Setelah tutup shift, sistem membuat <strong>Form Setoran Kasir</strong> untuk verifikasi
            leader. Kas sudah tercatat per pesanan — approval tidak menghitung ulang omzet.
          </div>
        </>
      )}
    </div>
  );
}
