import type { PosOrder } from "./pos-kds-roadmap";
import {
  ensureFloorReady,
  listFloorTables,
  sectionName,
  type FloorTable
} from "./floor-service";
import type { TableStatus } from "./pos-floor-ui";
export type { TableStatus, FloorTableView } from "./pos-floor-ui";
export { TABLE_STATUS_STYLE } from "./pos-floor-ui";

export type FloorTableState = FloorTable & {
  zone: string;
  status: TableStatus;
  orderId?: string;
  orderNumber?: string;
  total?: number;
  pendingKitchen?: number;
};

export function getFloorTables(outletId: string): FloorTable[] {
  ensureFloorReady(outletId);
  return listFloorTables(outletId);
}

export function hasFloorPlan(outletId: string) {
  return getFloorTables(outletId).length > 0;
}

function matchTableLabel(orderLabel: string, tableLabel: string) {
  return orderLabel.trim().toLowerCase() === tableLabel.trim().toLowerCase();
}

/** Status meja dari open/held bill shift aktif. */
export function buildFloorState(
  outletId: string,
  shiftId: string,
  orders: PosOrder[],
  countPending: (o: PosOrder) => number
): FloorTableState[] {
  const tables = getFloorTables(outletId);
  const active = orders.filter(
    (o) =>
      o.shiftId === shiftId &&
      (o.status === "open" || o.status === "held") &&
      o.paymentStatus !== "paid"
  );

  return tables.map((table) => {
    const bill = active.find((o) => o.tableLabel && matchTableLabel(o.tableLabel, table.label));
    if (!bill) {
      return { ...table, zone: sectionName(table.sectionId), status: "empty" as const };
    }
    const status: TableStatus =
      bill.status === "held"
        ? "held"
        : bill.paymentStatus === "partial"
          ? "partial"
          : "open";
    return {
      ...table,
      zone: sectionName(table.sectionId),
      status,
      orderId: bill.id,
      orderNumber: bill.orderNumber,
      total: bill.total,
      pendingKitchen: countPending(bill)
    };
  });
}

export type { FloorTable, TableSection } from "./floor-service";
