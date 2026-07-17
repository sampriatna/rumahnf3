"use client";

import { useState } from "react";
import { Plus, Pencil, Landmark } from "lucide-react";
import type { ChartOfAccount, CoaAccountType } from "@/lib/coa-service";
import { Modal } from "@/components/ui/Modal";
import { saveCoaAction, toggleCoaAction, bootstrapCoaAction } from "@/app/library/coa-actions";

const TYPE_LABEL: Record<CoaAccountType, string> = {
  asset: "Aset",
  liability: "Kewajiban",
  equity: "Ekuitas",
  revenue: "Pendapatan",
  expense: "Beban"
};

export function CoaLibraryClient({ accounts }: { accounts: ChartOfAccount[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<ChartOfAccount | null>(null);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Landmark className="h-5 w-5 text-navy-700" aria-hidden />
          <p className="text-sm text-slate-600">{accounts.filter((a) => a.active).length} akun aktif</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={bootstrapCoaAction}>
            <button type="submit" className="btn-secondary px-3 py-2 text-xs">
              Reset template
            </button>
          </form>
          <button
            type="button"
            onClick={() => {
              setEditAccount(null);
              setModalOpen(true);
            }}
            className="btn-primary px-3 py-2 text-sm"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Akun
          </button>
        </div>
      </div>

      <ul className="panel divide-y divide-slate-100">
        {accounts.map((acc) => (
          <li key={acc.id} className={`px-4 py-4 ${!acc.active ? "opacity-50" : ""}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-black text-navy-900">
                  {acc.code} · {acc.name}
                </p>
                <p className="text-xs text-slate-500">
                  {TYPE_LABEL[acc.accountType]} · ID: {acc.id}
                  {acc.trackBalance ? " · Lacak saldo" : ""}
                  {!acc.ready ? " · Pending cair" : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditAccount(acc);
                    setModalOpen(true);
                  }}
                  className="btn-secondary px-2 py-1.5 text-xs"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden />
                </button>
                <form action={toggleCoaAction}>
                  <input type="hidden" name="id" value={acc.id} />
                  <input type="hidden" name="active" value={acc.active ? "0" : "1"} />
                  <button type="submit" className="btn-secondary px-2 py-1.5 text-xs">
                    {acc.active ? "Off" : "On"}
                  </button>
                </form>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editAccount ? "Edit Akun" : "Tambah Akun"}
      >
        <form action={saveCoaAction} className="grid gap-4">
          {editAccount && <input type="hidden" name="id" value={editAccount.id} />}
          <label className="block text-sm font-bold text-slate-700">
            Kode akun
            <input
              name="code"
              required
              defaultValue={editAccount?.code ?? ""}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Nama
            <input
              name="name"
              required
              defaultValue={editAccount?.name ?? ""}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Tipe
            <select
              name="accountType"
              defaultValue={editAccount?.accountType ?? "asset"}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            >
              {Object.entries(TYPE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <input type="hidden" name="trackBalance" value="0" />
            <input
              type="checkbox"
              name="trackBalance"
              value="1"
              defaultChecked={editAccount?.trackBalance ?? true}
              className="rounded"
            />
            Lacak saldo (kas tersedia)
          </label>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <input type="hidden" name="ready" value="0" />
            <input
              type="checkbox"
              name="ready"
              value="1"
              defaultChecked={editAccount?.ready ?? true}
              className="rounded"
            />
            Siap dipakai (bukan pending cair)
          </label>
          <button type="submit" className="btn-primary w-full py-3">
            Simpan
          </button>
        </form>
      </Modal>
    </>
  );
}
