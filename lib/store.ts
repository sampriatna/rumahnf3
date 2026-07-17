import fs from "fs";
import path from "path";
import { cloudLoad, cloudSave, cloudLoadLoyalty, cloudLoadPos, cloudLoadInventory, cloudLoadFinance, cloudLoadForms, cloudLoadReports } from "./cloud-persist";
import type { RequestStatus } from "./feedback";
import type { FormType } from "./forms";
import type { Approval } from "./approval";
import type { NotificationLog } from "./wa";
import type { AiInsight } from "./ai-advisor";
import type { Item, StockMovement } from "./inventory";
import type { Supplier, PurchaseRequest, PurchaseOrder } from "./purchasing";
import type { StockTransferRequest } from "./transfer";
import type { LedgerEntry, Debt, Receivable, HeldCash, AccountId } from "./finance";
import type {
  PosShift,
  PosOrder,
  PosRegister,
  PosStoreDay,
  PosSyncQueueItem,
  PosAttendanceRecord,
  MenuCategory,
  MenuItem,
  MenuItemVariant,
  MenuModifier,
  MenuCatalogMeta,
  KdsTicket
} from "./pos-kds-roadmap";
import type { KdsOrderTicket } from "@/types/kds";
import type { KdsStation } from "./station-service";
import type { NotesCategory } from "./notes-category-service";
import type { TableSection, FloorTable } from "./floor-service";
import type { MenuPackage, MenuPackageItem } from "./package-service";
import type { PosPromotion } from "./promotion-service";
import type { SalesChannel } from "./channel-service";
import type { MenuBranchSetting } from "./branch-menu-service";
import type { CancelReason } from "./cancel-reason-service";
import type { CashierVoucher } from "./cashier-voucher-service";
import type { MenuPriceSchedule } from "./price-schedule-service";
import type { PosMenuLayout } from "./pos-menu-layout-service";
import type { ChartOfAccount } from "./coa-service";
import type { PosPaymentMethodMaster } from "./payment-method-service";

import type { MenuRecipe } from "./pos-recipes";
import type {
  Customer,
  LoyaltyProgram,
  LoyaltyTxn,
  Voucher,
  RewardRedemption,
  MembershipTier,
  MemberDepositTxn
} from "./loyalty";

export type PosCartLine = {
  lineId: string;
  menuItemId: string;
  name: string;
  unitPrice: number;
  qty: number;
  /** @deprecated legacy variant marker — use variantId */
  note?: string;
  variantId?: string;
  kitchenNote?: string;
  packageId?: string;
  isPackageBundle?: boolean;
  modifiers?: Array<{ name: string; priceDelta: number }>;
};

// Penyimpanan in-memory + disk + Supabase (D2b relasional untuk forms/approval).

export type StatusEvent = {
  status: RequestStatus;
  note?: string;
  at: string; // ISO
  byName: string;
};

export type Submission = {
  id: string;
  formType: FormType;
  formLabel: string;
  outletId?: string;
  outletName?: string;
  area?: string;
  submittedById: string;
  submittedByName: string;
  payload: Record<string, string>;
  photoName?: string;
  status: RequestStatus;
  history: StatusEvent[];
  createsTask: boolean;
  needsApproval: boolean;
  approvalId?: string;
  createdAt: string; // ISO
};

