import {
  type Customer,
  type LoyaltyProgram,
  type LoyaltyTxn,
  type Voucher,
  type RewardRedemption,
  type LoyaltyTxType,
  type MembershipTier,
  seedLoyaltyPrograms,
  seedCustomers,
  seedTiers,
  resolveTier,
  generateMemberCode,
  generateVoucherCode,
  normalizePhone,
  POINT_EARN_PER_RUPIAH,
  POINT_MIN_REDEEM,
  pointsToRupiah,
  FIRST_PURCHASE_VOUCHER,
  BIRTHDAY_DISCOUNT_AMOUNT,
  WINBACK_VOUCHER,
  INACTIVE_DAYS
} from "./loyalty";
import { hydrateLoyaltyFromSupabase } from "./loyalty-hydrate";
import { store, nextId } from "./store";
import { getMenuItem } from "./pos-service";

function ensureLoyaltySeeded() {
  const s = store();
  if (!s.loyaltySeeded) {
    s.loyaltyPrograms = seedLoyaltyPrograms();
    s.membershipTiers = seedTiers();
    s.customers = seedCustomers();
    s.loyaltyTxns = [];
    s.vouchers = [];
    s.rewardRedemptions = [];
    s.loyaltySeeded = true;
  }
  if (s.membershipTiers.length === 0) s.membershipTiers = seedTiers();
  for (const c of s.customers) {
    if (!c.tierId) {
      const t = resolveTier(c.totalSpending, c.totalTransactions, s.membershipTiers);
      if (t) c.tierId = t.id;
    }
  }
}

/** P3 — muat loyalty dari Supabase sebelum operasi baca/tulis. */
export async function ensureLoyaltyReady() {
  await hydrateLoyaltyFromSupabase();
  ensureLoyaltySeeded();
}

// ---- Tier ----

export function listTiers() {
  ensureLoyaltySeeded();
  return store().membershipTiers;
}

export function getTier(id?: string) {
  if (!id) return undefined;
  ensureLoyaltySeeded();
  return store().membershipTiers.find((t) => t.id === id);
}

/** Re-evaluasi tier member dari agregat. Catat audit bila naik/turun. */
function reassessTier(customer: Customer, createdBy: string) {
  const tiers = store().membershipTiers;
  const next = resolveTier(customer.totalSpending, customer.totalTransactions, tiers);
  if (next && next.id !== customer.tierId) {
    const prev = getTier(customer.tierId);
    customer.tierId = next.id;
    addTxn({
      customerId: customer.id,
      txType: "manual_adjustment",
      description: `Tier ${prev?.name ?? "Basic"} → ${next.name}`,
      createdBy: createdBy === "" ? "Sistem" : "Sistem"
    });
  }
}

function addTxn(input: {
  customerId: string;
  orderId?: string;
  programId?: string;
  txType: LoyaltyTxType;
  pointsChange?: number;
  stampsChange?: number;
  description: string;
  createdBy: string;
}) {
  const txn: LoyaltyTxn = {
    id: nextId("LTX"),
    customerId: input.customerId,
    orderId: input.orderId,
    programId: input.programId,
    txType: input.txType,
    pointsChange: input.pointsChange ?? 0,
    stampsChange: input.stampsChange ?? 0,
    description: input.description,
    createdBy: input.createdBy,
    createdAt: new Date().toISOString()
  };
  store().loyaltyTxns.unshift(txn);
  return txn;
}

// ---- Customer CRUD ----

export function listCustomers() {
  ensureLoyaltySeeded();
  return store().customers;
}

export function getCustomer(id: string) {
  ensureLoyaltySeeded();
  return store().customers.find((c) => c.id === id);
}

export function findByPhone(phone: string) {
  ensureLoyaltySeeded();
  const p = normalizePhone(phone);
  return store().customers.find((c) => normalizePhone(c.phone) === p);
}

export function findCustomerByMemberCode(code: string) {
  ensureLoyaltySeeded();
  const q = code.trim().toLowerCase();
  if (!q) return undefined;
  return store().customers.find((c) => c.memberCode.toLowerCase() === q);
}

export function searchCustomers(query: string) {
  ensureLoyaltySeeded();
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const qPhone = normalizePhone(query);
  return store()
    .customers.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.memberCode.toLowerCase().includes(q) ||
        (qPhone.length >= 3 && normalizePhone(c.phone).includes(qPhone))
    )
    .slice(0, 10);
}

