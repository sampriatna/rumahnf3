import { formatRp } from "@/lib/finance";
import type { MenuPromoReport } from "@/lib/ops-menu-promo";
import { sendMenuPromoWaAction } from "@/app/ops-actions";

const ACTION_STYLE: Record<
  MenuPromoReport["insights"][number]["action"],
  { badge: string; label: string }
> = {
  star: { badge: "bg-emerald-100 text-emerald-900", label: "Star" },
  promote: { badge: "bg-amber-100 text-amber-900", label: "Promo" },
  push: { badge: "bg-blue-100 text-blue-900", label: "Push" },
  hold: { badge: "bg-slate-100 text-slate-700", label: "Hold" }
};

export function MenuPromoPanel({
  report,
  showActions = true
}: {
  report: MenuPromoReport | null;
  showActions?: boolean;
}) {
  if (!report) return null;

  return (
    <section className="panel p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
            Rekomendasi Menu · POS 7 Hari
          </h2>
          <p className="text-sm text-slate-600">
            {report.outletName} · {report.periodLabel}
          </p>
        </div>
      </div>

      {report.insights.length === 0 ? (
        <p className="text-sm text-slate-500">
          Belum cukup data penjualan per item. Butuh transaksi POS dengan item line.
        </p>
      ) : (
        <div className="space-y-3">
          {report.insights.map((item) => {
            const style = ACTION_STYLE[item.action];
            return (
              <div key={item.menuItemId} className="rounded-xl bg-slate-50 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-navy-900">{item.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${style.badge}`}>
                    {style.label}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {item.qty7d} porsi (7 hari) · minggu lalu {item.qtyPrev7d} ·{" "}
                  {formatRp(item.revenue7d)}
                </p>
                <p className="mt-1 text-slate-700">{item.reason}</p>
                <p className="mt-1 font-medium text-navy-800">→ {item.suggestion}</p>
              </div>
            );
          })}
        </div>
      )}

      {showActions && report.insights.length > 0 && (
        <form action={sendMenuPromoWaAction} className="mt-4">
          <input type="hidden" name="outletId" value={report.outletId} />
          <button type="submit" className="btn-primary px-4 py-2 text-sm">
            Kirim rekomendasi menu via WA
          </button>
        </form>
      )}
    </section>
  );
}