type Store = {
  submissions: Submission[];
  approvals: Approval[];
  notificationLogs: NotificationLog[];
  aiInsights: AiInsight[];
  items: Item[];
  stock: Record<string, number>;
  movements: StockMovement[];
  suppliers: Supplier[];
  purchaseRequests: PurchaseRequest[];
  purchaseOrders: PurchaseOrder[];
  stockTransferRequests: StockTransferRequest[];
  financeSeeded: boolean;
  accountBalances: Record<AccountId, number>;
  ledger: LedgerEntry[];
  debts: Debt[];
  receivables: Receivable[];
  heldCash: HeldCash[];
  posSeeded: boolean;
  posRegisters: PosRegister[];
  menuCategories: MenuCategory[];
  menuItems: MenuItem[];
  menuModifiers: MenuModifier[];
  /** menuItemId → modifierId[] — assign add-on ke produk. */
  menuItemModifierLinks: Record<string, string[]>;
  menuItemVariants: MenuItemVariant[];
  menuCatalogMeta: Record<string, MenuCatalogMeta>;
  posShifts: PosShift[];
  posStoreDays: PosStoreDay[];
  posOrders: PosOrder[];
  /** Fase C — antrean push transaksi ke cloud. */
  posSyncQueue: PosSyncQueueItem[];
  /** Fase D — absensi staf POS. */
  posAttendanceRecords: PosAttendanceRecord[];
  posCarts: Record<string, PosCartLine[]>;
  posOrderDaySeq: Record<string, number>;
  kdsSeeded: boolean;
  kdsStations: KdsStation[];
  kdsTickets: KdsTicket[];
  kdsTicketSeq: Record<string, number>;
  notesCategories: NotesCategory[];
  menuPackages: MenuPackage[];
  menuPackageItems: MenuPackageItem[];
  posPromotions: PosPromotion[];
  salesChannels: SalesChannel[];
  menuBranchSettings: MenuBranchSetting[];
  cancelReasons: CancelReason[];
  cashierVouchers: CashierVoucher[];
  menuPriceSchedules: MenuPriceSchedule[];
  posMenuLayouts: PosMenuLayout[];
  chartOfAccounts: ChartOfAccount[];
  posPaymentMethods: PosPaymentMethodMaster[];
  /** KDS board v2 — order-level tickets (dummy / produksi). */
  kdsBoardSeeded: boolean;
  kdsBoardTickets: KdsOrderTicket[];
  kdsBoardServedToday: Record<string, number>;
  posRecipes: MenuRecipe[];
  floorSeeded: boolean;
  tableSections: TableSection[];
  floorTables: FloorTable[];
  loyaltySeeded: boolean;
  customers: Customer[];
  loyaltyPrograms: LoyaltyProgram[];
  membershipTiers: MembershipTier[];
  loyaltyTxns: LoyaltyTxn[];
  vouchers: Voucher[];
  rewardRedemptions: RewardRedemption[];
  /** Fase D — ledger deposit member. */
  memberDepositTxns: MemberDepositTxn[];
  sopReads: Set<string>;
  /** Ops — jam sepi: cooldown WA per outlet. */
  quietHourLastAlert?: Record<string, string>;
  quietTrafficSeeded?: boolean;
  /** Log eksekusi cron (untuk pantau production). */
  cronRuns?: CronRunLog[];
  seq: number;
};

export type CronRunLog = {
  job: string;
  at: string;
  ok: boolean;
  detail?: string;
};

const g = globalThis as unknown as {
  __NF3_STORE__?: Store;
  __NF3_AUTOSAVE__?: ReturnType<typeof setInterval>;
  __NF3_CLOUDSAVE__?: ReturnType<typeof setInterval>;
  __NF3_CLOUD_RESTORED__?: boolean;
};

// --- Persistensi data (prototipe) ---------------------------------------------
// Lapis 1: disk lokal (.data/nf3-store.json) — cepat, bertahan saat restart.
// Lapis 2: Supabase (nf3.app_state) — backup cloud durable, lintas mesin.
// SEMUA dibungkus try/catch & hanya jalan di server. Jika Supabase belum siap,
// aplikasi tetap jalan dari disk/seed. Fase berikutnya: tabel relasional.
const STORE_FILE = path.join(process.cwd(), ".data", "nf3-store.json");

function serialize(s: Store) {
  return { ...s, sopReads: Array.from(s.sopReads) };
}

