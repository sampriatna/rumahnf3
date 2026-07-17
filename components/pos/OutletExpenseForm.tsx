import { OUTLET_EXPENSE_CATEGORIES } from "@/lib/pos-outlet-expense";
import { addOutletExpenseAction } from "@/app/pos-actions";

export function OutletExpenseForm({
  outletId,
  shiftId,
  returnTo = "expenses"
}: {
  outletId: string;
  shiftId: string;
  returnTo?: "expenses" | "shift";
}) {
  return (
    <form action={addOutletExpenseAction} className="grid gap-3 border-t border-slate-100 pt-4">
      <input type="hidden" name="outletId" value={outletId} />
      <input type="hidden" name="shiftId" value={shiftId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <div>
        <label htmlFor="expenseCategory" className="nf3-field-label">
          Kategori
        </label>
        <select id="expenseCategory" name="category" required className="nf3-select mt-1 font-semibold">
          <option value="">Pilih kategori</option>
          {OUTLET_EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="expenseAmount" className="nf3-field-label">
          Nominal (Rp)
        </label>
        <input
          id="expenseAmount"
          name="amount"
          type="number"
          required
          min={1}
          step={1000}
          placeholder="0"
          className="nf3-input mt-1 py-3 text-base"
        />
      </div>
      <div>
        <label htmlFor="expenseNote" className="nf3-field-label">
          Catatan
        </label>
        <input
          id="expenseNote"
          name="note"
          type="text"
          required
          placeholder="Mis. beli es batu, gas elpiji"
          className="nf3-input mt-1 font-semibold"
        />
      </div>
      <button type="submit" className="pos-cta-primary text-sm">
        Simpan Pengeluaran
      </button>
    </form>
  );
}
