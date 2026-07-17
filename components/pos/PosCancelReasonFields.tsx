"use client";

import { useState } from "react";
import type { CancelReason } from "@/lib/cancel-reason-service";

export function PosCancelReasonFields({
  reasons,
  notePlaceholder = "Catatan tambahan (opsional)"
}: {
  reasons: CancelReason[];
  notePlaceholder?: string;
}) {
  const [selectedId, setSelectedId] = useState(reasons[0]?.id ?? "");
  const selected = reasons.find((r) => r.id === selectedId);
  const needsNote = selected?.requiresNote ?? false;

  return (
    <>
      <label className="block text-sm font-bold text-slate-700">
        Alasan void
        <select
          name="reasonId"
          required
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
        >
          <option value="" disabled>
            Pilih alasan…
          </option>
          {reasons.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
              {r.scope !== "all" ? ` (${r.scope === "order" ? "order" : "item"})` : ""}
            </option>
          ))}
        </select>
      </label>
      <textarea
        name="reasonNote"
        required={needsNote}
        rows={needsNote ? 2 : 1}
        placeholder={needsNote ? "Jelaskan alasan (wajib untuk Lainnya)" : notePlaceholder}
        className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
      />
    </>
  );
}