function deserialize(parsed: Record<string, unknown>): Store {
  const obj = { ...parsed } as Partial<Store> & { sopReads?: unknown };
  if (Array.isArray(obj.sopReads)) obj.sopReads = new Set<string>(obj.sopReads as string[]);
  return patchStore(obj as Partial<Store>);
}

function loadFromDisk(): Partial<Store> | null {
  if (typeof window !== "undefined") return null;
  try {
    if (!fs.existsSync(STORE_FILE)) return null;
    const parsed = JSON.parse(fs.readFileSync(STORE_FILE, "utf8"));
    if (Array.isArray(parsed.sopReads)) parsed.sopReads = new Set<string>(parsed.sopReads);
    return parsed;
  } catch {
    return null;
  }
}

function saveToDisk(s: Store) {
  if (typeof window !== "undefined") return;
  try {
    const dir = path.dirname(STORE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STORE_FILE, JSON.stringify(serialize(s)), "utf8");
  } catch {
    /* abaikan — fallback ke in-memory */
  }
}

function scheduleAutosave() {
  if (typeof window !== "undefined") return;
  if (!g.__NF3_AUTOSAVE__) {
    try {
      const timer = setInterval(() => {
        if (g.__NF3_STORE__) saveToDisk(g.__NF3_STORE__);
      }, 2000);
      (timer as unknown as { unref?: () => void }).unref?.();
      g.__NF3_AUTOSAVE__ = timer;
    } catch {
      /* abaikan */
    }
  }
  if (!g.__NF3_CLOUDSAVE__) {
    try {
      const timer = setInterval(() => {
        if (g.__NF3_STORE__) void cloudSave(serialize(g.__NF3_STORE__));
      }, 8000);
      (timer as unknown as { unref?: () => void }).unref?.();
      g.__NF3_CLOUDSAVE__ = timer;
    } catch {
      /* abaikan */
    }
  }
}

/**
 * Gabungkan shift lokal + relasional saat cold start.
 * Status "closed" diutamakan agar tutup shift tidak hidup lagi dari DB stale.
 */
export function mergePosShifts(local: PosShift[], remote: PosShift[]): PosShift[] {
  const byId = new Map<string, PosShift>();
  for (const sh of remote) byId.set(sh.id, sh);
  for (const sh of local) {
    const existing = byId.get(sh.id);
    if (!existing) {
      byId.set(sh.id, sh);
      continue;
    }
    if (sh.status === "closed" && existing.status === "open") {
      byId.set(sh.id, sh);
      continue;
    }
    if (sh.status === "open" && existing.status === "closed") continue;
    const localTs = Date.parse(sh.closedAt ?? sh.openedAt);
    const remoteTs = Date.parse(existing.closedAt ?? existing.openedAt);
    if (localTs >= remoteTs) byId.set(sh.id, sh);
  }
  return [...byId.values()];
}

/**
 * Boot mesin baru / disk hilang: pulihkan dari cloud sekali.
 * Hanya jalan saat disk lokal kosong, agar tidak menimpa data lokal yang aktif.
 */
