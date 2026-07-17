"use client";

import { useCallback, useState, useTransition } from "react";
import { GitBranch, Link2, Store } from "lucide-react";
import type { BranchMenuRow } from "@/lib/branch-menu-service";
import { formatRp } from "@/lib/finance";
import { SaveToast } from "@/components/SaveToast";
import {
  saveBranchMenuInline,
  toggleBranchMenuInline,
  enableAllCatalogAction,
  bootstrapBranchMenuAction
} from "@/app/library/branch-menu-actions";

function BranchMenuRowEditor({
  row,
  branchOutletId,
  catalogOutletId,
  onSaved
}: {
  row: BranchMenuRow;
  branchOutletId: string;
  catalogOutletId: string;
  onSaved: (message: string) => void;
}) {
  const isActive = row.isNative ? row.item.active : Boolean(row.setting?.active);
  const [price, setPrice] = useState(row.setting?.price != null ? String(row.setting.price) : "");
  const [soldOut, setSoldOut] = useState(row.setting?.soldOut ?? false);
  const [pending, startTransition] = useTransition();

  const persist = useCallback(
    (next: { price?: string; soldOut?: boolean; active?: boolean }) => {
      const priceRaw = next.price ?? price;
      const priceVal = priceRaw.trim() === "" ? null : Number(priceRaw);
      const activeVal = next.active ?? isActive;
      const soldOutVal = next.soldOut ?? soldOut;

      startTransition(async () => {
        const res = await saveBranchMenuInline({
          branchOutletId,
          catalogOutletId,
          menuItemId: row.item.id,
          price: Number.isFinite(priceVal as number) ? priceVal : null,
          active: activeVal,
          soldOut: soldOutVal
        });
        if (res.ok) onSaved("Tersimpan");
      });
    },
    [branchOutletId, catalogOutletId, isActive, onSaved, price, row.item.id, soldOut]
  );

  const toggleActive = () => {
    if (row.isNative) return;
    startTransition(async () => {
      const res = await toggleBranchMenuInline({
        branchOutletId,
        menuItemId: row.item.id,
        active: !isActive
      });
      if (res.ok) onSaved(isActive ? "Item dinonaktifkan" : "Item diaktifkan");
    });
  };

  return (
    <li className={`px-4 py-4 ${!isActive ? "opacity-50" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-black text-navy-900">{row.item.name}</p>
            {row.isLinked ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold uppercase text-sky-800">
                <Link2 className="h-3 w-3" aria-hidden />
                Katalog
              </span>
            ) : (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
                Lokal
              </span>
            )}
            {soldOut && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                Habis
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Katalog {formatRp(row.catalogPrice)}
            {row.effectivePrice !== row.catalogPrice && (
              <>
                {" "}
                · cabang <strong>{formatRp(row.effectivePrice)}</strong>
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs font-bold text-slate-600">
            Harga cabang
            <input
              type="number"
              min={0}
              placeholder={String(row.catalogPrice)}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              onBlur={() => persist({})}
              disabled={pending}
              className="mt-1 block w-28 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="flex items-center gap-1.5 pb-1.5 text-xs font-bold text-slate-600">
            <input
              type="checkbox"
              checked={soldOut}
              onChange={(e) => {
                setSoldOut(e.target.checked);
                persist({ soldOut: e.target.checked });
              }}
              disabled={pending}
              className="rounded"
            />
            Habis
          </label>
          {!row.isNative && (
            <button
              type="button"
              onClick={toggleActive}
              disabled={pending}
              className="btn-secondary px-3 py-2 text-xs"
            >
              {pending ? "…" : isActive ? "Off" : "On"}
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

export function BranchMenuLibraryClient({
  catalogOutletId,
  branchOutletId,
  catalogOutletName,
  branchOutletName,
  rows
}: {
  catalogOutletId: string;
  branchOutletId: string;
  catalogOutletName: string;
  branchOutletName: string;
  rows: BranchMenuRow[];
}) {
  const [filter, setFilter] = useState<"all" | "linked" | "native" | "active">("all");
  const [toast, setToast] = useState<string | null>(null);

  const filtered = rows.filter((row) => {
    if (filter === "linked") return row.isLinked;
    if (filter === "native") return row.isNative;
    if (filter === "active") return row.setting?.active || (row.isNative && row.item.active);
    return true;
  });

  const activeLinked = rows.filter((r) => r.isLinked && r.setting?.active).length;

  return (
    <>
      <SaveToast message={toast} onDismiss={() => setToast(null)} />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-navy-700" aria-hidden />
          <p className="text-sm text-slate-600">
            Katalog <strong>{catalogOutletName}</strong> → cabang <strong>{branchOutletName}</strong> ·{" "}
            {activeLinked} item terhubung
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={bootstrapBranchMenuAction}>
            <input type="hidden" name="branchOutletId" value={branchOutletId} />
            <input type="hidden" name="catalogOutletId" value={catalogOutletId} />
            <button type="submit" className="btn-secondary px-3 py-2 text-xs">
              Reset template
            </button>
          </form>
          <form action={enableAllCatalogAction}>
            <input type="hidden" name="branchOutletId" value={branchOutletId} />
            <input type="hidden" name="catalogOutletId" value={catalogOutletId} />
            <button type="submit" className="btn-secondary px-3 py-2 text-xs">
              Aktifkan semua katalog
            </button>
          </form>
        </div>
      </div>

      <p className="mb-3 text-[11px] text-slate-500">
        Harga & status habis tersimpan otomatis saat kamu pindah field atau ubah checkbox.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", "linked", "native", "active"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
              filter === f ? "bg-navy-800 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            {f === "all" ? "Semua" : f === "linked" ? "Dari katalog" : f === "native" ? "Lokal cabang" : "Aktif"}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="panel p-8 text-center">
          <Store className="mx-auto mb-3 h-10 w-10 text-slate-300" aria-hidden />
          <p className="font-bold text-navy-900">Belum ada baris menu</p>
        </div>
      ) : (
        <ul className="panel divide-y divide-slate-100">
          {filtered.map((row) => (
            <BranchMenuRowEditor
              key={row.item.id}
              row={row}
              branchOutletId={branchOutletId}
              catalogOutletId={catalogOutletId}
              onSaved={setToast}
            />
          ))}
        </ul>
      )}
    </>
  );
}
