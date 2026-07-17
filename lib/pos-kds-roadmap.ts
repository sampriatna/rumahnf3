// POS / KDS — desain tipe TypeScript (Fase 7, referensi schema).
import type { PosRegisterSettings } from "./pos-register-settings";

/** Status order POS — urutan alur bisnis. */
export type PosOrderStatus =
  | "draft"
  | "open"
  | "held"
  | "paid"
  | "completed"
  | "void"
  | "refunded"
  | "merged";

export type PosPaymentStatus = "unpaid" | "partial" | "paid" | "refunded";

/** Channel penjualan — master data per outlet (slug string). */
export type PosOrderChannel = string;

export type PosPaymentMethod =
  | "cash"
  | "qris"
  | "debit"
  | "credit"
  | "gofood"
  | "grab"
  | "shopee"
  | "transfer"
  | "other";

/** Status ticket KDS — bahasa dapur. */
export type KdsTicketStatus =
  | "new"
  | "acknowledged"
  | "cooking"
  | "ready"
  | "served"
  | "bumped"
  | "void";

export type PosShiftStatus = "open" | "closing" | "closed" | "reconciled";

export type CashDrawerEntry = {
  id: string;
  type: "pay_in" | "pay_out";
  amount: number;
  reason: string;
  createdBy: string;
  createdAt: string;
};

/** Pengeluaran outlet harian — mengurangi Total Kas Akhir shift (Fase A audit). */
export type OutletExpense = {
  id: string;
  category: string;
  amount: number;
  note: string;
  createdBy: string;
  createdAt: string;
};

export type PosStoreDayStatus = "open" | "closed";

export type PosStoreDay = {
  outletId: string;
  businessDate: string;
  status: PosStoreDayStatus;
  closedAt?: string;
  closedBy?: string;
  openedAt?: string;
  openedBy?: string;
};

export type PosRegister = {
  id: string;
  outletId: string;
  areaId?: string;
  code: string;
  name: string;
  active: boolean;
  /** Pengaturan printer & operasional kasir. */
  settings?: PosRegisterSettings;
};

export type PosShift = {
  id: string;
  outletId: string;
  registerId: string;
  shiftLabel: string;
  openedBy: string;
  closedBy?: string;
  openingFloat: number;
  status: PosShiftStatus;
  openedAt: string;
  closedAt?: string;
  systemCashTotal?: number;
  systemQrisTotal?: number;
  systemOnlineTotal?: number;
  systemGrandTotal?: number;
  orderCount?: number;
  setoranSubmissionId?: string;
  /** P2 — catatan pay in/out laci kas. */
  cashDrawerEntries?: CashDrawerEntry[];
  /** Fase A — pengeluaran outlet (bahan, operasional, dll). */
  outletExpenses?: OutletExpense[];
};

export type MenuCategory = {
  id: string;
  outletId: string;
  name: string;
  sortOrder: number;
  active: boolean;
};

export type MenuItem = {
  id: string;
  outletId: string;
  categoryId?: string;
  sku?: string;
  name: string;
  description?: string;
  /** URL foto produk — tampil di Library & grid POS kasir. */
  imageUrl?: string;
  basePrice: number;
  /** Harga modal / COGS — untuk margin di Library. */
  costPrice?: number;
  /** Habis terjual — tampil di POS tapi tidak bisa dipesan (tanpa nonaktifkan). */
  soldOut?: boolean;
  taxIncluded: boolean;
  defaultAreaId?: string;
  prepTimeMinutes?: number;
  active: boolean;
};

/** Varian produk — ukuran/rasa dengan harga berbeda (mirip Moka). */
export type MenuItemVariant = {
  id: string;
  menuItemId: string;
  outletId: string;
  name: string;
  sku?: string;
  price: number;
  costPrice?: number;
  sortOrder: number;
  active: boolean;
};

export type MenuCatalogMeta = {
  outletId: string;
  version: number;
  updatedAt: string;
};

export type MenuModifier = {
  id: string;
  outletId: string;
  name: string;
  priceDelta: number;
  active: boolean;
};

export type Recipe = {
  id: string;
  menuItemId: string;
  name: string;
  yieldQty: number;
  lines: RecipeLine[];
};

export type RecipeLine = {
  itemId: string;
  qty: number;
  unit: string;
  note?: string;
};