function scheduleCloudRestore() {
  if (typeof window !== "undefined" || g.__NF3_CLOUD_RESTORED__) return;
  g.__NF3_CLOUD_RESTORED__ = true;
  void (async () => {
    try {
      const cloud = await cloudLoad();
      if (cloud && Object.keys(cloud).length > 0) {
        g.__NF3_STORE__ = deserialize(cloud);
      }
      // Loyalty (D2b): tabel relasional = sumber kebenaran modul ini.
      const loyalty = await cloudLoadLoyalty();
      if (loyalty && g.__NF3_STORE__) {
        const s = g.__NF3_STORE__;
        const localDepositTxns = s.memberDepositTxns ?? [];
        s.customers = loyalty.customers;
        s.membershipTiers = loyalty.membershipTiers;
        s.loyaltyPrograms = loyalty.loyaltyPrograms;
        s.loyaltyTxns = loyalty.loyaltyTxns;
        s.vouchers = loyalty.vouchers;
        s.rewardRedemptions = loyalty.rewardRedemptions;
        s.memberDepositTxns = localDepositTxns;
        s.loyaltySeeded = true;
      }
      // POS/KDS (D2b): tabel relasional = sumber kebenaran modul ini.
      const pos = await cloudLoadPos();
      if (pos && g.__NF3_STORE__) {
        const s = g.__NF3_STORE__;
        const localSyncQueue = s.posSyncQueue ?? [];
        const localAttendance = s.posAttendanceRecords ?? [];
        const localDepositTxns = s.memberDepositTxns ?? [];
        s.posRegisters = pos.posRegisters;
        s.menuCategories = pos.menuCategories;
        s.menuItems = pos.menuItems;
        if (pos.menuModifiers?.length) s.menuModifiers = pos.menuModifiers;
        if (pos.menuItemModifierLinks && Object.keys(pos.menuItemModifierLinks).length) {
          s.menuItemModifierLinks = pos.menuItemModifierLinks;
        }
        if (pos.menuItemVariants?.length) s.menuItemVariants = pos.menuItemVariants;
        if (pos.menuCatalogMeta && Object.keys(pos.menuCatalogMeta).length) {
          s.menuCatalogMeta = pos.menuCatalogMeta;
        }
        s.posRecipes = pos.posRecipes;
        s.posShifts = mergePosShifts(s.posShifts ?? [], pos.posShifts);
        s.posOrders = pos.posOrders;
        s.posSyncQueue = localSyncQueue;
        s.posAttendanceRecords = localAttendance;
        s.memberDepositTxns = localDepositTxns;
        s.kdsStations = pos.kdsStations;
        s.kdsTickets = pos.kdsTickets;
        if (pos.tableSections?.length) s.tableSections = pos.tableSections;
        if (pos.floorTables?.length) {
          s.floorTables = pos.floorTables;
          s.floorSeeded = true;
        }
        if (pos.notesCategories?.length) s.notesCategories = pos.notesCategories;
        if (pos.menuPackages?.length) s.menuPackages = pos.menuPackages;
        if (pos.menuPackageItems?.length) s.menuPackageItems = pos.menuPackageItems;
        if (pos.posPromotions?.length) s.posPromotions = pos.posPromotions;
        if (pos.salesChannels?.length) s.salesChannels = pos.salesChannels;
        if (pos.menuBranchSettings?.length) s.menuBranchSettings = pos.menuBranchSettings;
        if (pos.cancelReasons?.length) s.cancelReasons = pos.cancelReasons;
        if (pos.cashierVouchers?.length) s.cashierVouchers = pos.cashierVouchers;
        if (pos.menuPriceSchedules?.length) s.menuPriceSchedules = pos.menuPriceSchedules;
        if (pos.posMenuLayouts?.length) s.posMenuLayouts = pos.posMenuLayouts;
        if (pos.posPaymentMethods?.length) s.posPaymentMethods = pos.posPaymentMethods;
        s.posSeeded = true;
        s.kdsSeeded = true;
      }
      // Inventory (D2b): tabel relasional = sumber kebenaran modul ini.
      const inv = await cloudLoadInventory();
      if (inv && g.__NF3_STORE__) {
        const s = g.__NF3_STORE__;
        s.items = inv.items;
        s.stock = inv.stock;
        s.movements = inv.movements;
        s.suppliers = inv.suppliers;
        s.purchaseRequests = inv.purchaseRequests;
        s.purchaseOrders = inv.purchaseOrders;
        s.stockTransferRequests = inv.stockTransferRequests ?? [];
      }
      // Finance (D2b): tabel relasional = sumber kebenaran modul ini.
      const fin = await cloudLoadFinance();
      if (fin && g.__NF3_STORE__) {
        const s = g.__NF3_STORE__;
        s.accountBalances = fin.accountBalances;
        s.ledger = fin.ledger;
        s.debts = fin.debts;
        s.receivables = fin.receivables;
        s.heldCash = fin.heldCash;
        s.financeSeeded = fin.financeSeeded;
        if (fin.chartOfAccounts?.length) s.chartOfAccounts = fin.chartOfAccounts;
      }
      // Forms/Approval (D2b): tabel relasional = sumber kebenaran modul ini.
      const forms = await cloudLoadForms();
      if (forms && g.__NF3_STORE__) {
        const s = g.__NF3_STORE__;
        s.submissions = forms.submissions;
        s.approvals = forms.approvals;
        s.notificationLogs = forms.notificationLogs;
      }
      // Reports/AI (D2b): overlay ai_insights dari relasional.
      const reports = await cloudLoadReports();
      if (reports && g.__NF3_STORE__) {
        g.__NF3_STORE__.aiInsights = reports.aiInsights;
      }
      if (g.__NF3_STORE__) saveToDisk(g.__NF3_STORE__);
    } catch {
      /* abaikan */
    }
  })();
}

