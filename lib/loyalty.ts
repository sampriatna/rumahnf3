// Member / Loyalty — Fase L1 (Basic). Tipe, seed, konfigurasi.
// Prinsip: loyalty_transactions = ledger append-only (earn/redeem), agregat di
// customer hanya cache. Poin GABUNGAN lintas outlet (keputusan owner).

export type CustomerStatus = "active" | "inactive";

export type Customer = {
  id: string;
  fullName: string;
  phone: string; // unik
  birthDate?: string; // ISO (yyyy-mm-dd)
  registeredOutletId?: string;
  memberCode: string; // unik, mis. NF3-204517
  status: CustomerStatus;
  // Agregat (cache) — sumber kebenaran tetap loyaltyTxns
  totalPoints: number;
  totalSpending: number;
  totalTransactions: number;
  /** Stamp per program: { [programId]: count } */
  stamps: Record<string, number>;
  tierId?: string;
  /** Tanda voucher first-purchase sudah terbit (anti-dobel). */
  firstPurchaseRewarded?: boolean;
  /** Penanda kampanye terakhir agar tidak dobel terbit di periode sama. */
  birthdayVoucherYear?: number;
  winbackVoucherAt?: string;
  lastTransactionAt?: string;
  createdAt: string;
  /** Fase D — saldo deposit (cache; ledger di memberDepositTxns). */
  depositBalance?: number;
};

export type MemberDepositTxnType = "top_up" | "payment" | "refund" | "adjustment";

export type MemberDepositTxn = {
  id: string;
  customerId: string;
  outletId: string;
  shiftId?: string;
  type: MemberDepositTxnType;
  amount: number;
  balanceAfter: number;
  note?: string;
  orderId?: string;
  createdBy: string;
  createdAt: string;
};

export type MembershipTier = {
  id: string;
  name: string;
  minSpending: number;
  minTransactions: number;
  /** Diskon otomatis tier (persen) saat checkout. 0 = tanpa diskon. */
  discountPercent: number;
  benefitDescription: string;
  active: boolean;
};

/** Urut dari paling rendah ke tinggi. Auto-assign pakai ambang tertinggi terpenuhi. */
export function seedTiers(): MembershipTier[] {
  return [
    {
      id: "tier-basic",
      name: "Basic",
      minSpending: 0,
      minTransactions: 0,
      discountPercent: 0,
      benefitDescription: "Kumpulkan poin & stamp.",
      active: true
    },
    {
      id: "tier-silver",
      name: "Silver",
      minSpending: 500_000,
      minTransactions: 5,
      discountPercent: 0,
      benefitDescription: "Prioritas voucher & promo.",
      active: true
    },
    {
      id: "tier-gold",
      name: "Gold",
      minSpending: 1_500_000,
      minTransactions: 15,
      discountPercent: 5,
      benefitDescription: "Diskon member 5% + voucher ulang tahun.",
      active: true
    },
    {
      id: "tier-vip",
      name: "VIP",
      minSpending: 4_000_000,
      minTransactions: 40,
      discountPercent: 10,
      benefitDescription: "Diskon member 10% + reward eksklusif.",
      active: true
    }
  ];
}

/** Tentukan tier tertinggi yang ambangnya terpenuhi. */
export function resolveTier(
  spending: number,
  transactions: number,
  tiers: MembershipTier[]
): MembershipTier | undefined {
  const eligible = tiers
    .filter((t) => t.active && spending >= t.minSpending && transactions >= t.minTransactions)
    .sort((a, b) => b.minSpending - a.minSpending || b.minTransactions - a.minTransactions);
  return eligible[0];
}

/** Nilai voucher kampanye otomatis. */
export const FIRST_PURCHASE_VOUCHER = 5_000;
export const BIRTHDAY_DISCOUNT_AMOUNT = 20_000;
export const WINBACK_VOUCHER = 10_000;
export const INACTIVE_DAYS = 30;

export type LoyaltyProgramType = "point" | "stamp";

export type LoyaltyProgram = {
  id: string;
  name: string;
  type: LoyaltyProgramType;
  /** "all" = lintas outlet, atau daftar outletId. */
  outletScope: "all" | string[];
  active: boolean;
  // Point
  earnPerRupiah?: number; // Rp sekian = 1 poin
  minPurchaseForPoint?: number;
  // Stamp
  eligibleCategoryIds?: string[];
  requiredStampCount?: number;
  rewardLabel?: string;
  description?: string;
};

