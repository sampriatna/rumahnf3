import Link from "next/link";
import { AlertTriangle, Database, Truck } from "lucide-react";
import type { StatusStok } from "@/types/inventory";
import { StatCard } from "@/components/ui/StatCard";
import { InventoryStatusBadge } from "./InventoryStatusBadge";

export type StockAlertItem = {
  kodeBahan: string;
  namaBaku: string;
  status: StatusStok;
};

export function StockAlertCard({
  beliCount,
  waspadaCount,
  items,
  showTransferCta = true
}: {
  beliCount: number;
  waspadaCount: number;
  items: StockAlertItem[];
  showTransferCta?: boolean;
}) {
  if (beliCount === 0 && waspadaCount === 0) return null;

  return (
    <section className="mb-6 space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Perlu Beli" value={String(beliCount)} tone="warning" />
        <StatCard label="Waspada" value={String(waspadaCount)} tone="warning" />
        <StatCard
          label="Total Kritis"
          value={String(items.length)}
          hint="Dihitung dari saldo engine"
          tone="neutral"
        />
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-4 shadow-sm">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <AlertTriangle className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-amber-950">Stok kritis — perlu tindakan</p>
          <ul className="mt-2 space-y-1.5 text-sm text-amber-900/90">
            {items.slice(0, 6).map((item) => (
              <li key={item.kodeBahan} className="flex items-center justify-between gap-2">
                <span className="truncate font-semibold">{item.namaBaku}</span>
                <InventoryStatusBadge status={item.status} size="xs" />
              </li>
            ))}
            {items.length > 6 && (
              <li className="text-xs text-amber-800">+{items.length - 6} bahan lainnya</li>
            )}
          </ul>
          {showTransferCta && (
            <Link
              href="/inventory/transfers"
              className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-amber-900 hover:underline"
            >
              <Truck className="h-4 w-4" aria-hidden />
              Ajukan transfer dari gudang
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

export function InventoryDataSourceBanner({ sourceLabel }: { sourceLabel: string }) {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
      <Database className="mt-0.5 h-4 w-4 shrink-0 text-navy-700" aria-hidden />
      <div>
        <p className="font-bold text-navy-900">Saldo dari pergerakan stok</p>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
          Qty dihitung dari opname, barang masuk, transfer, pemakaian, dan waste — bukan edit manual.
          Sumber aktif: <span className="font-semibold text-navy-800">{sourceLabel}</span>.
        </p>
      </div>
    </div>
  );
}

export function InventoryMovementNotice() {
  return (
    <p className="mb-4 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-[11px] text-slate-500">
      Perubahan stok hanya lewat form mutasi (barang masuk, transfer, pemakaian, waste, opname).
      Tidak ada input &quot;edit stok langsung&quot;.
    </p>
  );
}
