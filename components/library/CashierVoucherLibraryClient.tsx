"use client";

import { useState } from "react";
import { Plus, Pencil, Ticket } from "lucide-react";
import type { CashierVoucher } from "@/lib/cashier-voucher-service";
import { formatRp } from "@/lib/finance";
import { Modal } from "@/components/ui/Modal";
import {
  saveCashierVoucherAction,
  toggleCashierVoucherAction,
  bootstrapCashierVouchersAction
} from "@/app/library/cashier-voucher-actions";

export function CashierVoucherLibraryClient({
  outletId,
  vouchers
}: {
  outletId: string;
  vouchers: CashierVoucher[];
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editVoucher, setEditVoucher] = useState<CashierVoucher | null>(null);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {vouchers.filter((v) => v.active).length} voucher aktif — kasir masukkan <strong>kode</strong> di checkout
        </p>
        <div className="flex flex-wrap gap-2">
          <form action={bootstrapCashierVouchersAction}>
            <input type="hidden" name="outletId" value={outletId} />
            <button type="submit" className="btn-secondary px-3 py-2 text-xs">
              Reset template
            </button>
          </form>
          <button
            type="button"
            onClick={() => {
              setEditVoucher(null);
              setModalOpen(true);
            }}
            className="btn-primary px-3 py-2 text-sm"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Voucher
          </button>
        </div>
      </div>

      {vouchers.length === 0 ? (
        <div className="panel p-8 text-center">
          <Ticket className="mx-auto mb-3 h-10 w-10 text-slate-300" aria-hidden />
          <p className="font-bold text-navy-900">Belum ada voucher kasir</p>
        </div>
      ) : (
        <ul className="panel divide-y divide-slate-100">
          {vouchers.map((v) => (
            <li key={v.id} className={`px-4 py-4 ${!v.active ? "opacity-50" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-black text-navy-900">{v.name}</p>
                  <p className="text-xs text-slate-500">
                    Kode <code className="rounded bg-slate-100 px-1 font-mono">{v.code}</code> ·{" "}
                    {v.voucherType === "fixed" ? formatRp(v.value) : `${v.value}%`}
                    {v.minSubtotal ? ` · min. ${formatRp(v.minSubtotal)}` : ""}
                    {v.usageLimit != null ? ` · terpakai ${v.usedCount}/${v.usageLimit}` : ` · terpakai ${v.usedCount}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditVoucher(v);
                      setModalOpen(true);
                    }}
                    className="btn-secondary px-2 py-1.5 text-xs"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                  </button>
                  <form action={toggleCashierVoucherAction}>
                    <input type="hidden" name="outletId" value={outletId} />
                    <input type="hidden" name="id" value={v.id} />
                    <input type="hidden" name="active" value={v.active ? "0" : "1"} />
                    <button type="submit" className="btn-secondary px-2 py-1.5 text-xs">
                      {v.active ? "Off" : "On"}
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editVoucher ? "Edit Voucher Kasir" : "Tambah Voucher Kasir"}
      >
        <form action={saveCashierVoucherAction} className="grid gap-4">
          <input type="hidden" name="outletId" value={outletId} />
          {editVoucher && <input type="hidden" name="id" value={editVoucher.id} />}
          <label className="block text-sm font-bold text-slate-700">
            Nama
            <input
              name="name"
              required
              defaultValue={editVoucher?.name ?? ""}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Kode (kasir ketik di checkout)
            <input
              name="code"
              required
              defaultValue={editVoucher?.code ?? ""}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono uppercase"
            />
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Tipe
            <select
              name="voucherType"
              defaultValue={editVoucher?.voucherType ?? "fixed"}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            >
              <option value="fixed">Potongan Rp (fixed)</option>
              <option value="percent">Diskon % order</option>
            </select>
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Nilai (Rp atau %)
            <input
              name="value"
              type="number"
              min={0}
              required
              defaultValue={editVoucher?.value ?? 0}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Min. subtotal (Rp, opsional)
            <input
              name="minSubtotal"
              type="number"
              min={0}
              defaultValue={editVoucher?.minSubtotal ?? ""}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Maks. diskon % (Rp, opsional)
            <input
              name="maxDiscount"
              type="number"
              min={0}
              defaultValue={editVoucher?.maxDiscount ?? ""}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Batas pemakaian (kosong = unlimited)
            <input
              name="usageLimit"
              type="number"
              min={1}
              defaultValue={editVoucher?.usageLimit ?? ""}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-bold text-slate-700">
              Berlaku dari
              <input
                name="validFrom"
                type="date"
                defaultValue={editVoucher?.validFrom?.slice(0, 10) ?? ""}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Sampai
              <input
                name="validTo"
                type="date"
                defaultValue={editVoucher?.validTo?.slice(0, 10) ?? ""}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
          </div>
          <button type="submit" className="btn-primary py-3">
            Simpan Voucher
          </button>
        </form>
      </Modal>
    </>
  );
}
