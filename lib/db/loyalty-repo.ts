import { supabaseAdmin } from "../supabase";
import type {
  Customer,
  MembershipTier,
  LoyaltyProgram,
  LoyaltyTxn,
  Voucher,
  RewardRedemption
} from "../loyalty";

// ============================================================================
// Repository relasional Member/Loyalty (Fase D2b).
// Memetakan tipe app (camelCase) <-> baris Supabase (snake_case).
// push* = tulis (upsert) ke Supabase; pull* = baca balik jadi tipe app.
// Semua dibungkus try/catch agar tidak pernah merusak alur in-memory.
// ============================================================================

export type LoyaltySnapshot = {
  customers: Customer[];
  membershipTiers: MembershipTier[];
  loyaltyPrograms: LoyaltyProgram[];
  loyaltyTxns: LoyaltyTxn[];
  vouchers: Voucher[];
  rewardRedemptions: RewardRedemption[];
};

const n = <T>(v: T | undefined): T | null => (v === undefined ? null : v);

// ---- map: app -> row -------------------------------------------------------
const tierRow = (t: MembershipTier) => ({
  id: t.id,
  name: t.name,
  min_spending: t.minSpending,
  min_transactions: t.minTransactions,
  discount_percent: t.discountPercent,
  benefit_description: n(t.benefitDescription),
  active: t.active
});

const programRow = (p: LoyaltyProgram) => ({
  id: p.id,
  name: p.name,
  type: p.type,
  outlet_scope: p.outletScope,
  active: p.active,
  earn_per_rupiah: n(p.earnPerRupiah),
  min_purchase_for_point: n(p.minPurchaseForPoint),
  eligible_category_ids: n(p.eligibleCategoryIds),
  required_stamp_count: n(p.requiredStampCount),
  reward_label: n(p.rewardLabel),
  description: n(p.description)
});

const customerRow = (c: Customer) => ({
  id: c.id,
  full_name: c.fullName,
  phone: c.phone,
  birth_date: n(c.birthDate),
  registered_outlet_id: n(c.registeredOutletId),
  member_code: c.memberCode,
  status: c.status,
  total_points: c.totalPoints,
  total_spending: c.totalSpending,
  total_transactions: c.totalTransactions,
  stamps: c.stamps ?? {},
  tier_id: n(c.tierId),
  first_purchase_rewarded: n(c.firstPurchaseRewarded),
  birthday_voucher_year: n(c.birthdayVoucherYear),
  winback_voucher_at: n(c.winbackVoucherAt),
  last_transaction_at: n(c.lastTransactionAt),
  created_at: c.createdAt
});

const txnRow = (t: LoyaltyTxn) => ({
  id: t.id,
  customer_id: t.customerId,
  order_id: n(t.orderId),
  program_id: n(t.programId),
  tx_type: t.txType,
  points_change: t.pointsChange,
  stamps_change: t.stampsChange,
  description: n(t.description),
  created_by: n(t.createdBy),
  created_at: t.createdAt
});

const voucherRow = (v: Voucher) => ({
  id: v.id,
  customer_id: v.customerId,
  program_id: n(v.programId),
  code: v.code,
  type: v.type,
  discount_amount: n(v.discountAmount),
  reward_menu_id: n(v.rewardMenuId),
  reward_menu_name: n(v.rewardMenuName),
  reward_normal_price: n(v.rewardNormalPrice),
  min_purchase_amount: n(v.minPurchaseAmount),
  outlet_scope: v.outletScope,
  valid_until: n(v.validUntil),
  status: v.status,
  used_order_id: n(v.usedOrderId),
  used_at: n(v.usedAt),
  source: v.source,
  created_at: v.createdAt
});

const redemptionRow = (r: RewardRedemption) => ({
  id: r.id,
  customer_id: r.customerId,
  order_id: r.orderId,
  voucher_id: n(r.voucherId),
  reward_type: r.rewardType,
  reward_value: r.rewardValue,
  normal_price: r.normalPrice,
  promo_cost: r.promoCost,
  redeemed_by: n(r.redeemedBy),
  outlet_id: n(r.outletId),
  created_at: r.createdAt
});

// ---- map: row -> app -------------------------------------------------------
const u = <T>(v: T | null): T | undefined => (v === null ? undefined : v);

const toTier = (r: any): MembershipTier => ({
  id: r.id,
  name: r.name,
  minSpending: Number(r.min_spending),
  minTransactions: Number(r.min_transactions),
  discountPercent: Number(r.discount_percent),
  benefitDescription: r.benefit_description ?? "",
  active: r.active
});

const toProgram = (r: any): LoyaltyProgram => ({
  id: r.id,
  name: r.name,
  type: r.type,
  outletScope: r.outlet_scope,
  active: r.active,
  earnPerRupiah: u(r.earn_per_rupiah) != null ? Number(r.earn_per_rupiah) : undefined,
  minPurchaseForPoint: u(r.min_purchase_for_point) != null ? Number(r.min_purchase_for_point) : undefined,
  eligibleCategoryIds: u(r.eligible_category_ids),
  requiredStampCount: u(r.required_stamp_count) != null ? Number(r.required_stamp_count) : undefined,
  rewardLabel: u(r.reward_label),
  description: u(r.description)
});

const toCustomer = (r: any): Customer => ({
  id: r.id,
  fullName: r.full_name,
  phone: r.phone,
  birthDate: u(r.birth_date),
  registeredOutletId: u(r.registered_outlet_id),
  memberCode: r.member_code,
  status: r.status,
  totalPoints: Number(r.total_points),
  totalSpending: Number(r.total_spending),
  totalTransactions: Number(r.total_transactions),
  stamps: r.stamps ?? {},
  tierId: u(r.tier_id),
  firstPurchaseRewarded: u(r.first_purchase_rewarded),
  birthdayVoucherYear: u(r.birthday_voucher_year) != null ? Number(r.birthday_voucher_year) : undefined,
  winbackVoucherAt: u(r.winback_voucher_at),
  lastTransactionAt: u(r.last_transaction_at),
  createdAt: r.created_at
});

