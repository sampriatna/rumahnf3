import { Store } from "lucide-react";
import { openStoreDayAction } from "@/app/pos-actions";
import { PosExitLink } from "./PosExitLink";
import { PosDrawerLayout } from "./PosDrawerLayout";
import type { PosDrawerContext } from "@/lib/pos-drawer-context";

export function PosStoreClosedScreen({
  outletId,
  outletName,
  closedBy,
  closedAt,
  canOpenStore,
  drawerCtx
}: {
  outletId: string;
  outletName: string;
  closedBy?: string;
  closedAt?: string;
  canOpenStore: boolean;
  drawerCtx?: PosDrawerContext;
}) {
  const closedLabel = closedAt
    ? new Date(closedAt).toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
      })
    : null;

  const body = (
    <div className="flex flex-1 items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        {!drawerCtx && <PosExitLink className="text-xs font-bold uppercase tracking-wide text-slate-400" />}
        <div className="pos-panel p-6 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <Store className="h-7 w-7" aria-hidden />
          </span>
          <h1 className="mt-4 text-xl font-black text-navy-900">Toko Ditutup</h1>
          <p className="mt-2 text-sm text-slate-600">
            {outletName} tidak menerima penjualan baru sampai toko dibuka kembali.
          </p>
          {closedBy && (
            <p className="mt-3 text-xs text-slate-500">
              Ditutup oleh {closedBy}
              {closedLabel ? ` · ${closedLabel}` : ""}
            </p>
          )}
          {canOpenStore ? (
            <form action={openStoreDayAction} className="mt-6">
              <input type="hidden" name="outletId" value={outletId} />
              <button type="submit" className="pos-cta-primary">
                Buka Toko
              </button>
            </form>
          ) : (
            <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
              Minta leader atau admin untuk membuka toko.
            </p>
          )}
        </div>
      </div>
    </div>
  );

  if (drawerCtx) {
    return <PosDrawerLayout ctx={drawerCtx}>{body}</PosDrawerLayout>;
  }

  return <div className="pos-shell flex min-h-screen flex-col bg-surface">{body}</div>;
}