/** Paksa simpan sekarang (disk + cloud). */
export function persistStore() {
  if (!g.__NF3_STORE__) return;
  saveToDisk(g.__NF3_STORE__);
  void cloudSave(serialize(g.__NF3_STORE__));
}

function init(): Store {
  return {
    submissions: [],
    approvals: [],
    notificationLogs: [],
    aiInsights: [],
    items: [],
    stock: {},
    movements: [],
    suppliers: [],
    purchaseRequests: [],
    purchaseOrders: [],
    stockTransferRequests: [],
    financeSeeded: false,
    accountBalances: {} as Record<AccountId, number>,
    ledger: [],
    debts: [],
    receivables: [],
    heldCash: [],
    posSeeded: false,
    posRegisters: [],
    menuCategories: [],
    menuItems: [],
    menuModifiers: [],
    menuItemModifierLinks: {},
    menuItemVariants: [],
    menuCatalogMeta: {},
    posShifts: [],
    posStoreDays: [],
    posOrders: [],
    posSyncQueue: [],
    posAttendanceRecords: [],
    posCarts: {},
    posOrderDaySeq: {},
    kdsSeeded: false,
    kdsStations: [],
    kdsTickets: [],
    kdsTicketSeq: {},
    notesCategories: [],
    menuPackages: [],
    menuPackageItems: [],
    posPromotions: [],
    salesChannels: [],
    menuBranchSettings: [],
    cancelReasons: [],
    cashierVouchers: [],
    menuPriceSchedules: [],
    posMenuLayouts: [],
    chartOfAccounts: [],
    posPaymentMethods: [],
    kdsBoardSeeded: false,
    kdsBoardTickets: [],
    kdsBoardServedToday: {},
    posRecipes: [],
    floorSeeded: false,
    tableSections: [],
    floorTables: [],
    loyaltySeeded: false,
    customers: [],
    loyaltyPrograms: [],
    membershipTiers: [],
    loyaltyTxns: [],
    vouchers: [],
    rewardRedemptions: [],
    memberDepositTxns: [],
    sopReads: new Set(),
    quietHourLastAlert: {},
    quietTrafficSeeded: false,
    cronRuns: [],
    seq: 1
  };
}

