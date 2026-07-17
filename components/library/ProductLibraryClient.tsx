"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Search } from "lucide-react";
import type { MenuCategory, MenuItem, MenuModifier, MenuItemVariant } from "@/lib/pos-kds-roadmap";
import { formatRp } from "@/lib/finance";
import { calcMenuMargin } from "@/lib/menu-margin";
import { Modal } from "@/components/ui/Modal";
import { MenuItemThumb } from "./MenuItemThumb";
import { ImageUpload } from "./ImageUpload";
import { ProductVariantFields } from "./ProductVariantFields";
import { saveMenuItemAction, toggleMenuItemAction, toggleSoldOutAction } from "@/app/library/actions";
import { EmojiPicker } from "./EmojiPicker";
import { isEmojiImage } from "@/lib/menu-images";

type ProductFormState = {
  id?: string;
  categoryId?: string;
  sku?: string;
  name: string;
  description?: string;
  imageUrl?: string;
  basePrice: number;
  costPrice?: number;
  soldOut?: boolean;
  defaultAreaId?: string;
  prepTimeMinutes?: number;
  active: boolean;
  modifierIds: string[];
  variants: MenuItemVariant[];
};

const EMPTY_FORM = (): ProductFormState => ({
  name: "",
  basePrice: 0,
  active: true,
  defaultAreaId: "bar",
  modifierIds: [],
  variants: []
});

function isUploadedUrl(url?: string) {
  return Boolean(url && !isEmojiImage(url) && (url.startsWith("http://") || url.startsWith("https://")));
}

