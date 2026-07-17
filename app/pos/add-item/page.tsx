import Link from "next/link";
import { redirect } from "next/navigation";
import { OUTLETS } from "@/lib/mock-data";
import { formatRp } from "@/lib/finance";
import { isPosOutlet } from "@/lib/pos-seed";
import {
  getOpenShift,
  getModifiersForItem
} from "@/lib/pos-service";
import { getMenuItemForOutlet } from "@/lib/branch-menu-service";
import { listNotesCategories } from "@/lib/notes-category-service";
import { addToCartWithModifiersAction } from "../../pos-actions";
import { requirePosSession } from "@/lib/pos-auth";
import { UI_FLAGS } from "@/lib/ui-flags";
import { MenuItemThumb } from "@/components/library/MenuItemThumb";

export default function PosAddItemPage({
  searchParams
}: {
  searchParams: { outlet?: string; item?: string; shift?: string };
}) {
  const session = requirePosSession();

  const outletId =
    searchParams.outlet && (session.role === "owner" || session.role === "admin")
      ? searchParams.outlet
      : session.outletId ?? searchParams.outlet;

  if (!outletId || !isPosOutlet(outletId)) redirect("/pos");

  const shift = getOpenShift(outletId);
  if (!shift) redirect(`/pos?outlet=${outletId}`);

  const itemId = searchParams.item ?? "";
  if (UI_FLAGS.posLayoutV2) {
    const q = new URLSearchParams({ outlet: outletId });
    if (itemId) q.set("item", itemId);
    redirect(`/pos?${q.toString()}`);
  }

  const menu = getMenuItemForOutlet(itemId, outletId);
  if (!menu) {
    redirect(`/pos?outlet=${outletId}`);
  }

  const modifiers = getModifiersForItem(itemId);
  const noteCategories = listNotesCategories(outletId);
  const notesByGroup = noteCategories.reduce<Record<string, typeof noteCategories>>((acc, cat) => {
    const g = cat.group ?? "Lainnya";
    (acc[g] ??= []).push(cat);
    return acc;
  }, {});
  const outlet = OUTLETS.find((o) => o.id === outletId)!;

  return (
    <main className="mx-auto max-w-md px-5 py-8">
      <Link href={`/pos?outlet=${outletId}`} className="text-sm font-bold text-navy-700">
        ← Kembali ke POS
      </Link>

      <div className="mt-4 panel p-6">
        <div className="flex items-center gap-3">
          <MenuItemThumb item={menu} size="lg" />
          <div>
            <h1 className="text-xl font-black text-navy-900">{menu.name}</h1>
            <p className="text-sm text-slate-600">{outlet.name} · dasar {formatRp(menu.basePrice)}</p>
            {menu.description && (
              <p className="mt-1 text-xs text-slate-500">{menu.description}</p>
            )}
          </div>
        </div>

        <form action={addToCartWithModifiersAction} className="mt-6 grid gap-4">
          <input type="hidden" name="outletId" value={outletId} />
          <input type="hidden" name="shiftId" value={shift.id} />
          <input type="hidden" name="menuItemId" value={menu.id} />

          {modifiers.length > 0 ? (
            <fieldset>
              <legend className="mb-2 text-sm font-bold uppercase text-slate-500">
                Pilih add-on
              </legend>
              <ul className="space-y-2">
                {modifiers.map((mod) => (
                  <li key={mod.id}>
                    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 px-4 py-3 hover:border-gold-400">
                      <span className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          name="modifierId"
                          value={mod.id}
                          className="rounded"
                        />
                        <span className="font-semibold text-navy-900">{mod.name}</span>
                      </span>
                      {mod.priceDelta > 0 && (
                        <span className="text-sm font-bold text-gold-700">
                          +{formatRp(mod.priceDelta)}
                        </span>
                      )}
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
          ) : (
            <p className="text-sm text-slate-500">Tidak ada modifier untuk item ini.</p>
          )}

          {noteCategories.length > 0 && (
            <fieldset>
              <legend className="mb-2 text-sm font-bold uppercase text-slate-500">
                Catatan dapur
              </legend>
              <div className="grid gap-3">
                {Object.entries(notesByGroup).map(([group, cats]) => (
                  <div key={group}>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">{group}</p>
                    <ul className="space-y-2">
                      {cats.map((cat) => (
                        <li key={cat.id}>
                          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-2.5 hover:border-gold-400">
                            <input type="checkbox" name="noteName" value={cat.name} className="rounded" />
                            <span className="text-sm font-semibold text-navy-900">{cat.name}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <label className="mt-3 block text-xs font-bold text-slate-500">
                Catatan bebas
                <input
                  name="freeNote"
                  type="text"
                  placeholder="Mis. jangan terlalu asin"
                  className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
                />
              </label>
            </fieldset>
          )}

          <button type="submit" className="btn-primary w-full py-4 text-base">
            Tambah ke Keranjang
          </button>
        </form>
      </div>
    </main>
  );
}