/** Isi field yang belum ada setelah hot-reload / fase baru. */
function patchStore(s: Partial<Store>): Store {
  const d = init();
  return {
    ...d,
    ...s,
    submissions: s.submissions ?? d.submissions,
    approvals: s.approvals ?? d.approvals,
    notificationLogs: s.notificationLogs ?? d.notificationLogs,
    aiInsights: s.aiInsights ?? d.aiInsights,
    items: s.items ?? d.items,
    stock: s.stock ?? d.stock,
    movements: s.movements ?? d.movements,
    suppliers: s.suppliers ?? d.suppliers,
    purchaseRequests: s.purchaseRequests ?? d.purchaseRequests,
    purchaseOrders: s.purchaseOrders ?? d.purchaseOrders,
    stockTransferRequests: s.stockTransferRequests ?? d.stockTransferRequests,
    financeSeeded: s.financeSeeded ?? d.financeSeeded,
    accountBalances: s.accountBalances ?? d.accountBalances,
    ledger: s.ledger ?? d.ledger,
    debts: s.debts ?? d.debts,
    receivables: s.receivables ?? d.receivables,
    heldCash: s.heldCash ?? d.heldCash,
    posSeeded: s.posSeeded ?? d.posSeeded,
    posRegisters: s.posRegisters ?? d.posRegisters,
    menuCategories: s.menuCategories ?? d.menuCategories,
    menuItems: s.menuItems ?? d.menuItems,
    menuModifiers: s.menuModifiers ?? d.menuModifiers,
    menuItemModifierLinks: s.menuItemModifierLinks ?? d.menuItemModifierLinks,
    menuItemVariants: s.menuItemVariants ?? d.menuItemVariants,
    menuCatalogMeta: s.menuCatalogMeta ?? d.menuCatalogMeta,
    posShifts: s.posShifts ?? d.posShifts,
    posStoreDays: s.posStoreDays ?? d.posStoreDays,
    posOrders: s.posOrders ?? d.posOrders,
    posSyncQueue: s.posSyncQueue ?? d.posSyncQueue,
    posAttendanceRecords: s.posAttendanceRecords ?? d.posAttendanceRecords,
    posCarts: s.posCarts ?? d.posCarts,
    posOrderDaySeq: s.posOrderDaySeq ?? d.posOrderDaySeq,
    kdsSeeded: s.kdsSeeded ?? d.kdsSeeded,
    kdsStations: (s.kdsStations ?? d.kdsStations).map((st) => ({
      ...st,
      sortOrder: st.sortOrder ?? 0,
      active: st.active ?? true
    })),
    kdsTickets: s.kdsTickets ?? d.kdsTickets,
    kdsTicketSeq: s.kdsTicketSeq ?? d.kdsTicketSeq,
    notesCategories: s.notesCategories ?? d.notesCategories,
    menuPackages: s.menuPackages ?? d.menuPackages,
    menuPackageItems: s.menuPackageItems ?? d.menuPackageItems,
    posPromotions: s.posPromotions ?? d.posPromotions,
    salesChannels: s.salesChannels ?? d.salesChannels,
    menuBranchSettings: s.menuBranchSettings ?? d.menuBranchSettings,
    cancelReasons: s.cancelReasons ?? d.cancelReasons,
    cashierVouchers: s.cashierVouchers ?? d.cashierVouchers,
    menuPriceSchedules: s.menuPriceSchedules ?? d.menuPriceSchedules,
    posMenuLayouts: s.posMenuLayouts ?? d.posMenuLayouts,
    chartOfAccounts: s.chartOfAccounts ?? d.chartOfAccounts,
    posPaymentMethods: s.posPaymentMethods ?? d.posPaymentMethods,
    kdsBoardSeeded: s.kdsBoardSeeded ?? d.kdsBoardSeeded,
    kdsBoardTickets: s.kdsBoardTickets ?? d.kdsBoardTickets,
    kdsBoardServedToday: s.kdsBoardServedToday ?? d.kdsBoardServedToday,
    posRecipes: s.posRecipes ?? d.posRecipes,
    floorSeeded: s.floorSeeded ?? d.floorSeeded,
    tableSections: s.tableSections ?? d.tableSections,
    floorTables: s.floorTables ?? d.floorTables,
    loyaltySeeded: s.loyaltySeeded ?? d.loyaltySeeded,
    customers: s.customers ?? d.customers,
    loyaltyPrograms: s.loyaltyPrograms ?? d.loyaltyPrograms,
    membershipTiers: s.membershipTiers ?? d.membershipTiers,
    loyaltyTxns: s.loyaltyTxns ?? d.loyaltyTxns,
    vouchers: s.vouchers ?? d.vouchers,
    rewardRedemptions: s.rewardRedemptions ?? d.rewardRedemptions,
    memberDepositTxns: s.memberDepositTxns ?? d.memberDepositTxns,
    sopReads: s.sopReads instanceof Set ? s.sopReads : d.sopReads,
    quietHourLastAlert: s.quietHourLastAlert ?? d.quietHourLastAlert,
    quietTrafficSeeded: s.quietTrafficSeeded ?? d.quietTrafficSeeded,
    cronRuns: s.cronRuns ?? d.cronRuns,
    seq: typeof s.seq === "number" && !Number.isNaN(s.seq) ? s.seq : d.seq
  };
}

