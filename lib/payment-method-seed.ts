import type { PaymentMethodKind, PaymentShiftBucket } from "./payment-method-service";

const OUTLETS = ["kbu", "kisamen", "samtaro"] as const;

const METHODS: Array<{
  id: string;
  name: string;
  kind: PaymentMethodKind;
  coaAccountId: string;
  shiftBucket: PaymentShiftBucket;
  heldCashEnabled?: boolean;
  heldCashSource?: string;
  heldCashReleaseDays?: number;
}> = [
  { id: "cash", name: "Tunai", kind: "cash", coaAccountId: "cash_physical", shiftBucket: "cash" },
  {
    id: "qris",
    name: "QRIS",
    kind: "ewallet",
    coaAccountId: "qris_pending",
    shiftBucket: "qris",
    heldCashEnabled: true,
    heldCashSource: "QRIS",
    heldCashReleaseDays: 1
  },
  { id: "debit", name: "Debit", kind: "card", coaAccountId: "bank", shiftBucket: "bank" },
  { id: "credit", name: "Kredit", kind: "card", coaAccountId: "bank", shiftBucket: "bank" },
  {
    id: "gofood",
    name: "GoFood",
    kind: "platform",
    coaAccountId: "gofood_pending",
    shiftBucket: "online",
    heldCashEnabled: true,
    heldCashSource: "GoFood/Grab/Shopee",
    heldCashReleaseDays: 3
  },
  {
    id: "grab",
    name: "GrabFood",
    kind: "platform",
    coaAccountId: "gofood_pending",
    shiftBucket: "online",
    heldCashEnabled: true,
    heldCashSource: "GoFood/Grab/Shopee",
    heldCashReleaseDays: 3
  },
  {
    id: "shopee",
    name: "ShopeeFood",
    kind: "platform",
    coaAccountId: "marketplace_pending",
    shiftBucket: "online",
    heldCashEnabled: true,
    heldCashSource: "Marketplace",
    heldCashReleaseDays: 2
  },
  { id: "transfer", name: "Transfer", kind: "transfer", coaAccountId: "bank", shiftBucket: "bank" }
];

/** Metode bayar default per outlet F&B. */
export const PAYMENT_METHOD_SEED = OUTLETS.flatMap((outletId) =>
  METHODS.map((m) => ({ outletId, ...m }))
);
