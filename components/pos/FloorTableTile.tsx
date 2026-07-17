"use client";

import type { FloorTableView } from "@/lib/pos-floor-ui";
import { TableCard } from "./TableCard";
import { MoveTableForm } from "./MoveTableForm";

export function FloorTableTile({
  table,
  outletId,
  emptyTableLabels
}: {
  table: FloorTableView;
  outletId: string;
  emptyTableLabels: string[];
}) {
  const href = table.orderId
    ? `/pos/checkout/${table.orderId}?outlet=${outletId}`
    : `/pos?outlet=${outletId}&table=${encodeURIComponent(table.label)}`;

  if (table.status === "empty") {
    return <TableCard table={table} outletId={outletId} href={href} />;
  }

  return (
    <div className="flex flex-col rounded-2xl ring-2 ring-transparent">
      <TableCard table={table} outletId={outletId} href={href} />
      {table.orderId && (
        <div className="px-1 pb-1">
          <MoveTableForm
            orderId={table.orderId}
            outletId={outletId}
            currentTable={table.label}
            emptyTables={emptyTableLabels}
          />
        </div>
      )}
    </div>
  );
}