export function createCustomer(input: {
  fullName: string;
  phone: string;
  birthDate?: string;
  registeredOutletId?: string;
}): { error?: string; customer?: Customer } {
  ensureLoyaltySeeded();
  const phone = normalizePhone(input.phone);
  if (!input.fullName.trim()) return { error: "Nama wajib diisi." };
  if (phone.length < 8) return { error: "Nomor HP tidak valid." };
  if (findByPhone(phone)) return { error: "Nomor HP sudah terdaftar." };

  const s = store();
  const seq = s.customers.length + 1;
  const customer: Customer = {
    id: nextId("CUST"),
    fullName: input.fullName.trim(),
    phone,
    birthDate: input.birthDate || undefined,
    registeredOutletId: input.registeredOutletId,
    memberCode: generateMemberCode(seq + 2),
    status: "active",
    totalPoints: 0,
    totalSpending: 0,
    totalTransactions: 0,
    stamps: {},
    createdAt: new Date().toISOString()
  };
  s.customers.unshift(customer);
  return { customer };
}

// ---- Programs & vouchers ----

export function getPrograms() {
  ensureLoyaltySeeded();
  return store().loyaltyPrograms.filter((p) => p.active);
}

export function getProgram(id: string) {
  ensureLoyaltySeeded();
  return store().loyaltyPrograms.find((p) => p.id === id);
}

export function listActiveVouchers(customerId: string, outletId?: string) {
  ensureLoyaltySeeded();
  const now = Date.now();
  return store().vouchers.filter((v) => {
    if (v.customerId !== customerId || v.status !== "active") return false;
    if (v.validUntil && new Date(v.validUntil).getTime() < now) return false;
    if (outletId && v.outletScope !== "all" && !v.outletScope.includes(outletId)) return false;
    return true;
  });
}

export function getVoucher(id: string) {
  ensureLoyaltySeeded();
  return store().vouchers.find((v) => v.id === id);
}

function issueVoucher(input: Omit<Voucher, "id" | "code" | "status" | "createdAt"> & { codePrefix: string }) {
  const s = store();
  const seq = s.vouchers.length + 1;
  const voucher: Voucher = {
    ...input,
    id: nextId("VCH"),
    code: generateVoucherCode(input.codePrefix, seq),
    status: "active",
    createdAt: new Date().toISOString()
  };
  s.vouchers.unshift(voucher);
  return voucher;
}

/** Voucher manual oleh admin/owner (diskon nominal atau gratis item). */
export function createManualVoucher(input: {
  customerId: string;
  type: "discount_amount" | "free_item";
  discountAmount?: number;
  rewardMenuId?: string;
  minPurchaseAmount?: number;
  validUntil?: string;
  source?: string;
}): { error?: string; voucher?: Voucher } {
  ensureLoyaltySeeded();
  const customer = getCustomer(input.customerId);
  if (!customer) return { error: "Member tidak ditemukan." };

  if (input.type === "discount_amount") {
    if (!input.discountAmount || input.discountAmount <= 0) {
      return { error: "Nominal diskon wajib > 0." };
    }
    const voucher = issueVoucher({
      customerId: customer.id,
      type: "discount_amount",
      discountAmount: input.discountAmount,
      minPurchaseAmount: input.minPurchaseAmount,
      outletScope: "all",
      validUntil: input.validUntil,
      source: input.source ?? "manual",
      codePrefix: "DISC"
    });
    addTxn({
      customerId: customer.id,
      txType: "voucher_issued",
      description: `Voucher diskon Rp${input.discountAmount.toLocaleString("id-ID")} (${voucher.code})`,
      createdBy: "Admin"
    });
    return { voucher };
  }

  const menu = input.rewardMenuId ? getMenuItem(input.rewardMenuId) : undefined;
  if (!menu) return { error: "Menu reward tidak ditemukan." };
  const voucher = issueVoucher({
    customerId: customer.id,
    type: "free_item",
    rewardMenuId: menu.id,
    rewardMenuName: menu.name,
    rewardNormalPrice: menu.basePrice,
    outletScope: "all",
    validUntil: input.validUntil,
    source: input.source ?? "manual",
    codePrefix: "FREE"
  });
  addTxn({
    customerId: customer.id,
    txType: "voucher_issued",
    description: `Voucher gratis ${menu.name} (${voucher.code})`,
    createdBy: "Admin"
  });
  return { voucher };
}