export function store(): Store {
  if (!g.__NF3_STORE__) {
    const disk = loadFromDisk();
    if (disk) {
      g.__NF3_STORE__ = patchStore(disk);
    } else {
      // Disk kosong: mulai dari seed lalu coba pulihkan dari cloud (async).
      g.__NF3_STORE__ = init();
      scheduleCloudRestore();
    }
  } else {
    g.__NF3_STORE__ = patchStore(g.__NF3_STORE__);
  }
  scheduleAutosave();
  return g.__NF3_STORE__;
}

export function nextId(prefix: string) {
  const s = store();
  const n = s.seq++;
  return `${prefix}-${String(n).padStart(4, "0")}`;
}

export function addSubmission(sub: Submission) {
  const s = store();
  if (!Array.isArray(s.submissions)) s.submissions = [];
  s.submissions.unshift(sub);
}

export function addApproval(approval: Approval) {
  const s = store();
  if (!Array.isArray(s.approvals)) s.approvals = [];
  s.approvals.unshift(approval);
}

export function addNotificationLog(log: NotificationLog) {
  store().notificationLogs.unshift(log);
}

export function recordCronRun(entry: CronRunLog) {
  const s = store();
  if (!s.cronRuns) s.cronRuns = [];
  s.cronRuns.unshift(entry);
  if (s.cronRuns.length > 50) s.cronRuns.length = 50;
}

export function recentCronRuns(job?: string, limit = 10) {
  const runs = store().cronRuns ?? [];
  const filtered = job ? runs.filter((r) => r.job === job) : runs;
  return filtered.slice(0, limit);
}

export function getSubmission(id: string) {
  return store().submissions.find((s) => s.id === id);
}

export function getApproval(id: string) {
  return store().approvals.find((a) => a.id === id);
}

export function getApprovalByRequestId(requestId: string) {
  return store().approvals.find((a) => a.requestId === requestId);
}

export function listByUser(userId: string) {
  return store().submissions.filter((s) => s.submittedById === userId);
}

export function listForScope(outletId?: string) {
  const all = store().submissions ?? [];
  if (!outletId) return all;
  return all.filter((s) => s.outletId === outletId);
}

export function listApprovals() {
  return store().approvals ?? [];
}

export function listSubmissions() {
  return store().submissions ?? [];
}

export function countPendingApprovals(filter?: (a: Approval) => boolean) {
  const pending = (store().approvals ?? []).filter((a) => a.status === "pending");
  return filter ? pending.filter(filter).length : pending.length;
}

export function addAiInsight(insight: AiInsight) {
  store().aiInsights.unshift(insight);
}

export function getLatestAiInsight() {
  return store().aiInsights[0];
}

export function listAiInsights(limit = 5) {
  return store().aiInsights.slice(0, limit);
}

export function listNotificationLogs(limit = 20) {
  return store().notificationLogs.slice(0, limit);
}

export function sopReadKey(sopId: string, userId: string) {
  return `${sopId}:${userId}`;
}

export function markSopRead(sopId: string, userId: string) {
  store().sopReads.add(sopReadKey(sopId, userId));
}

export function hasReadSop(sopId: string, userId: string) {
  return store().sopReads.has(sopReadKey(sopId, userId));
}
