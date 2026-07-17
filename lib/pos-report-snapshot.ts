import { ensurePosSeeded, getOpenShift } from "./pos-service";
import { store } from "./store";
import { listOutletRegistry, outletDisplayName, toOutletSlug } from "./outlet-identity";
import { POS_OUTLET_IDS } from "./pos-seed";

export type PosOutletSalesRow = {
  outletId: string;
  outletName: string;
  completedOrders: number;
  omzetCompleted: number;
  shiftOpen: boolean;
  shiftLabel?: string;
  shiftOmzetLive?: number;
};

export type PosSalesSnapshot = {
  dateLabel: string;
  totalOmzet: number;
  totalOrders: number;
  byOutlet: PosOutletSalesRow[];
};

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

/** Ringkasan omzet POS hari ini — read-only, satu sumber dari posOrders + shift terbuka. */
export function buildPosSalesSnapshot(scopeOutletId?: string): PosSalesSnapshot {
  ensurePosSeeded();
  const scoped = toOutletSlug(scopeOutletId);
  const outletIds = scoped
    ? [scoped]
    : listOutletRegistry()
        .map((o) => o.slug)
        .filter((id) => POS_OUTLET_IDS.has(id));

  const completedToday = store().posOrders.filter(
    (o) =>
      o.status === "completed" &&
      isToday(o.completedAt ?? o.createdAt) &&
      (!scoped || o.outletId === scoped)
  );

  const byOutlet: PosOutletSalesRow[] = outletIds.map((outletId) => {
    const orders = completedToday.filter((o) => o.outletId === outletId);
    const open = getOpenShift(outletId);
    return {
      outletId,
      outletName: outletDisplayName(outletId),
      completedOrders: orders.length,
      omzetCompleted: orders.reduce((s, o) => s + o.total, 0),
      shiftOpen: Boolean(open),
      shiftLabel: open?.shiftLabel,
      shiftOmzetLive: open?.systemGrandTotal ?? 0
    };
  });

  const totalOmzet = byOutlet.reduce((sum, row) => {
    if (row.shiftOpen) return sum + (row.shiftOmzetLive ?? 0);
    return sum + row.omzetCompleted;
  }, 0);

  const now = new Date();
  return {
    dateLabel: now.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }),
    totalOmzet,
    totalOrders: completedToday.length,
    byOutlet: byOutlet.filter((r) => r.completedOrders > 0 || r.shiftOpen)
  };
}
