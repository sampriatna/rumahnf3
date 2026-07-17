"use client";

import { useState } from "react";
import { formatRp } from "@/lib/finance";

export function SplitEqualPanel({ total }: { total: number }) {
  const [people, setPeople] = useState(2);
  const perPerson = people > 0 ? Math.ceil(total / people) : total;

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Bagi rata</p>
      <div className="mt-2 flex items-center gap-3">
        <label className="text-sm text-slate-600">Jumlah orang</label>
        <input
          type="number"
          min={2}
          max={20}
          value={people}
          onChange={(e) => setPeople(Math.max(2, Number(e.target.value) || 2))}
          className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-center font-bold"
        />
      </div>
      <p className="mt-3 text-sm text-slate-600">
        Per orang:{" "}
        <span className="text-lg font-black text-navy-900">{formatRp(perPerson)}</span>
        {people > 1 && total % people !== 0 && (
          <span className="ml-1 text-xs text-slate-500">(dibulatkan ke atas)</span>
        )}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Helper kasir — gunakan multi payment untuk bayar per orang.
      </p>
    </div>
  );
}
