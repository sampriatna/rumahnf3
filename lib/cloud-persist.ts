import { isSupabaseConfigured, supabaseAdmin } from "./supabase";
import { pushLoyalty, pullLoyalty, type LoyaltySnapshot } from "./db/loyalty-repo";
import { pushPos, pullPos, type PosSnapshot } from "./db/pos-repo";
import { pushInventory, pullInventory, type InventorySnapshot } from "./db/inventory-repo";
import { pushFinance, pullFinance, type FinanceSnapshot } from "./db/finance-repo";
import { pushForms, pullForms, type FormsSnapshot } from "./db/forms-repo";
import { pushReports, pullReports, ratingsFromSubmissions, type ReportsSnapshot } from "./db/reports-repo";
import { seedItems, seedStock } from "./inventory";
import { seedSuppliers } from "./purchasing";
import { seedAccountBalances, seedDebts, seedReceivables } from "./finance";
import type { Submission } from "./store";

// ============================================================================
// Persistensi ke Supabase.
//   • app_state (jsonb)  : snapshot seluruh store — backup cloud durable.
//   • tabel relasional   : modul yang sudah dimigrasi (D2b), mulai dari loyalty.
// SEMUA dibungkus try/catch agar app tetap jalan walau Supabase belum siap.
// ============================================================================

const ROW_ID = "main";

const LOYALTY_KEYS: (keyof LoyaltySnapshot)[] = [
  "customers",
  "membershipTiers",
  "loyaltyPrograms",
  "loyaltyTxns",
  "vouchers",
  "rewardRedemptions"
];

function extractLoyalty(serial: unknown): LoyaltySnapshot | null {
  if (!serial || typeof serial !== "object") return null;
  const s = serial as Record<string, unknown>;
  if (!Array.isArray(s.customers)) return null;
  const snap = {} as LoyaltySnapshot;
  for (const k of LOYALTY_KEYS) {
    (snap as Record<string, unknown>)[k] = Array.isArray(s[k]) ? s[k] : [];
  }
  return snap;
}

/** Sinkron tabel relasional loyalty dari snapshot store. Re-export untuk store. */
export async function cloudSaveLoyalty(serial: unknown): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const snap = extractLoyalty(serial);
  if (snap) await pushLoyalty(snap);
}

/** Muat loyalty dari tabel relasional (sumber kebenaran modul ini). */
export async function cloudLoadLoyalty(): Promise<LoyaltySnapshot | null> {
  if (!isSupabaseConfigured()) return null;
  return pullLoyalty();
}

const POS_KEYS: (keyof PosSnapshot)[] = [
  "posRegisters",
  "menuCategories",
  "menuItems",
  "menuModifiers",
  "menuItemModifierLinks",
  "menuItemVariants",
  "menuCatalogMeta",
  "posRecipes",
  "posShifts",
  "posOrders",
  "kdsStations",
  "kdsTickets",
  "notesCategories",
  "menuPackages",
  "menuPackageItems",
  "posPromotions",
  "salesChannels",
  "menuBranchSettings",
  "cancelReasons",
  "cashierVouchers",
  "menuPriceSchedules",
  "posMenuLayouts",
  "posPaymentMethods",
  "tableSections",
  "floorTables"
];

function extractPos(serial: unknown): PosSnapshot | null {
  if (!serial || typeof serial !== "object") return null;
  const s = serial as Record<string, unknown>;
  const snap = {} as PosSnapshot;
  let any = false;
  for (const k of POS_KEYS) {
    const raw = s[k];
    if (k === "menuItemModifierLinks" || k === "menuCatalogMeta") {
      if (raw && typeof raw === "object" && Object.keys(raw as object).length) {
        any = true;
        (snap as Record<string, unknown>)[k] = raw;
      } else {
        (snap as Record<string, unknown>)[k] = {};
      }
    } else {
      const v = Array.isArray(raw) ? (raw as unknown[]) : [];
      if (v.length) any = true;
      (snap as Record<string, unknown>)[k] = v;
    }
  }
  return any ? snap : null;
}

