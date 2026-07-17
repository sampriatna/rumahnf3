"use client";

import { useState } from "react";
import { Plus, Pencil, Percent } from "lucide-react";
import type { PosPromotion } from "@/lib/promotion-service";
import { Modal } from "@/components/ui/Modal";
import {
  savePromotionAction,
  togglePromotionAction,
  bootstrapPromotionsAction
} from "@/app/library/promotion-actions";

const TYPE_LABEL: Record<PosPromotion["promoType"], string> = {
  order_percent: "% off order",
  order_fixed: "Potongan order (Rp)",
  item_percent: "% off item terpilih"
};

export function PromotionLibraryClient({
  outletId,
  promotions
}: {
  outletId: string;
  promotions: PosPromotion[];
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editPromo, setEditPromo] = useState<PosPromotion | null>(null);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {promotions.filter((p) => p.active).length} promosi aktif — dipakai kasir di <strong>Checkout</strong>
        </p>
        <div className="flex flex-wrap gap-2">
          <form action={bootstrapPromotionsAction}>
            <input type="hidden" name="outletId" value={outletId} />
            <button type="submit" className="btn-secondary px-3 py-2 text-xs">
              Reset template
            </button>
          </form>
          <button
            type="button"
            onClick={() => { setEditPromo(null); setModalOpen(true); }}
            className="btn-primary px-3 py-2 text-sm"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Promosi
          </button>
        </div>
      </div>

      {promotions.length === 0 ? (
        <div className="panel p-8 text-center">
          <Percent className="mx-auto mb-3 h-10 w-10 text-slate-300" aria-hidden />
          <p className="font-bold text-navy-900">Belum ada promosi</p>
        </div>
      ) : (
        <ul className="panel divide-y divide-slate-100">
          {promotions.map((promo) => (
            <li key={promo.id} className={`px-4 py-4 ${!promo.active ? "opacity-50" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-black text-navy-900">{promo.name}</p>
                  <p className="text-xs text-slate-500">
                    {TYPE_LABEL[promo.promoType]} · nilai {promo.value}
                    {promo.code && ` · kode ${promo.code}`}
                  </p>
                  {promo.minSubtotal ? (
                    <p className="text-xs text-slate-400">Min. subtotal Rp {promo.minSubtotal.toLocaleString("id-ID")}</p>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setEditPromo(promo); setModalOpen(true); }}
                    className="btn-secondary px-2 py-1.5 text-xs"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                  </button>
                  <form action={togglePromotionAction}>
                    <input type="hidden" name="outletId" value={outletId} />
                    <input type="hidden" name="id" value={promo.id} />
                    <input type="hidden" name="active" value={promo.active ? "0" : "1"} />
                    <button type="submit" className="btn-secondary px-2 py-1.5 text-xs">
                      {promo.active ? "Off" : "On"}
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editPromo ? "Edit Promosi" : "Tambah Promosi"}>
        <form action={savePromotionAction} className="grid gap-4">
          <input type="hidden" name="outletId" value={outletId} />
          {editPromo && <input type="hidden" name="id" value={editPromo.id} />}
          <label className="block text-sm font-bold text-slate-700">
            Nama
            <input name="name" required defaultValue={editPromo?.name ?? ""} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Kode (opsional)
            <input name="code" defaultValue={editPromo?.code ?? ""} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono uppercase" />
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Tipe
            <select name="promoType" defaultValue={editPromo?.promoType ?? "order_percent"} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2">
              <option value="order_percent">Diskon % seluruh order</option>
              <option value="order_fixed">Potongan Rp order</option>
              <option value="item_percent">Diskon % item tertentu</option>
            </select>
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Nilai (% atau Rp)
            <input name="value" type="number" min={0} required defaultValue={editPromo?.value ?? 0} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Item target (ID dipisah koma, untuk item_percent)
            <input
              name="targetMenuItemIds"
              defaultValue={editPromo?.targetMenuItemIds?.join(", ") ?? ""}
              placeholder="mi-latte, mi-teh-tarik"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs"
            />
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Min. subtotal (Rp, opsional)
            <input name="minSubtotal" type="number" min={0} defaultValue={editPromo?.minSubtotal ?? ""} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-bold text-slate-700">
              Berlaku dari
              <input name="validFrom" type="date" defaultValue={editPromo?.validFrom?.slice(0, 10) ?? ""} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Sampai
              <input name="validTo" type="date" defaultValue={editPromo?.validTo?.slice(0, 10) ?? ""} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
            </label>
          </div>
          <button type="submit" className="btn-primary py-3">
            Simpan Promosi
          </button>
        </form>
      </Modal>
    </>
  );
}