// ---- Earning (dipanggil saat order lunas) ----

type EarnOrder = {
  id: string;
  outletId: string;
  customerId?: string;
  totalNet: number;
  items: Array<{ menuItemId?: string; qty: number; isRewardItem?: boolean }>;
  loyaltyEarned?: boolean;
};

function programAllowsOutlet(program: LoyaltyProgram, outletId: string) {
  return program.outletScope === "all" || program.outletScope.includes(outletId);
}

/** Hitung poin + stamp dari order yang sudah lunas. Idempotent via order.loyaltyEarned. */
export function earnFromOrder(
  order: EarnOrder,
  ctx: { createdBy: string; menuCategory: (menuItemId: string) => string | undefined }
) {
  ensureLoyaltySeeded();
  if (!order.customerId || order.loyaltyEarned) {
    return { pointsEarned: 0, stampsEarned: 0, vouchersIssued: [] as Voucher[] };
  }
  const customer = getCustomer(order.customerId);
  if (!customer) return { pointsEarned: 0, stampsEarned: 0, vouchersIssued: [] as Voucher[] };

  const programs = getPrograms();
  const vouchersIssued: Voucher[] = [];
  let pointsEarned = 0;
  let stampsEarned = 0;

  // Poin dari net spending
  const pointProgram = programs.find((p) => p.type === "point" && programAllowsOutlet(p, order.outletId));
  if (pointProgram && order.totalNet >= (pointProgram.minPurchaseForPoint ?? 0)) {
    const rate = pointProgram.earnPerRupiah ?? POINT_EARN_PER_RUPIAH;
    pointsEarned = Math.floor(order.totalNet / rate);
    if (pointsEarned > 0) {
      customer.totalPoints += pointsEarned;
      addTxn({
        customerId: customer.id,
        orderId: order.id,
        programId: pointProgram.id,
        txType: "earn_point",
        pointsChange: pointsEarned,
        description: `+${pointsEarned} poin dari belanja Rp${order.totalNet.toLocaleString("id-ID")}`,
        createdBy: ctx.createdBy
      });
    }
  }

  // Stamp dari item yang eligible (bukan item reward)
  const stampPrograms = programs.filter((p) => p.type === "stamp" && programAllowsOutlet(p, order.outletId));
  for (const program of stampPrograms) {
    const eligibleCats = program.eligibleCategoryIds ?? [];
    let add = 0;
    let rewardMenuId: string | undefined;
    for (const line of order.items) {
      if (line.isRewardItem || !line.menuItemId) continue;
      const cat = ctx.menuCategory(line.menuItemId);
      if (cat && eligibleCats.includes(cat)) {
        add += line.qty;
        rewardMenuId = line.menuItemId;
      }
    }
    if (add <= 0) continue;

    stampsEarned += add;
    const current = customer.stamps[program.id] ?? 0;
    let total = current + add;
    customer.stamps[program.id] = total;
    addTxn({
      customerId: customer.id,
      orderId: order.id,
      programId: program.id,
      txType: "earn_stamp",
      stampsChange: add,
      description: `+${add} stamp ${program.name} (total ${total})`,
      createdBy: ctx.createdBy
    });

    const threshold = program.requiredStampCount ?? 10;
    while (total >= threshold) {
      total -= threshold;
      customer.stamps[program.id] = total;
      const menu = rewardMenuId ? getMenuItem(rewardMenuId) : undefined;
      const voucher = issueVoucher({
        customerId: customer.id,
        programId: program.id,
        type: "free_item",
        rewardMenuId: menu?.id,
        rewardMenuName: menu?.name ?? program.rewardLabel,
        rewardNormalPrice: menu?.basePrice ?? 0,
        outletScope: program.outletScope,
        source: "stamp_reward",
        codePrefix: "STMP"
      });
      vouchersIssued.push(voucher);
      addTxn({
        customerId: customer.id,
        orderId: order.id,
        programId: program.id,
        txType: "redeem_stamp",
        stampsChange: -threshold,
        description: `${threshold} stamp ditukar → voucher ${voucher.code}`,
        createdBy: ctx.createdBy
      });
      addTxn({
        customerId: customer.id,
        programId: program.id,
        txType: "voucher_issued",
        description: `Voucher reward ${voucher.rewardMenuName ?? "gratis"} (${voucher.code})`,
        createdBy: "Sistem"
      });
    }
  }

  customer.totalSpending += order.totalNet;
  customer.totalTransactions += 1;
  customer.lastTransactionAt = new Date().toISOString();

  // First-purchase reward (sekali seumur hidup member)
  if (!customer.firstPurchaseRewarded && customer.totalTransactions === 1) {
    const voucher = issueVoucher({
      customerId: customer.id,
      type: "discount_amount",
      discountAmount: FIRST_PURCHASE_VOUCHER,
      outletScope: "all",
      source: "first_purchase",
      codePrefix: "NEW"
    });
    customer.firstPurchaseRewarded = true;
    vouchersIssued.push(voucher);
    addTxn({
      customerId: customer.id,
      txType: "voucher_issued",
      description: `Reward transaksi pertama — voucher Rp${FIRST_PURCHASE_VOUCHER.toLocaleString("id-ID")} (${voucher.code})`,
      createdBy: "Sistem"
    });
  }

  reassessTier(customer, ctx.createdBy);

  return { pointsEarned, stampsEarned, vouchersIssued };
}