/** Sinkron tabel relasional POS/KDS dari snapshot store. */
export async function cloudSavePos(serial: unknown): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const snap = extractPos(serial);
  if (snap) await pushPos(snap);
}

/** Muat POS/KDS dari tabel relasional (sumber kebenaran modul ini). */
export async function cloudLoadPos(): Promise<PosSnapshot | null> {
  if (!isSupabaseConfigured()) return null;
  return pullPos();
}

function extractInventory(serial: unknown): InventorySnapshot | null {
  if (!serial || typeof serial !== "object") return null;
  const s = serial as Record<string, unknown>;
  const items = Array.isArray(s.items) ? (s.items as InventorySnapshot["items"]) : [];
  // Modul lazy-seed: bila belum pernah dibuka, tulis demo seed ke relasional.
  if (items.length === 0) {
    return {
      items: seedItems(),
      stock: seedStock(),
      movements: [],
      suppliers: seedSuppliers(),
      purchaseRequests: [],
      purchaseOrders: [],
      stockTransferRequests: []
    };
  }
  return {
    items,
    stock: (s.stock && typeof s.stock === "object" ? s.stock : {}) as InventorySnapshot["stock"],
    movements: Array.isArray(s.movements) ? (s.movements as InventorySnapshot["movements"]) : [],
    suppliers: Array.isArray(s.suppliers) ? (s.suppliers as InventorySnapshot["suppliers"]) : [],
    purchaseRequests: Array.isArray(s.purchaseRequests)
      ? (s.purchaseRequests as InventorySnapshot["purchaseRequests"])
      : [],
    purchaseOrders: Array.isArray(s.purchaseOrders)
      ? (s.purchaseOrders as InventorySnapshot["purchaseOrders"])
      : [],
    stockTransferRequests: Array.isArray(s.stockTransferRequests)
      ? (s.stockTransferRequests as InventorySnapshot["stockTransferRequests"])
      : []
  };
}

/** Sinkron tabel relasional Inventory dari snapshot store. */
export async function cloudSaveInventory(serial: unknown): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const snap = extractInventory(serial);
  if (snap) await pushInventory(snap);
}

/** Muat Inventory dari tabel relasional (sumber kebenaran modul ini). */
export async function cloudLoadInventory(): Promise<InventorySnapshot | null> {
  if (!isSupabaseConfigured()) return null;
  return pullInventory();
}

function extractFinance(serial: unknown): FinanceSnapshot {
  if (!serial || typeof serial !== "object") {
    return {
      accountBalances: seedAccountBalances(),
      ledger: [],
      debts: seedDebts(),
      receivables: seedReceivables(),
      heldCash: [],
      chartOfAccounts: [],
      financeSeeded: true
    };
  }
  const s = serial as Record<string, unknown>;
  const seeded = Boolean(s.financeSeeded);
  const balances = s.accountBalances as FinanceSnapshot["accountBalances"] | undefined;
  if (!seeded || !balances || typeof balances !== "object" || Object.keys(balances).length === 0) {
    return {
      accountBalances: seedAccountBalances(),
      ledger: [],
      debts: seedDebts(),
      receivables: seedReceivables(),
      heldCash: [],
      chartOfAccounts: [],
      financeSeeded: true
    };
  }
  return {
    accountBalances: balances,
    ledger: Array.isArray(s.ledger) ? (s.ledger as FinanceSnapshot["ledger"]) : [],
    debts: Array.isArray(s.debts) ? (s.debts as FinanceSnapshot["debts"]) : [],
    receivables: Array.isArray(s.receivables) ? (s.receivables as FinanceSnapshot["receivables"]) : [],
    heldCash: Array.isArray(s.heldCash) ? (s.heldCash as FinanceSnapshot["heldCash"]) : [],
    chartOfAccounts: Array.isArray(s.chartOfAccounts)
      ? (s.chartOfAccounts as FinanceSnapshot["chartOfAccounts"])
      : [],
    financeSeeded: true
  };
}

