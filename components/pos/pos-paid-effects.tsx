"use client";

import { AutoPrintReceiptTrigger } from "./auto-print";

export function PosPaidEffects({
  orderId,
  outletId,
  autoPrint,
  copies
}: {
  orderId: string;
  outletId: string;
  autoPrint: boolean;
  copies?: 1 | 2;
}) {
  return (
    <AutoPrintReceiptTrigger
      orderId={orderId}
      outletId={outletId}
      enabled={autoPrint}
      copies={copies}
    />
  );
}
