"use client";

import type { MenuItem, MenuModifier, MenuItemVariant } from "@/lib/pos-kds-roadmap";
import { formatRp } from "@/lib/finance";
import { Modal } from "@/components/ui/Modal";
import { MenuItemThumb } from "@/components/library/MenuItemThumb";
import { addToCartWithModifiersAction } from "@/app/pos-actions";

export function ModifierDialog({
  item,
  outletId,
  shiftId,
  modifiers,
  variants,
  onClose
}: {
  item: MenuItem | null;
  outletId: string;
  shiftId: string;
  modifiers: MenuModifier[];
  variants: MenuItemVariant[];
  onClose: () => void;
}) {
  return (
    <Modal open={item !== null} onClose={onClose} title={item?.name ?? "Pilih Opsi"}>
      {item && (
        <>
          <div className="mb-4 flex items-center gap-3">
            <MenuItemThumb item={item} size="md" />
            <div>
              <p className="font-bold text-navy-900">{item.name}</p>
              <p className="text-sm text-gold-700">
                {variants.length ? "Pilih varian" : `Dasar ${formatRp(item.basePrice)}`}
              </p>
            </div>
          </div>

          <form action={addToCartWithModifiersAction} className="grid gap-4">
            <input type="hidden" name="outletId" value={outletId} />
            <input type="hidden" name="shiftId" value={shiftId} />
            <input type="hidden" name="menuItemId" value={item.id} />

            {variants.length > 0 && (
              <fieldset>
                <legend className="mb-2 text-sm font-bold uppercase text-slate-500">Varian *</legend>
                <ul className="space-y-2">
                  {variants.map((v) => (
                    <li key={v.id}>
                      <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 px-4 py-3 hover:border-gold-400">
                        <span className="flex items-center gap-3">
                          <input type="radio" name="variantId" value={v.id} required className="rounded-full" />
                          <span className="font-semibold text-navy-900">{v.name}</span>
                        </span>
                        <span className="text-sm font-bold text-gold-700">{formatRp(v.price)}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </fieldset>
            )}

            {modifiers.length > 0 && (
              <fieldset>
                <legend className="mb-2 text-sm font-bold uppercase text-slate-500">Add-on</legend>
                <ul className="space-y-2">
                  {modifiers.map((mod) => (
                    <li key={mod.id}>
                      <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 px-4 py-3 hover:border-gold-400">
                        <span className="flex items-center gap-3">
                          <input type="checkbox" name="modifierId" value={mod.id} className="rounded" />
                          <span className="font-semibold text-navy-900">{mod.name}</span>
                        </span>
                        {mod.priceDelta > 0 && (
                          <span className="text-sm font-bold text-gold-700">+{formatRp(mod.priceDelta)}</span>
                        )}
                      </label>
                    </li>
                  ))}
                </ul>
              </fieldset>
            )}

            <div>
              <label htmlFor="freeNote" className="nf3-field-label">
                Catatan item (opsional)
              </label>
              <input
                id="freeNote"
                name="freeNote"
                type="text"
                placeholder="Contoh: tanpa es, extra pedas"
                className="nf3-input mt-1"
              />
            </div>

            <button type="submit" className="pos-cta-primary">
              Tambah ke Keranjang
            </button>
          </form>
        </>
      )}
    </Modal>
  );
}
