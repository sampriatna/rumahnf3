"use client";

import { useState } from "react";
import { formatRp } from "@/lib/finance";
import { suggestCashAmounts, calcChange } from "@/lib/pos-cash";

type Props = {
  balance: number;
  outletId: string;
  orderId: string;
  payAction: (formData: FormData) => Promise<void>;
  /** When true, only show cash suggestions — primary Bayar lives in PaymentSummary. */
  hideSubmit?: boolean;
};

export function QuickCashPanel({
  balance,
  outletId,
  orderId,
  payAction,
  hideSubmit = false
}: Props) {
  const suggestions = suggestCashAmounts(balance);
  const [received, setReceived] = useState(suggestions[0] ?? balance);
  const change = calcChange(received, balance);

  return (
    <div className="rounded-xl border border-navy-100 bg-slate-50 p-4">
      <p className="mb-2 text-sm font-bold text-navy-900">Tunai Cepat</p>
      <div className="mb-3 grid grid-cols-3 gap-2">
        {suggestions.map((amt) => (
          <button
            key={amt}
            type="button"
            onClick={() => setReceived(amt)}
            className={`rounded-lg px-2 py-2.5 text-xs font-bold transition ${
              received === amt
                ? "bg-navy-800 text-white"
                : "bg-white text-navy-900 ring-1 ring-slate-200 hover:ring-gold-400"
            }`}
          >
            {formatRp(amt)}
          </button>
        ))}
      </div>
      <div className={`grid grid-cols-2 gap-3 text-sm ${hideSubmit ? "" : "mb-3"}`}>
        <div>
          <label className="text-xs font-bold text-slate-500">Uang diterima</label>
          <input
            type="number"
            min={balance}
            step={1000}
            value={received}
            onChange={(e) => setReceived(Number(e.target.value) || 0)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-base font-semibold"
          />
        </div>
        <div className="rounded-lg bg-emerald-50 p-3 text-center">
          <p className="text-xs text-slate-500">Kembalian</p>
          <p className="text-lg font-black text-emerald-800">{formatRp(change)}</p>
        </div>
      </div>
      {hideSubmit ? (
        <p className="mt-3 text-[11px] text-slate-500">
          Estimasi kembalian saja — tekan <span className="font-bold text-navy-800">Bayar</span> di
          bawah untuk menyelesaikan.
        </p>
      ) : (
        <form action={payAction}>
          <input type="hidden" name="outletId" value={outletId} />
          <input type="hidden" name="orderId" value={orderId} />
          <input type="hidden" name="method" value="cash" />
          <button
            type="submit"
            disabled={received < balance}
            className="btn-primary w-full py-3 text-sm disabled:opacity-50"
          >
            Bayar {formatRp(balance)}
          </button>
        </form>
      )}
    </div>
  );
}