/** Sinkron tabel relasional Finance dari snapshot store. */
export async function cloudSaveFinance(serial: unknown): Promise<void> {
  if (!isSupabaseConfigured()) return;
  await pushFinance(extractFinance(serial));
}

/** Muat Finance dari tabel relasional (sumber kebenaran modul ini). */
export async function cloudLoadFinance(): Promise<FinanceSnapshot | null> {
  if (!isSupabaseConfigured()) return null;
  return pullFinance();
}

function extractForms(serial: unknown): FormsSnapshot {
  if (!serial || typeof serial !== "object") {
    return { submissions: [], approvals: [], notificationLogs: [] };
  }
  const s = serial as Record<string, unknown>;
  return {
    submissions: Array.isArray(s.submissions) ? (s.submissions as FormsSnapshot["submissions"]) : [],
    approvals: Array.isArray(s.approvals) ? (s.approvals as FormsSnapshot["approvals"]) : [],
    notificationLogs: Array.isArray(s.notificationLogs)
      ? (s.notificationLogs as FormsSnapshot["notificationLogs"])
      : []
  };
}

/** Sinkron tabel relasional Forms/Approval dari snapshot store. */
export async function cloudSaveForms(serial: unknown): Promise<void> {
  if (!isSupabaseConfigured()) return;
  await pushForms(extractForms(serial));
}

/** Muat Forms/Approval dari tabel relasional (sumber kebenaran modul ini). */
export async function cloudLoadForms(): Promise<FormsSnapshot | null> {
  if (!isSupabaseConfigured()) return null;
  return pullForms();
}

function extractReports(serial: unknown): ReportsSnapshot {
  if (!serial || typeof serial !== "object") {
    return { aiInsights: [], customerRatings: [] };
  }
  const s = serial as Record<string, unknown>;
  const submissions = Array.isArray(s.submissions) ? (s.submissions as Submission[]) : [];
  return {
    aiInsights: Array.isArray(s.aiInsights) ? (s.aiInsights as ReportsSnapshot["aiInsights"]) : [],
    customerRatings: ratingsFromSubmissions(submissions)
  };
}

/** Sinkron tabel relasional Reports/AI dari snapshot store. */
export async function cloudSaveReports(serial: unknown): Promise<void> {
  if (!isSupabaseConfigured()) return;
  await pushReports(extractReports(serial));
}

/** Muat Reports/AI dari tabel relasional (sumber kebenaran modul ini). */
export async function cloudLoadReports(): Promise<ReportsSnapshot | null> {
  if (!isSupabaseConfigured()) return null;
  return pullReports();
}

/** Simpan snapshot store (sudah diserialisasi) ke cloud. Aman & non-blocking. */
export async function cloudSave(serial: unknown): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    await supabaseAdmin()
      .from("app_state")
      .upsert({ id: ROW_ID, data: serial, updated_at: new Date().toISOString() });
  } catch {
    /* abaikan — fallback ke disk/in-memory */
  }
  // Sinkron juga ke tabel relasional (D2b). Aman bila tabel belum dibuat.
  await cloudSaveLoyalty(serial);
  await cloudSavePos(serial);
  await cloudSaveInventory(serial);
  await cloudSaveFinance(serial);
  await cloudSaveForms(serial);
  await cloudSaveReports(serial);
}

/** Muat snapshot store dari cloud. Return null bila kosong / belum siap. */
export async function cloudLoad(): Promise<Record<string, unknown> | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabaseAdmin()
      .from("app_state")
      .select("data")
      .eq("id", ROW_ID)
      .maybeSingle();
    if (error || !data) return null;
    return (data.data as Record<string, unknown>) ?? null;
  } catch {
    return null;
  }
}
