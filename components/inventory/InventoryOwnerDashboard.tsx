import Link from "next/link";
import { AlertTriangle, ArrowRight, PackagePlus } from "lucide-react";
import { formatRupiah } from "@/lib/format-rupiah";
import type { OwnerDashboardOverview } from "@/lib/inventory-overview";
import { InventoryStatusBadge } from "./InventoryStatusBadge";

function formatQty(n: number) {
  return n.toLocaleString("id-ID");
}

function lokasiChips(saldo: Record<string, number>) {
  return Object.entries(saldo)
    .filter(([k]) => k !== "total")
    .filter(([, v]) => v !== 0)
    .map(([k, v]) => ({ kode: k, qty: v }));
}

export function InventoryOwnerDashboard({
  dashboard,
  canManageData
}: {
  dashboard: OwnerDashboardOverview;
  canManageData: boolean;
}) {
  const { totalNilaiStok, statusCounts, nilaiPerLokasi, kritisTop, anomaliCount } = dashboard;
  const maxNilai = Math.max(1, ...nilaiPerLokasi.map((l) => Math.abs(l.nilai)));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-2xl bg-navy-900 p-5 text-white shadow-lg shadow-navy-900/25 sm:col-span-2 lg:col-span-2">
          <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gold-400/15" />
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Total nilai stok</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-gold-100 lg:text-4xl">
            {formatRupiah(totalNilaiStok)}
          </p>
          <p className="mt-2 text-xs text-slate-400">Seluruh lokasi · qty × harga satuan pakai</p>
        </div>

        {(
          [
            { label: "Perlu beli", value: statusCounts.beli, tone: "bg-[#883224]" },
            { label: "Waspada", value: statusCounts.waspada, tone: "bg-[#D9A441] text-[#1F1F1F]" },
            { label: "Aman", value: statusCounts.aman, tone: "bg-[#6F7F3A] text-white" }
          ] as const
        ).map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className={`mb-3 inline-block h-1 w-8 rounded-full ${kpi.tone.split(" ")[0]}`} />
            <p className="text-xs font-medium text-slate-500">{kpi.label}</p>
            <p className="mt-1 text-3xl font-black text-navy-900">{kpi.value}</p>
            <p className="mt-0.5 text-[10px] text-slate-400">item distok</p>
          </div>
        ))}
      </div>

      {anomaliCount > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 to-white px-4 py-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
            <AlertTriangle className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-bold text-rose-900">{anomaliCount} saldo negatif</p>
            <p className="mt-0.5 text-rose-800">
              Periksa opname awal atau barang masuk di lokasi terkait.
            </p>
          </div>
          {canManageData && (
            <Link
              href="/inventory/data"
              className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-rose-800 hover:underline"
            >
              Perbaiki
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          )}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-3">
          <h3 className="text-sm font-bold text-navy-900">Nilai per lokasi</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {nilaiPerLokasi.map((loc) => {
              const width = Math.min(100, (Math.abs(loc.nilai) / maxNilai) * 100);
              const neg = loc.nilai < 0;
              const isGdg = loc.kode === "GDG";
              return (
                <div
                  key={loc.kode}
                  className={`rounded-xl border p-3 ${
                    isGdg ? "border-navy-200 bg-navy-50/50" : "border-slate-100 bg-[#FBF8F0]/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        className={`inline-block rounded-md px-1.5 py-0.5 font-mono text-[10px] font-extrabold ${
                          isGdg ? "bg-navy-800 text-white" : "bg-[#883224] text-white"
                        }`}
                      >
                        {loc.kode}
                      </span>
                      <p className="mt-1.5 text-xs font-semibold text-slate-700">{loc.nama}</p>
                    </div>
                    <p
                      className={`text-right font-mono text-sm font-bold ${
                        neg ? "text-rose-700" : "text-navy-900"
                      }`}
                    >
                      {formatRupiah(loc.nilai)}
                    </p>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                    <div
                      className={`h-full rounded-full transition-all ${neg ? "bg-rose-500" : isGdg ? "bg-navy-700" : "bg-[#6F7F3A]"}`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-navy-900">Perlu tindakan</h3>
            {canManageData && (
              <Link
                href="/inventory/data/barang-masuk"
                className="inline-flex items-center gap-1 rounded-lg bg-[#883224]/10 px-2 py-1 text-[10px] font-bold text-[#883224] hover:bg-[#883224]/15"
              >
                <PackagePlus className="h-3 w-3" aria-hidden />
                Barang masuk
              </Link>
            )}
          </div>
          {kritisTop.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <span className="text-2xl">✓</span>
              <p className="mt-2 text-sm font-semibold text-[#6F7F3A]">Semua aman</p>
            </div>
          ) : (
            <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
              {kritisTop.map((row) => {
                const chips = lokasiChips(row.saldo);
                return (
                  <div
                    key={row.bahan.kodeBahan}
                    className="rounded-xl border border-slate-100 bg-[#FBF8F0]/40 px-3 py-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-navy-900">
                          {row.bahan.namaBaku}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Total {formatQty(row.saldo.total)} {row.bahan.satuanPakai} · min{" "}
                          {formatQty(row.bahan.stokMinimum)}
                        </p>
                      </div>
                      <InventoryStatusBadge status={row.status} size="xs" />
                    </div>
                    {chips.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {chips.map((c) => (
                          <span
                            key={c.kode}
                            className="rounded-md bg-white px-1.5 py-0.5 font-mono text-[9px] font-bold text-slate-600 shadow-sm"
                          >
                            {c.kode}:{formatQty(c.qty)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