// ---- Kampanye voucher otomatis (digenerate manual oleh admin/owner) ----

function isThisMonth(birthDate: string, ref: Date) {
  return new Date(birthDate).getMonth() === ref.getMonth();
}

/** Terbitkan voucher ulang tahun untuk member yang ultah bulan ini (sekali/tahun). */
export function generateBirthdayVouchers(createdBy: string) {
  ensureLoyaltySeeded();
  const now = new Date();
  const year = now.getFullYear();
  let count = 0;
  for (const c of store().customers) {
    if (c.status !== "active" || !c.birthDate) continue;
    if (!isThisMonth(c.birthDate, now)) continue;
    if (c.birthdayVoucherYear === year) continue;

    const valid = new Date(year, now.getMonth() + 1, 0).toISOString();
    const voucher = issueVoucher({
      customerId: c.id,
      type: "discount_amount",
      discountAmount: BIRTHDAY_DISCOUNT_AMOUNT,
      outletScope: "all",
      validUntil: valid,
      source: "birthday",
      codePrefix: "BDAY"
    });
    c.birthdayVoucherYear = year;
    count++;
    addTxn({
      customerId: c.id,
      txType: "voucher_issued",
      description: `Voucher ulang tahun Rp${BIRTHDAY_DISCOUNT_AMOUNT.toLocaleString("id-ID")} (${voucher.code})`,
      createdBy
    });
  }
  return count;
}

/** Terbitkan voucher winback untuk pelanggan tidak aktif >= INACTIVE_DAYS. */
export function generateWinbackVouchers(createdBy: string) {
  ensureLoyaltySeeded();
  const now = new Date();
  let count = 0;
  for (const c of store().customers) {
    if (c.status !== "active" || c.totalTransactions === 0) continue;
    if (daysSince(c.lastTransactionAt) < INACTIVE_DAYS) continue;
    // Jangan dobel dalam 30 hari terakhir
    if (c.winbackVoucherAt && daysSince(c.winbackVoucherAt) < INACTIVE_DAYS) continue;

    const valid = new Date(now.getTime() + 30 * 86_400_000).toISOString();
    const voucher = issueVoucher({
      customerId: c.id,
      type: "discount_amount",
      discountAmount: WINBACK_VOUCHER,
      outletScope: "all",
      validUntil: valid,
      source: "winback",
      codePrefix: "BACK"
    });
    c.winbackVoucherAt = now.toISOString();
    count++;
    addTxn({
      customerId: c.id,
      txType: "voucher_issued",
      description: `Voucher comeback Rp${WINBACK_VOUCHER.toLocaleString("id-ID")} (${voucher.code})`,
      createdBy
    });
  }
  return count;
}

// ---- Penyesuaian poin manual (admin/owner) — anti-fraud terkontrol ----

