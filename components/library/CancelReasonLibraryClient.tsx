"use client";

import { useState } from "react";
import { Plus, Pencil, Ban } from "lucide-react";
import type { CancelReason, CancelReasonScope } from "@/lib/cancel-reason-service";
import { Modal } from "@/components/ui/Modal";
import {
  saveCancelReasonAction,
  toggleCancelReasonAction,
  bootstrapCancelReasonsAction
} from "@/app/library/cancel-reason-actions";

const SCOPE_LABEL: Record<CancelReasonScope, string> = {
  all: "Order & item",
  order: "Void order saja",
  item: "Void item saja"
};

export function CancelReasonLibraryClient({
  outletId,
  reasons
}: {
  outletId: string;
  reasons: CancelReason[];
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editReason, setEditReason] = useState<CancelReason | null>(null);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {reasons.filter((r) => r.active).length} alasan aktif — dipakai saat void order/item di POS
        </p>
        <div className="flex flex-wrap gap-2">
          <form action={bootstrapCancelReasonsAction}>
            <input type="hidden" name="outletId" value={outletId} />
            <button type="submit" className="btn-secondary px-3 py-2 text-xs">
              Reset template
            </button>
          </form>
          <button
            type="button"
            onClick={() => {
              setEditReason(null);
              setModalOpen(true);
            }}
            className="btn-primary px-3 py-2 text-sm"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Alasan
          </button>
        </div>
      </div>

      {reasons.length === 0 ? (
        <div className="panel p-8 text-center">
          <Ban className="mx-auto mb-3 h-10 w-10 text-slate-300" aria-hidden />
          <p className="font-bold text-navy-900">Belum ada alasan void</p>
        </div>
      ) : (
        <ul className="panel divide-y divide-slate-100">
          {reasons.map((reason) => (
            <li key={reason.id} className={`px-4 py-4 ${!reason.active ? "opacity-50" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-black text-navy-900">{reason.name}</p>
                  <p className="text-xs text-slate-500">
                    {SCOPE_LABEL[reason.scope]}
                    {reason.requiresNote ? " · wajib catatan" : ""} · urutan {reason.sortOrder}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditReason(reason);
                      setModalOpen(true);
                    }}
                    className="btn-secondary px-2 py-1.5 text-xs"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                  </button>
                  <form action={toggleCancelReasonAction}>
                    <input type="hidden" name="outletId" value={outletId} />
                    <input type="hidden" name="id" value={reason.id} />
                    <input type="hidden" name="active" value={reason.active ? "0" : "1"} />
                    <button type="submit" className="btn-secondary px-2 py-1.5 text-xs">
                      {reason.active ? "Off" : "On"}
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editReason ? "Edit Alasan" : "Tambah Alasan"}>
        <form action={saveCancelReasonAction} className="grid gap-4">
          <input type="hidden" name="outletId" value={outletId} />
          {editReason && <input type="hidden" name="id" value={editReason.id} />}
          <label className="block text-sm font-bold text-slate-700">
            Nama alasan
            <input
              name="name"
              required
              defaultValue={editReason?.name ?? ""}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Cakupan
            <select
              name="scope"
              defaultValue={editReason?.scope ?? "all"}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            >
              {(Object.keys(SCOPE_LABEL) as CancelReasonScope[]).map((s) => (
                <option key={s} value={s}>
                  {SCOPE_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Urutan
            <input
              name="sortOrder"
              type="number"
              min={1}
              defaultValue={editReason?.sortOrder ?? reasons.length + 1}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <input
              type="checkbox"
              name="requiresNote"
              defaultChecked={editReason?.requiresNote ?? false}
              className="rounded"
            />
            Wajib isi catatan tambahan (mis. &quot;Lainnya&quot;)
          </label>
          <button type="submit" className="btn-primary py-3">
            Simpan Alasan
          </button>
        </form>
      </Modal>
    </>
  );
}