export type LoyaltyTxType =
  | "earn_point"
  | "redeem_point"
  | "earn_stamp"
  | "redeem_stamp"
  | "voucher_issued"
  | "voucher_used"
  | "point_expired"
  | "manual_adjustment"
  | "reversal";

export type LoyaltyTxn = {
  id: string;
  customerId: string;
  orderId?: string;
  programId?: string;
  txType: LoyaltyTxType;
  pointsChange: number;
  stampsChange: number;
  description: string;
  createdBy: string;
  createdAt: string;
};

export type VoucherType = "discount_amount" | "free_item";
export type VoucherStatus = "active" | "used" | "expired" | "cancelled";

export type Voucher = {
  id: string;
  customerId: string;
  programId?: string;
  code: string;
  type: VoucherType;
  discountAmount?: number;
  rewardMenuId?: string;
  rewardMenuName?: string;
  rewardNormalPrice?: number;
  minPurchaseAmount?: number;
  outletScope: "all" | string[];
  validUntil?: string;
  status: VoucherStatus;
  usedOrderId?: string;
  usedAt?: string;
  source: string; // "stamp_reward" | "manual" | ...
  createdAt: string;
};

export type RewardRedemption = {
  id: string;
  customerId: string;
  orderId: string;
  voucherId?: string;
  rewardType: "free_item" | "discount_voucher" | "point_discount";
  rewardValue: number; // nilai diskon / harga item gratis
  normalPrice: number;
  /** Biaya promo (harga jual normal) — NON-KAS, untuk report. */
  promoCost: number;
  redeemedBy: string;
  outletId: string;
  createdAt: string;
};

// ---- Konfigurasi L1 (sederhana, bisa jadi rule engine di L2) ----

/** 1 poin per Rp10.000 net, berlaku semua outlet. */
export const POINT_EARN_PER_RUPIAH = 10_000;
/** Nilai tukar 1 poin = Rp200 (50 poin = Rp10.000). */
export const POINT_REDEEM_VALUE = 200;
export const POINT_MIN_REDEEM = 50;

export function pointsToRupiah(points: number) {
  return points * POINT_REDEEM_VALUE;
}

export function rupiahToMaxPoints(rupiah: number) {
  return Math.floor(rupiah / POINT_REDEEM_VALUE);
}

export function seedLoyaltyPrograms(): LoyaltyProgram[] {
  return [
    {
      id: "prog-point",
      name: "Poin Belanja",
      type: "point",
      outletScope: "all",
      active: true,
      earnPerRupiah: POINT_EARN_PER_RUPIAH,
      minPurchaseForPoint: 0,
      description: "Setiap Rp10.000 dapat 1 poin. Berlaku semua outlet."
    },
    {
      id: "prog-stamp-kopi",
      name: "Beli 10 Kopi Gratis 1",
      type: "stamp",
      outletScope: "all",
      active: true,
      eligibleCategoryIds: ["cat-kbu-kopi"],
      requiredStampCount: 10,
      rewardLabel: "Gratis 1 Kopi",
      description: "Tiap beli menu Kopi dapat 1 stamp. 10 stamp = voucher gratis 1 kopi."
    }
  ];
}

export function generateMemberCode(seq: number) {
  return `NF3-${String(100000 + seq).slice(-6)}`;
}

export function generateVoucherCode(prefix: string, seq: number) {
  return `${prefix}-${String(100000 + seq).slice(-6)}`;
}

export function normalizePhone(phone: string) {
  return phone.replace(/[^0-9]/g, "");
}

/** Seed beberapa member demo. */
export function seedCustomers(): Customer[] {
  const now = new Date().toISOString();
  return [
    {
      id: "cust-1",
      fullName: "Budi Santoso",
      phone: "081200000001",
      birthDate: "1995-06-15",
      registeredOutletId: "kbu",
      memberCode: "NF3-100001",
      status: "active",
      totalPoints: 24,
      totalSpending: 240_000,
      totalTransactions: 6,
      stamps: { "prog-stamp-kopi": 7 },
      tierId: "tier-basic",
      lastTransactionAt: now,
      depositBalance: 150_000,
      createdAt: now
    },
    {
      id: "cust-2",
      fullName: "Sari Dewi",
      phone: "081200000002",
      birthDate: "1990-12-20",
      registeredOutletId: "samtaro",
      memberCode: "NF3-100002",
      status: "active",
      totalPoints: 110,
      totalSpending: 1_120_000,
      totalTransactions: 18,
      stamps: { "prog-stamp-kopi": 3 },
      tierId: "tier-silver",
      lastTransactionAt: now,
      createdAt: now
    }
  ];
}