export function ProductLibraryClient({
  outletId,
  categories,
  items,
  modifiers,
  itemModifierMap,
  itemVariantMap,
  stations,
  initialSearch = ""
}: {
  outletId: string;
  categories: MenuCategory[];
  items: MenuItem[];
  modifiers: MenuModifier[];
  itemModifierMap: Record<string, string[]>;
  itemVariantMap: Record<string, MenuItemVariant[]>;
  stations: Array<{ id: string; name: string }>;
  initialSearch?: string;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM());
  const [filterCat, setFilterCat] = useState<string>("all");
  const [search, setSearch] = useState(initialSearch);

  const filtered = useMemo(() => {
    let list = filterCat === "all" ? items : items.filter((i) => i.categoryId === filterCat);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.sku?.toLowerCase().includes(q) ?? false) ||
          (i.description?.toLowerCase().includes(q) ?? false)
      );
    }
    return list;
  }, [items, filterCat, search]);

  const openCreate = () => {
    setForm(EMPTY_FORM());
    setModalOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    setForm({
      id: item.id,
      categoryId: item.categoryId,
      sku: item.sku,
      name: item.name,
      description: item.description,
      imageUrl: item.imageUrl,
      basePrice: item.basePrice,
      costPrice: item.costPrice,
      soldOut: item.soldOut,
      defaultAreaId: item.defaultAreaId,
      prepTimeMinutes: item.prepTimeMinutes,
      active: item.active,
      modifierIds: itemModifierMap[item.id] ?? [],
      variants: itemVariantMap[item.id] ?? []
    });
    setModalOpen(true);
  };

  const catName = (id?: string) => categories.find((c) => c.id === id)?.name ?? "—";
  const activeModifiers = modifiers.filter((m) => m.active);
  const margin = calcMenuMargin(form.basePrice, form.costPrice);

  return (
    <>
      <form method="get" className="mb-4 flex gap-2">
        {outletId && <input type="hidden" name="outlet" value={outletId} />}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            name="q"
            defaultValue={initialSearch}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama produk / SKU..."
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm"
          />
        </div>
        <button type="submit" className="btn-secondary px-4 text-sm">
          Cari
        </button>
      </form>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-1 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilterCat("all")}
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
              filterCat === "all" ? "bg-navy-800 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            Semua ({items.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setFilterCat(c.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                filterCat === c.id ? "bg-navy-800 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
        <button type="button" onClick={openCreate} className="btn-primary px-4 py-2 text-sm">
          <Plus className="h-4 w-4" aria-hidden />
          Tambah Produk
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="panel p-8 text-center text-sm text-slate-500">
          {search ? "Tidak ada produk cocok dengan pencarian." : "Belum ada produk di kategori ini."}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const m = calcMenuMargin(item.basePrice, item.costPrice);
            return (
              <div
                key={item.id}
                className={`panel overflow-hidden ${!item.active ? "opacity-60" : item.soldOut ? "opacity-80" : ""}`}
              >
                <div className="flex gap-3 p-4">
                  <MenuItemThumb item={item} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-navy-900">{item.name}</p>
                    <p className="text-xs text-slate-500">{catName(item.categoryId)}</p>
                    <p className="mt-1 text-sm font-black text-gold-700">{formatRp(item.basePrice)}</p>
                    {item.costPrice != null && item.costPrice > 0 && (
                      <p className="text-[10px] text-slate-400">
                        Modal {formatRp(item.costPrice)}
                        {m != null && ` · margin ${m}%`}
                      </p>
                    )}
                    {(itemVariantMap[item.id]?.length ?? 0) > 0 && (
                      <p className="mt-0.5 text-[10px] font-bold text-slate-400">
                        {itemVariantMap[item.id].length} varian
                      </p>
                    )}
                    {(itemModifierMap[item.id]?.length ?? 0) > 0 && (
                      <p className="mt-0.5 text-[10px] font-bold text-slate-400">
                        {itemModifierMap[item.id].length} add-on
                      </p>
                    )}
                    {item.soldOut && (
                      <span className="mt-1 inline-block rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600">
                        Habis
                      </span>
                    )}
                    {!item.active && (
                      <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                        Nonaktif
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 border-t border-slate-100 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    className="btn-secondary flex-1 px-3 py-2 text-xs"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                    Edit
                  </button>
                  <form action={toggleSoldOutAction}>
                    <input type="hidden" name="outletId" value={outletId} />
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="soldOut" value={item.soldOut ? "0" : "1"} />
                    <button type="submit" className="btn-secondary px-3 py-2 text-xs">
                      {item.soldOut ? "Stok ada" : "Habis"}
                    </button>
                  </form>
                  <form action={toggleMenuItemAction} className="w-full">
                    <input type="hidden" name="outletId" value={outletId} />
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="active" value={item.active ? "0" : "1"} />
                    <button type="submit" className="btn-secondary w-full px-3 py-2 text-xs">
                      {item.active ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? "Edit Produk" : "Tambah Produk"}
        wide
      >
        <form key={form.id ?? "new"} action={saveMenuItemAction} className="grid gap-4">
          <input type="hidden" name="outletId" value={outletId} />
          {form.id && <input type="hidden" name="id" value={form.id} />}
          <input type="hidden" name="active" value={form.active ? "1" : "0"} />

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-slate-500">Nama Produk *</label>
              <input
                name="name"
                required
                defaultValue={form.name}
                placeholder="Contoh: Cappuccino"
                className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500">Harga Jual (Rp) *</label>
              <input
                name="basePrice"
                type="number"
                required
                min={0}
                defaultValue={form.basePrice}
                className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-slate-500">Harga Modal / COGS (Rp)</label>
              <input
                name="costPrice"
                type="number"
                min={0}
                defaultValue={form.costPrice ?? ""}
                placeholder="Opsional — untuk hitung margin"
                className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
              />
            </div>
            <div className="flex items-end">
              {margin != null && (
                <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
                  Margin kotor: {margin}%
                </p>
              )}
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-navy-900">
            <input
              type="checkbox"
              name="soldOut"
              value="1"
              defaultChecked={form.soldOut}
              className="rounded"
            />
            Tandai habis (sold out) — tampil di POS tapi tidak bisa dipesan
          </label>

          <ImageUpload
            outletId={outletId}
            itemId={form.id}
            itemName={form.name}
            categoryId={form.categoryId}
            defaultUrl={isUploadedUrl(form.imageUrl) ? form.imageUrl : undefined}
          />

          {!isUploadedUrl(form.imageUrl) && (
            <EmojiPicker
              name="imageUrl"
              defaultValue={isEmojiImage(form.imageUrl) ? form.imageUrl : `emoji:☕`}
            />
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-slate-500">Kategori</label>
              <select
                name="categoryId"
                defaultValue={form.categoryId ?? ""}
                className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
              >
                <option value="">— Tanpa kategori —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500">SKU / Kode</label>
              <input
                name="sku"
                defaultValue={form.sku ?? ""}
                placeholder="Opsional"
                className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
              />
            </div>
          </div>

          <ProductVariantFields initial={form.variants} />

          {activeModifiers.length > 0 && (
            <fieldset className="rounded-xl border border-slate-200 p-4">
              <legend className="px-1 text-xs font-bold uppercase text-slate-500">
                Add-on untuk produk ini
              </legend>
              <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                {activeModifiers.map((mod) => (
                  <li key={mod.id}>
                    <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-100 px-3 py-2 hover:border-gold-400">
                      <span className="flex items-center gap-2 text-sm font-semibold text-navy-900">
                        <input
                          type="checkbox"
                          name="modifierId"
                          value={mod.id}
                          defaultChecked={form.modifierIds.includes(mod.id)}
                          className="rounded"
                        />
                        {mod.name}
                      </span>
                      {mod.priceDelta > 0 && (
                        <span className="text-xs font-bold text-gold-700">+{formatRp(mod.priceDelta)}</span>
                      )}
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
          )}

          <div>
            <label className="text-xs font-bold text-slate-500">Deskripsi</label>
            <textarea
              name="description"
              rows={2}
              defaultValue={form.description ?? ""}
              placeholder="Bahan, alergen, catatan promo..."
              className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-slate-500">Station KDS</label>
              <select
                name="defaultAreaId"
                defaultValue={form.defaultAreaId ?? stations[0]?.id ?? "bar"}
                className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
              >
                {stations.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500">Estimasi (menit)</label>
              <input
                name="prepTimeMinutes"
                type="number"
                min={0}
                defaultValue={form.prepTimeMinutes ?? ""}
                className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2 border-t border-slate-100 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1 py-3">
              Batal
            </button>
            <button type="submit" className="btn-primary flex-1 py-3">
              Simpan Produk
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