export type PosOrder = {
  id: string;
  outletId: string;
  shiftId?: string;
  orderNumber: string;
  channel: PosOrderChannel;
  tableLabel?: string;
  customerName?: string;
  waiterId?: string;
  waiterName?: string;
  status: PosOrderStatus;
  paymentStatus: PosPaymentStatus;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  serviceChargeAmount: number;
  total: number;
  externalPlatform?: string;
  externalOrderId?: string;
  createdBy?: string;
  createdAt: string;
  paidAt?: string;
  completedAt?: string;
  items: PosOrderItem[];
  payments: PosOrderPayment[];
  /** Fase 7d — finance + inventory sudah di-post. */
  integratedAt?: string;
  inventoryIntegrated?: boolean;
  /** Fase L1 — Member / Loyalty. */
  customerId?: string;
  memberCode?: string;
  loyaltyProgramApplied?: string;
  totalGross?: number;
  totalDiscount?: number;
  totalLoyaltyDiscount?: number;
  totalVoucherDiscount?: number;
  /** Voucher kasir (non-member) — kode di checkout. */
  totalCashierVoucherDiscount?: number;
  appliedCashierVoucherId?: string;
  appliedCashierVoucherCode?: string;
  appliedCashierVoucherName?: string;
  totalNet?: number;
  pointsEarned?: number;
  pointsRedeemed?: number;
  stampsEarned?: number;
  rewardRedeemedStatus?: "none" | "applied" | "earned";
  loyaltyEarned?: boolean;
  /** Fase L2b — void/refund. */
  voidReason?: string;
  voidedAt?: string;
  voidedBy?: string;
  loyaltyReversed?: boolean;
  /** P1 — KDS sudah di-fire (sebelum bayar). */
  kitchenSentAt?: string;
  /** P2 — bill ditahan sementara. */
  heldAt?: string;
  holdReason?: string;
  /** P2 — diskon manual (wajib PIN leader). */
  totalManualDiscount?: number;
  manualDiscountNote?: string;
  manualDiscountApprovedBy?: string;
  /** Master promotion yang sudah dipakai di bill ini. */
  appliedPromotionId?: string;
  appliedPromotionName?: string;
  /** P3 — asal split bill. */
  splitFromOrderId?: string;
  /** P3 — digabung ke order ini (status merged). */
  mergedIntoOrderId?: string;
  /** P4 — audit cetak ulang struk. */
  reprintCount?: number;
  lastReprintAt?: string;
  lastReprintBy?: string;
  /** Fase C — status push ke cloud. */
  syncStatus?: PosOrderSyncStatus;
  /** Fase C — ID perangkat tablet (cookie persisten). */
  deviceId?: string;
  syncedAt?: string;
};

export type PosOrderSyncStatus = "pending" | "synced" | "failed";

export type PosSyncEntity = "order" | "shift";

export type PosSyncAction = "create" | "update" | "complete";

export type PosSyncQueueItem = {
  id: string;
  outletId: string;
  entity: PosSyncEntity;
  entityId: string;
  action: PosSyncAction;
  createdAt: string;
  syncedAt?: string;
  failedAt?: string;
  errorMessage?: string;
};

/** Fase D — absensi clock-in/out staf POS per outlet. */
export type PosAttendanceRecord = {
  id: string;
  outletId: string;
  userId: string;
  userName: string;
  userRole: string;
  businessDate: string;
  clockInAt: string;
  clockOutAt?: string;
  note?: string;
};

export type PosOrderItem = {
  id: string;
  menuItemId?: string;
  nameSnapshot: string;
  qty: number;
  unitPrice: number;
  modifiersSnapshot: Array<{ name: string; priceDelta: number }>;
  lineTotal: number;
  note?: string;
  status: "pending" | "fired" | "cooking" | "ready" | "served" | "void";
  /** Fase L1 — Member / Loyalty. */
  isRewardItem?: boolean;
  rewardProgramId?: string;
  rewardVoucherId?: string;
  normalPrice?: number;
  discountAmount?: number;
  finalPrice?: number;
  stockDeductedStatus?: "pending" | "deducted";
};

export type PosOrderPayment = {
  id: string;
  method: PosPaymentMethod;
  amount: number;
  reference?: string;
  status: "pending" | "captured" | "failed" | "refunded";
  financeAccountId?: string;
  ledgerEntryId?: string;
};

export type KdsTicket = {
  id: string;
  orderId: string;
  orderItemId: string;
  outletId: string;
  areaId: string;
  ticketNumber?: number;
  status: KdsTicketStatus;
  priority: number;
  firedAt: string;
  readyAt?: string;
  servedAt?: string;
  /** Snapshot untuk tampilan KDS */
  itemName: string;
  qty: number;
  note?: string;
  tableLabel?: string;
  channel: PosOrderChannel;
  orderNumber?: string;
  cookingAt?: string;
  bumpedAt?: string;
  bumpReason?: string;
};

/** Mapping payment method → akun finance (lib/finance.ts). */
export const PAYMENT_TO_ACCOUNT: Record<
  PosPaymentMethod,
  "cash_physical" | "bank" | "qris_pending" | "gofood_pending" | "marketplace_pending"
> = {
  cash: "cash_physical",
  qris: "qris_pending",
  debit: "bank",
  credit: "bank",
  gofood: "gofood_pending",
  grab: "gofood_pending",
  shopee: "marketplace_pending",
  transfer: "bank",
  other: "bank"
};

/** Alur implementasi POS (roadmap — belum dibangun). */
export const POS_IMPLEMENTATION_PHASES = [
  {
    phase: "7a",
    label: "Schema + seed menu demo",
    scope: "Jalankan pos-kds.sql di Supabase; seed menu KBU contoh"
  },
  {
    phase: "7b",
    label: "POS Kasir (tablet)",
    scope: "Buat order, split payment, close shift, link setoran — AKTIF di /pos"
  },
  {
    phase: "7c",
    label: "KDS Dapur/Bar",
    scope: "Real-time ticket board per area — AKTIF di /kds"
  },
  {
    phase: "7d",
    label: "Integrasi Finance + Inventory",
    scope: "Auto ledger + recipe stock out saat order completed — AKTIF"
  },
  {
    phase: "7e",
    label: "Platform online",
    scope: "Webhook GoFood/Grab; kas pending + reconciliation"
  }
] as const;
