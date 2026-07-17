import { cashDrawerEntryAction } from "@/app/pos-actions";
import { formatRp } from "@/lib/finance";

export function CashDrawerForm({
  outletId,
  shiftId
}: {
  outletId: string;
  shiftId: string;
}) {
  return (
    <form
      action={cashDrawerEntryAction}
      className="grid gap-4 border-t border-slate-100 pt-5"
    >
      <input type="hidden" name="outletId" value={outletId} />
      <input type="hidden" name="shiftId" value={shiftId} />
      <div>
        <label htmlFor="drawerType" className="nf3-field-label">
          Jenis Catatan
        </label>
        <select id="drawerType" name="type" className="nf3-select mt-1 py-3 text-sm font-semibold">
          <option value="pay_in">Pay In — uang masuk laci</option>
          <option value="pay_out">Pay Out — uang keluar laci</option>
        </select>
      </div>
      <div>
        <label htmlFor="drawerAmount" className="nf3-field-label">
          Nominal (Rp)
        </label>
        <input
          id="drawerAmount"
          name="amount"
          type="number"
          required
          min={1}
          placeholder="Contoh: 50000"
          className="nf3-input mt-1 py-3 text-base"
        />
      </div>
      <div>
        <label htmlFor="drawerReason" className="nf3-field-label">
          Alasan
        </label>
        <input
          id="drawerReason"
          name="reason"
          type="text"
          required
          placeholder="Mis. isi kembalian, beli es batu"
          className="nf3-input mt-1 py-3 text-sm"
        />
      </div>
      <button type="submit" className="pos-cta-primary py-3 text-sm">
        Simpan Catatan
      </button>
    </form>
  );
}

export function CashDrawerEntryList({
  entries
}: {
  entries: Array<{
    id: string;
    type: string;
    amount: number;
    reason: string;
    createdBy: string;
  }>;
}) {
  if (entries.length === 0) return null;

  return (
    <div className="mt-6">
      <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
        Riwayat shift ini
      </h2>
      <ul className="max-h-52 space-y-2 overflow-y-auto">
        {entries.map((e) => (
          <li key={e.id} className="pos-cart-line justify-between gap-3">
            <span className="min-w-0">
              <span
                className={`text-xs font-bold uppercase ${
                  e.type === "pay_in" ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                {e.type === "pay_in" ? "Masuk" : "Keluar"}
              </span>
              <span className="mt-0.5 block truncate text-sm font-semibold text-navy-900">
                {e.reason}
              </span>
              <span className="text-[11px] text-slate-400">{e.createdBy}</span>
            </span>
            <span className="shrink-0 text-sm font-black text-navy-800">{formatRp(e.amount)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