const toTxn = (r: any): LoyaltyTxn => ({
  id: r.id,
  customerId: r.customer_id,
  orderId: u(r.order_id),
  programId: u(r.program_id),
  txType: r.tx_type,
  pointsChange: Number(r.points_change),
  stampsChange: Number(r.stamps_change),
  description: r.description ?? "",
  createdBy: r.created_by ?? "",
  createdAt: r.created_at
});

const toVoucher = (r: any): Voucher => ({
  id: r.id,
  customerId: r.customer_id,
  programId: u(r.program_id),
  code: r.code,
  type: r.type,
  discountAmount: u(r.discount_amount) != null ? Number(r.discount_amount) : undefined,
  rewardMenuId: u(r.reward_menu_id),
  rewardMenuName: u(r.reward_menu_name),
  rewardNormalPrice: u(r.reward_normal_price) != null ? Number(r.reward_normal_price) : undefined,
  minPurchaseAmount: u(r.min_purchase_amount) != null ? Number(r.min_purchase_amount) : undefined,
  outletScope: r.outlet_scope,
  validUntil: u(r.valid_until),
  status: r.status,
  usedOrderId: u(r.used_order_id),
  usedAt: u(r.used_at),
  source: r.source ?? "",
  createdAt: r.created_at
});

const toRedemption = (r: any): RewardRedemption => ({
  id: r.id,
  customerId: r.customer_id,
  orderId: r.order_id,
  voucherId: u(r.voucher_id),
  rewardType: r.reward_type,
  rewardValue: Number(r.reward_value),
  normalPrice: Number(r.normal_price),
  promoCost: Number(r.promo_cost),
  redeemedBy: r.redeemed_by ?? "",
  outletId: r.outlet_id ?? "",
  createdAt: r.created_at
});

async function upsert(table: string, rows: unknown[]) {
  if (!rows.length) return;
  await supabaseAdmin().from(table).upsert(rows as never[], { onConflict: "id" });
}

/** Tulis seluruh state loyalty ke tabel relasional (idempotent). */
export async function pushLoyalty(snap: LoyaltySnapshot): Promise<void> {
  try {
    // Urutan: tier & program dulu (customers.tier_id FK), lalu sisanya.
    await upsert("membership_tiers", snap.membershipTiers.map(tierRow));
    await upsert("loyalty_programs", snap.loyaltyPrograms.map(programRow));
    await upsert("customers", snap.customers.map(customerRow));
    await upsert("loyalty_txns", snap.loyaltyTxns.map(txnRow));
    await upsert("vouchers", snap.vouchers.map(voucherRow));
    await upsert("reward_redemptions", snap.rewardRedemptions.map(redemptionRow));
  } catch {
    /* abaikan — relasional opsional, in-memory tetap sumber kerja */
  }
}

// Kolom eksplisit per tabel — hindari `select(*)` yang bisa kosong tepat setelah
// DDL (cache PostgREST belum me-resolve "*"). Eksplisit = andal.
const COLS = {
  membership_tiers: "id,name,min_spending,min_transactions,discount_percent,benefit_description,active",
  loyalty_programs:
    "id,name,type,outlet_scope,active,earn_per_rupiah,min_purchase_for_point,eligible_category_ids,required_stamp_count,reward_label,description",
  customers:
    "id,full_name,phone,birth_date,registered_outlet_id,member_code,status,total_points,total_spending,total_transactions,stamps,tier_id,first_purchase_rewarded,birthday_voucher_year,winback_voucher_at,last_transaction_at,created_at",
  loyalty_txns:
    "id,customer_id,order_id,program_id,tx_type,points_change,stamps_change,description,created_by,created_at",
  vouchers:
    "id,customer_id,program_id,code,type,discount_amount,reward_menu_id,reward_menu_name,reward_normal_price,min_purchase_amount,outlet_scope,valid_until,status,used_order_id,used_at,source,created_at",
  reward_redemptions:
    "id,customer_id,order_id,voucher_id,reward_type,reward_value,normal_price,promo_cost,redeemed_by,outlet_id,created_at"
} as const;

/** Baca seluruh state loyalty dari relasional. null bila belum ada data. */
export async function pullLoyalty(): Promise<LoyaltySnapshot | null> {
  try {
    const db = supabaseAdmin();
    const sel = async (t: keyof typeof COLS) => {
      const { data, error } = await (db as any).from(t).select(COLS[t], { count: "exact" });
      if (error) return [] as any[];
      return (data ?? []) as any[];
    };
    const customersRows = await sel("customers");
    if (customersRows.length === 0) return null;
    // Sekuensial (bukan Promise.all): query paralel di klien yg sama bisa balik kosong.
    const tiers = await sel("membership_tiers");
    const programs = await sel("loyalty_programs");
    const txns = await sel("loyalty_txns");
    const vouchers = await sel("vouchers");
    const redemptions = await sel("reward_redemptions");
    return {
      membershipTiers: tiers.map(toTier),
      loyaltyPrograms: programs.map(toProgram),
      customers: customersRows.map(toCustomer),
      loyaltyTxns: txns.map(toTxn),
      vouchers: vouchers.map(toVoucher),
      rewardRedemptions: redemptions.map(toRedemption)
    };
  } catch {
    return null;
  }
}