export function adjustPoints(input: {
  customerId: string;
  delta: number;
  reason: string;
  createdBy: string;
}): { error?: string; customer?: Customer } {
  ensureLoyaltySeeded();
  const customer = getCustomer(input.customerId);
  if (!customer) return { error: "Member tidak ditemukan." };
  if (!Number.isFinite(input.delta) || input.delta === 0) return { error: "Jumlah poin tidak valid." };
  if (!input.reason.trim()) return { error: "Alasan wajib diisi (audit)." };
  if (customer.totalPoints + input.delta < 0) return { error: "Poin tidak boleh negatif." };

  customer.totalPoints += input.delta;
  addTxn({
    customerId: customer.id,
    txType: "manual_adjustment",
    pointsChange: input.delta,
    description: `Penyesuaian manual: ${input.reason.trim()}`,
    createdBy: input.createdBy
  });
  return { customer };
}

// ---- Reversal saat order void/refund (anti-fraud) ----

type ReverseOrder = {
  id: string;
  customerId?: string;
  totalNet?: number;
  total: number;
  pointsEarned?: number;
  pointsRedeemed?: number;
  stampsEarned?: number;
};

/**
 * Balik efek loyalty saat order dibatalkan:
 * poin earned dikurangi, poin redeemed dikembalikan, stamp dikurangi,
 * voucher yang dipakai di order ini diaktifkan lagi (refundable). Audit lewat ledger.
 */
export function reverseLoyaltyForOrder(order: ReverseOrder, createdBy: string) {
  ensureLoyaltySeeded();
  if (!order.customerId) return { skipped: true };
  const customer = getCustomer(order.customerId);
  if (!customer) return { skipped: true };

  const net = order.totalNet ?? order.total;

  const pointsEarned = order.pointsEarned ?? 0;
  if (pointsEarned > 0) {
    customer.totalPoints = Math.max(0, customer.totalPoints - pointsEarned);
    addTxn({
      customerId: customer.id,
      orderId: order.id,
      txType: "reversal",
      pointsChange: -pointsEarned,
      description: `Void order: −${pointsEarned} poin (earned dibatalkan)`,
      createdBy
    });
  }

  const pointsRedeemed = order.pointsRedeemed ?? 0;
  if (pointsRedeemed > 0) {
    customer.totalPoints += pointsRedeemed;
    addTxn({
      customerId: customer.id,
      orderId: order.id,
      txType: "reversal",
      pointsChange: pointsRedeemed,
      description: `Void order: +${pointsRedeemed} poin (redeem dikembalikan)`,
      createdBy
    });
  }

  const stampsEarned = order.stampsEarned ?? 0;
  if (stampsEarned > 0) {
    const cur = customer.stamps["prog-stamp-kopi"] ?? 0;
    customer.stamps["prog-stamp-kopi"] = Math.max(0, cur - stampsEarned);
    addTxn({
      customerId: customer.id,
      orderId: order.id,
      programId: "prog-stamp-kopi",
      txType: "reversal",
      stampsChange: -stampsEarned,
      description: `Void order: −${stampsEarned} stamp`,
      createdBy
    });
  }

  // Voucher yang dipakai di order ini → aktifkan kembali (refundable)
  let restored = 0;
  for (const v of store().vouchers) {
    if (v.usedOrderId === order.id && v.status === "used") {
      v.status = "active";
      v.usedOrderId = undefined;
      v.usedAt = undefined;
      restored++;
      addTxn({
        customerId: v.customerId,
        orderId: order.id,
        txType: "reversal",
        description: `Void order: voucher ${v.code} dikembalikan (aktif lagi)`,
        createdBy
      });
    }
  }

  // Koreksi agregat
  customer.totalSpending = Math.max(0, customer.totalSpending - net);
  customer.totalTransactions = Math.max(0, customer.totalTransactions - 1);
  reassessTier(customer, createdBy);

  return { skipped: false, pointsEarned, pointsRedeemed, stampsEarned, vouchersRestored: restored };
}

// ---- Tier discount untuk checkout ----

/** Diskon tier (persen) untuk order subtotal tertentu. */
export function tierDiscountFor(customerId: string, subtotal: number) {
  ensureLoyaltySeeded();
  const customer = getCustomer(customerId);
  const tier = getTier(customer?.tierId);
  if (!tier || tier.discountPercent <= 0) return { tier, amount: 0 };
  return { tier, amount: Math.round((subtotal * tier.discountPercent) / 100) };
}

// ---- Redemption (dipanggil saat checkout, sebelum bayar) ----

