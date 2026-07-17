import { topUpMemberDepositAction } from "@/app/pos-actions";

export function PosMemberDepositTopUpForm({
  outletId,
  shiftId,
  customerId
}: {
  outletId: string;
  shiftId?: string;
  customerId: string;
}) {
  return (
    <form action={topUpMemberDepositAction} className="grid gap-3 border-t border-slate-100 pt-4">
      <input type="hidden" name="outletId" value={outletId} />
      <input type="hidden" name="customerId" value={customerId} />
      {shiftId && <input type="hidden" name="shiftId" value={shiftId} />}
      <div>
        <label htmlFor="depositAmount" className="nf3-field-label">
          Nominal Top-up (Rp)
        </label>
        <input
          id="depositAmount"
          name="amount"
          type="number"
          required
          min={1000}
          step={1000}
          placeholder="0"
          className="nf3-input mt-1 py-3 text-base"
        />
      </div>
      <div>
        <label htmlFor="depositNote" className="nf3-field-label">
          Catatan (opsional)
        </label>
        <input
          id="depositNote"
          name="note"
          type="text"
          placeholder="Mis. top-up tunai di kasir"
          className="nf3-input mt-1 font-semibold"
        />
      </div>
      <button type="submit" className="pos-cta-primary text-sm">
        Simpan Top-up
      </button>
    </form>
  );
}
