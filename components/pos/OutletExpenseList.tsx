import { formatRp } from "@/lib/finance";
import type { OutletExpense } from "@/lib/pos-kds-roadmap";

export function OutletExpenseList({ expenses }: { expenses: OutletExpense[] }) {
  if (expenses.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        Belum ada pengeluaran hari ini. Ketuk + atau isi form untuk membuat catatan.
      </p>
    );
  }

  return (
    <ul className="max-h-64 space-y-2 overflow-y-auto text-sm">
      {expenses.map((e) => (
        <li key={e.id} className="rounded-xl border border-slate-100 bg-white px-3 py-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-bold text-navy-900">{e.category}</p>
              <p className="truncate text-slate-600">{e.note}</p>
              <p className="mt-0.5 text-[11px] text-slate-400">{e.createdBy}</p>
            </div>
            <span className="shrink-0 font-black text-rose-700">−{formatRp(e.amount)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