/** Tukar poin → diskon. Commit langsung (potong poin). */
export function redeemPoints(input: {
  customerId: string;
  orderId: string;
  points: number;
  outletId: string;
  createdBy: string;
}): { error?: string; discount?: number } {
  ensureLoyaltySeeded();
  const customer = getCustomer(input.customerId);
  if (!customer) return { error: "Member tidak ditemukan." };
  if (input.points < POINT_MIN_REDEEM) return { error: `Minimal tukar ${POINT_MIN_REDEEM} poin.` };
  if (input.points > customer.totalPoints) return { error: "Poin tidak cukup." };

  const discount = pointsToRupiah(input.points);
  customer.totalPoints -= input.points;
  addTxn({
    customerId: customer.id,
    orderId: input.orderId,
    txType: "redeem_point",
    pointsChange: -input.points,
    description: `Tukar ${input.points} poin → diskon Rp${discount.toLocaleString("id-ID")}`,
    createdBy: input.createdBy
  });

  recordRedemption({
    customerId: customer.id,
    orderId: input.orderId,
    rewardType: "point_discount",
    rewardValue: discount,
    normalPrice: 0,
    promoCost: 0,
    redeemedBy: input.createdBy,
    outletId: input.outletId
  });

  return { discount };
}

/** Tandai voucher digunakan (commit saat checkout). */
export function useVoucher(input: {
  voucherId: string;
  orderId: string;
  outletId: string;
  orderSubtotal: number;
  createdBy: string;
}): { error?: string; voucher?: Voucher } {
  ensureLoyaltySeeded();
  const voucher = getVoucher(input.voucherId);
  if (!voucher || voucher.status !== "active") return { error: "Voucher tidak aktif." };
  if (voucher.validUntil && new Date(voucher.validUntil).getTime() < Date.now()) {
    voucher.status = "expired";
    return { error: "Voucher kedaluwarsa." };
  }
  if (voucher.outletScope !== "all" && !voucher.outletScope.includes(input.outletId)) {
    return { error: "Voucher tidak berlaku di outlet ini." };
  }
  if (voucher.minPurchaseAmount && input.orderSubtotal < voucher.minPurchaseAmount) {
    return { error: `Minimal transaksi Rp${voucher.minPurchaseAmount.toLocaleString("id-ID")}.` };
  }

  voucher.status = "used";
  voucher.usedOrderId = input.orderId;
  voucher.usedAt = new Date().toISOString();
  addTxn({
    customerId: voucher.customerId,
    orderId: input.orderId,
    programId: voucher.programId,
    txType: "voucher_used",
    description: `Voucher ${voucher.code} digunakan`,
    createdBy: input.createdBy
  });
  return { voucher };
}

export function recordRedemption(input: Omit<RewardRedemption, "id" | "createdAt">) {
  ensureLoyaltySeeded();
  const r: RewardRedemption = {
    ...input,
    id: nextId("RDM"),
    createdAt: new Date().toISOString()
  };
  store().rewardRedemptions.unshift(r);
  return r;
}

export function listRedemptions() {
  ensureLoyaltySeeded();
  return store().rewardRedemptions;
}

export function listTxnsForCustomer(customerId: string, limit = 30) {
  ensureLoyaltySeeded();
  return store().loyaltyTxns.filter((t) => t.customerId === customerId).slice(0, limit);
}

export type SegmentKey =
  | "new"
  | "loyal"
  | "high_spender"
  | "inactive"
  | "birthday";

export const SEGMENT_LABEL: Record<SegmentKey, string> = {
  new: "Member Baru",
  loyal: "Loyal",
  high_spender: "High Spender",
  inactive: "Tidak Aktif",
  birthday: "Ultah Bulan Ini"
};

/** Segmentasi terkomputasi (tanpa tabel statis) — dipakai marketing nanti. */
export function computeSegments(customer: Customer): SegmentKey[] {
  const now = new Date();
  const segs: SegmentKey[] = [];
  if (customer.totalTransactions <= 1 || daysSince(customer.createdAt) <= 30) segs.push("new");
  if (customer.totalTransactions >= 10) segs.push("loyal");
  if (customer.totalSpending >= 1_500_000) segs.push("high_spender");
  if (customer.totalTransactions > 0 && daysSince(customer.lastTransactionAt) >= INACTIVE_DAYS)
    segs.push("inactive");
  if (customer.birthDate && new Date(customer.birthDate).getMonth() === now.getMonth())
    segs.push("birthday");
  return segs;
}

