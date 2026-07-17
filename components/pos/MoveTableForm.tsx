"use client";

import { useRef, useState } from "react";
import { moveOrderTableAction } from "@/app/pos-actions";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";

export function MoveTableForm({
  orderId,
  outletId,
  currentTable,
  emptyTables
}: {
  orderId: string;
  outletId: string;
  currentTable: string;
  emptyTables: string[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [target, setTarget] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  function requestMove() {
    const next = target.trim();
    if (!next) return;
    if (next.toLowerCase() === currentTable.trim().toLowerCase()) return;
    setConfirmOpen(true);
  }

  return (
    <div className="mt-2 border-t border-slate-200/80 pt-2">
      <form ref={formRef} action={moveOrderTableAction} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="outletId" value={outletId} />
        <input type="hidden" name="orderId" value={orderId} />
        <input type="hidden" name="newTableLabel" value={target.trim()} />
        <label className="min-w-[8rem] flex-1 text-[10px] font-bold uppercase text-slate-400">
          Pindah meja
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="nf3-select mt-1 w-full text-xs font-semibold"
          >
            <option value="">Pilih meja kosong…</option>
            {emptyTables.map((t) => (
              <option key={t} value={t}>
                Meja {t}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={!target.trim()}
          onClick={requestMove}
          className="btn-secondary px-3 py-2 text-xs disabled:opacity-50"
        >
          Pindah
        </button>
      </form>

      <ConfirmationDialog
        open={confirmOpen}
        title="Pindah bill ke meja lain?"
        message={
          <>
            Bill di <strong>Meja {currentTable}</strong> akan dipindah ke{" "}
            <strong>Meja {target.trim()}</strong>. Pastikan meja tujuan benar sebelum melanjutkan.
          </>
        }
        confirmLabel="Ya, pindahkan"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          formRef.current?.requestSubmit();
        }}
      />
    </div>
  );
}
