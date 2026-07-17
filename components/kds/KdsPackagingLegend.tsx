import { KDS_PACKAGING_LEGEND, KDS_ORDER_THEME } from "@/lib/kds-theme";

/** Legenda warna card = jenis kemasan (piring vs takeaway). */
export function KdsPackagingLegend() {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-navy-700 bg-navy-900/80 px-4 py-3">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Warna = kemasan:</span>
      {KDS_PACKAGING_LEGEND.map((row) => {
        const theme = KDS_ORDER_THEME[row.orderType];
        return (
          <div
            key={row.orderType}
            className="flex items-center gap-2 rounded-lg bg-navy-800/80 px-3 py-2"
            title={theme.packagingDetail}
          >
            <span className={`h-4 w-4 shrink-0 rounded ${row.color}`} aria-hidden />
            <span className="text-sm font-bold text-white">{row.short}</span>
          </div>
        );
      })}
      <span className="text-xs text-slate-500">Ungu = Takeaway (delivery WA)</span>
    </div>
  );
}