export function getSegmentCounts() {
  ensureLoyaltySeeded();
  const counts: Record<SegmentKey, number> = {
    new: 0,
    loyal: 0,
    high_spender: 0,
    inactive: 0,
    birthday: 0
  };
  for (const c of store().customers) {
    for (const seg of computeSegments(c)) counts[seg]++;
  }
  return counts;
}

function isSameDay(iso: string, ref: Date) {
  const d = new Date(iso);
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
}

function daysSince(iso?: string) {
  if (!iso) return Infinity;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

/** Ringkasan untuk Owner Report Loyalty. */
export function getLoyaltySummary() {
  ensureLoyaltySeeded();
  const s = store();
  const now = new Date();
  const customers = s.customers;

  const totalMembers = customers.length;
  const activeMembers = customers.filter((c) => c.status === "active").length;
  const newToday = customers.filter((c) => isSameDay(c.createdAt, now)).length;
  const repeatCustomers = customers.filter((c) => c.totalTransactions > 1).length;
  const pointsOutstanding = customers.reduce((sum, c) => sum + c.totalPoints, 0);

  const activeVouchers = s.vouchers.filter((v) => v.status === "active").length;
  const usedVouchers = s.vouchers.filter((v) => v.status === "used").length;
  const stampRewardsIssued = s.vouchers.filter((v) => v.source === "stamp_reward").length;
  const stampRewardsRedeemed = s.vouchers.filter(
    (v) => v.source === "stamp_reward" && v.status === "used"
  ).length;

  const promoCostTotal = s.rewardRedemptions.reduce((sum, r) => sum + r.promoCost, 0);
  const promoCostToday = s.rewardRedemptions
    .filter((r) => isSameDay(r.createdAt, now))
    .reduce((sum, r) => sum + r.promoCost, 0);
  const discountTotal = s.rewardRedemptions
    .filter((r) => r.rewardType !== "free_item")
    .reduce((sum, r) => sum + r.rewardValue, 0);

  const topSpenders = [...customers]
    .sort((a, b) => b.totalSpending - a.totalSpending)
    .slice(0, 5);
  const topFrequent = [...customers]
    .sort((a, b) => b.totalTransactions - a.totalTransactions)
    .slice(0, 5);
  const inactiveCustomers = customers
    .filter((c) => c.totalTransactions > 0 && daysSince(c.lastTransactionAt) >= 30)
    .sort((a, b) => daysSince(b.lastTransactionAt) - daysSince(a.lastTransactionAt))
    .slice(0, 10);

  // Menu favorit member (dari order ber-customer)
  const menuCount = new Map<string, { name: string; qty: number }>();
  for (const order of s.posOrders) {
    if (!order.customerId || order.status !== "completed") continue;
    for (const item of order.items) {
      const key = item.menuItemId ?? item.nameSnapshot;
      const cur = menuCount.get(key) ?? { name: item.nameSnapshot, qty: 0 };
      cur.qty += item.qty;
      menuCount.set(key, cur);
    }
  }
  const favoriteMenus = Array.from(menuCount.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // Distribusi tier
  const tierDistribution = s.membershipTiers.map((t) => ({
    tier: t,
    count: customers.filter((c) => (c.tierId ?? "tier-basic") === t.id).length
  }));

  // Voucher per sumber kampanye
  const autoVouchers = {
    firstPurchase: s.vouchers.filter((v) => v.source === "first_purchase").length,
    birthday: s.vouchers.filter((v) => v.source === "birthday").length,
    winback: s.vouchers.filter((v) => v.source === "winback").length
  };

  return {
    totalMembers,
    activeMembers,
    newToday,
    repeatCustomers,
    pointsOutstanding,
    activeVouchers,
    usedVouchers,
    stampRewardsIssued,
    stampRewardsRedeemed,
    promoCostTotal,
    promoCostToday,
    discountTotal,
    topSpenders,
    topFrequent,
    inactiveCustomers,
    favoriteMenus,
    tierDistribution,
    segmentCounts: getSegmentCounts(),
    autoVouchers
  };
}

export { ensureLoyaltySeeded };
