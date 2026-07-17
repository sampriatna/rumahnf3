import type {
  PosShift,
  PosOrder,
  PosOrderItem,
  PosOrderPayment,
  PosPaymentMethod,
  PosOrderChannel,
  MenuCategory,
  MenuItem,
  PosRegister
} from "./pos-kds-roadmap";
import {
  resolvePaymentCoaAccount,
  resolveShiftBucket
} from "./payment-method-service";
import {
  seedPosRegisters,
  seedMenuCategories,
  seedMenuItems
} from "./pos-seed";
import { buildOutletMenu, getMenuItemForOutlet } from "./branch-menu-service";
import { validatePosOrderContext } from "./pos-order-validation";
import { sumOutletExpenses } from "./pos-outlet-expense";
import { isStoreClosedForDay } from "./pos-store-day";
import { touchOrderSync, touchShiftSync } from "./pos-sync-queue";
import { seedMenuModifiers, SEED_ITEM_MODIFIER_MAP, modifierKey, modifiersForMenuItem, itemHasModifiers } from "./pos-modifiers";
import { listVariantsForItem } from "./variant-service";
import {
  getMenuPackage,
  listPackageItems,
  packageComponentSummary,
  listMenuPackages,
  ensurePackagesReady
} from "./package-service";
import type { MenuPackage } from "./package-service";
import { voidKdsTicketForOrderItem, syncKdsFromOrder } from "./kds-service";
import { normalizeRegisterSettings } from "./pos-register-settings";
import type { MenuModifier } from "./pos-kds-roadmap";
import { store, nextId, addSubmission, addApproval, addNotificationLog, persistStore } from "./store";
import type { Submission, PosCartLine } from "./store";
import { outletDisplayName, toOutletCode } from "./outlet-identity";
import {
  resolveApproverLevel,
  extractAmount,
  extractReason,
  type Approval
} from "./approval";
import { formatApprovalPendingWa, sendWaNotification } from "./wa";
import { recordAuditEvent } from "./audit-log";

function ensurePosSeeded() {
  const s = store();
  if (!s.posSeeded) {
    s.posRegisters = seedPosRegisters();
    s.menuCategories = seedMenuCategories();
    s.menuItems = seedMenuItems();
    s.menuModifiers = seedMenuModifiers();
    s.menuItemModifierLinks = { ...SEED_ITEM_MODIFIER_MAP };
    s.posShifts = [];
    s.posOrders = [];
    s.posCarts = {};
    s.posOrderDaySeq = {};
    s.posSeeded = true;
  }
  if (!store().menuModifiers?.length) {
    store().menuModifiers = seedMenuModifiers();
  }
  for (const r of store().posRegisters) {
    r.settings = normalizeRegisterSettings(r.settings);
  }
}

function orderNumberFor(outletId: string) {
  const s = store();
  const code = toOutletCode(outletId);
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const seq = (s.posOrderDaySeq[outletId] ?? 0) + 1;
  s.posOrderDaySeq[outletId] = seq;
  return `${code}-${today}-${String(seq).padStart(3, "0")}`;
}

function sumPayments(payments: PosOrderPayment[]) {
  return payments
    .filter((p) => p.status === "captured")
    .reduce((sum, p) => sum + p.amount, 0);
}

function recalcOrderTotals(order: PosOrder) {
  order.subtotal = order.items
    .filter((it) => it.status !== "void")
    .reduce((sum, it) => sum + it.lineTotal, 0);
  order.total = order.subtotal - order.discountAmount + order.taxAmount + order.serviceChargeAmount;
  const paid = sumPayments(order.payments);
  if (paid <= 0) {
    order.paymentStatus = "unpaid";
  } else if (paid < order.total) {
    order.paymentStatus = "partial";
  } else {
    order.paymentStatus = "paid";
  }
}

function shiftPaymentBucket(outletId: string, method: PosPaymentMethod): "cash" | "qris" | "online" {
  return resolveShiftBucket(outletId, method);
}

function recomputeShiftTotals(shift: PosShift) {
  const orders = store().posOrders.filter(
    (o) => o.shiftId === shift.id && o.status === "completed"
  );
  let cash = 0;
  let qris = 0;
  let online = 0;
  let grand = 0;
  for (const o of orders) {
    for (const p of o.payments.filter((x) => x.status === "captured")) {
      const bucket = shiftPaymentBucket(o.outletId, p.method);
      if (bucket === "cash") cash += p.amount;
      else if (bucket === "qris") qris += p.amount;
      else online += p.amount;
      grand += p.amount;
    }
  }
  shift.systemCashTotal = cash;
  shift.systemQrisTotal = qris;
  shift.systemOnlineTotal = online;
  shift.systemGrandTotal = grand;
  shift.orderCount = orders.length;
}

export function getRegisters(outletId: string) {
  ensurePosSeeded();
  return store()
    .posRegisters.filter((r) => r.outletId === outletId && r.active)
    .map((r) => ({
      ...r,
      settings: normalizeRegisterSettings(r.settings)
    }));
}

export function getRegister(registerId: string) {
  ensurePosSeeded();
  const reg = store().posRegisters.find((r) => r.id === registerId);
  if (!reg) return undefined;
  return { ...reg, settings: normalizeRegisterSettings(reg.settings) };
}

export function updateRegister(input: {
  registerId: string;
  name?: string;
  settings?: Partial<import("./pos-register-settings").PosRegisterSettings>;
}) {
  ensurePosSeeded();
  const reg = store().posRegisters.find((r) => r.id === input.registerId);
  if (!reg) return { error: "Register tidak ditemukan." as const };

  if (input.name?.trim()) reg.name = input.name.trim();
  if (input.settings) {
    reg.settings = normalizeRegisterSettings({ ...reg.settings, ...input.settings });
  }
  return { register: { ...reg, settings: normalizeRegisterSettings(reg.settings) } };
}

export function getRegisterForShift(shiftId: string) {
  const shift = getShift(shiftId);
  if (!shift) return undefined;
  return getRegister(shift.registerId);
}

export function getMenuForOutlet(outletId: string): {
  categories: MenuCategory[];
  items: MenuItem[];
} {
  ensurePosSeeded();
  return buildOutletMenu(outletId);
}

export function getMenuModifiers(outletId: string): MenuModifier[] {
  ensurePosSeeded();
  return store().menuModifiers.filter((m) => m.outletId === outletId && m.active);
}

export function menuItemHasModifiers(menuItemId: string): boolean {
  return itemHasModifiers(menuItemId);
}

export function getModifiersForItem(menuItemId: string): MenuModifier[] {
  ensurePosSeeded();
  return modifiersForMenuItem(menuItemId, store().menuModifiers);
}

export function getVariantsForItem(menuItemId: string) {
  ensurePosSeeded();
  return listVariantsForItem(menuItemId);
}

export function getMenuItem(id: string) {
  ensurePosSeeded();
  return store().menuItems.find((i) => i.id === id);
}

function normalizeOutletOpenShifts(outletId: string) {
  const opens = store().posShifts.filter(
    (s) => s.outletId === outletId && s.status === "open"
  );
  if (opens.length <= 1) return;
  opens.sort((a, b) => Date.parse(b.openedAt) - Date.parse(a.openedAt));
  const now = new Date().toISOString();
  for (let i = 1; i < opens.length; i++) {
    const stale = opens[i];
    stale.status = "closed";
    stale.closedAt = now;
    stale.closedBy = "Sistem";
  }
  persistStore();
}

export function getOpenShift(outletId: string): PosShift | undefined {
  ensurePosSeeded();
  normalizeOutletOpenShifts(outletId);
  return store().posShifts.find((s) => s.outletId === outletId && s.status === "open");
}

export function getShift(id: string) {
  ensurePosSeeded();
  return store().posShifts.find((s) => s.id === id);
}

export function openShift(input: {
  outletId: string;
  registerId: string;
  shiftLabel: string;
  openingFloat: number;
  openedBy: string;
  openedByName: string;
}) {
  ensurePosSeeded();
  if (isStoreClosedForDay(input.outletId)) {
    return { error: "Toko ditutup hari ini. Minta leader buka toko dulu." };
  }
  const existing = getOpenShift(input.outletId);
  if (existing) return { error: "Shift masih terbuka.", shift: existing };

  const shift: PosShift = {
    id: nextId("SHF"),
    outletId: input.outletId,
    registerId: input.registerId,
    shiftLabel: input.shiftLabel,
    openedBy: input.openedByName,
    openingFloat: input.openingFloat,
    status: "open",
    openedAt: new Date().toISOString(),
    systemCashTotal: 0,
    systemQrisTotal: 0,
    systemOnlineTotal: 0,
    systemGrandTotal: 0,
    orderCount: 0
  };
  store().posShifts.unshift(shift);
  store().posCarts[shift.id] = [];
  persistStore();
  return { shift };
}

export function getCart(shiftId: string): PosCartLine[] {
  ensurePosSeeded();
  const cart = store().posCarts[shiftId] ?? [];
  for (const line of cart) {
    if (!line.lineId) line.lineId = nextId("CLN");
    if (!line.modifiers) line.modifiers = [];
  }
  return cart;
}

function cartLineUnitPrice(base: number, modifiers: Array<{ priceDelta: number }>) {
  return base + modifiers.reduce((s, m) => s + m.priceDelta, 0);
}

function formatLineName(name: string, modifiers: Array<{ name: string }>) {
  if (!modifiers.length) return name;
  return `${name} (${modifiers.map((m) => m.name).join(", ")})`;
}

export function addToCart(shiftId: string, menuItemId: string, qty = 1) {
  return addToCartWithModifiers(shiftId, menuItemId, [], qty);
}

function lineVariantId(line: PosCartLine): string {
  if (line.variantId) return line.variantId;
  if (line.note?.startsWith("var:")) return line.note.slice(4);
  return "";
}

export function addToCartWithModifiers(
  shiftId: string,
  menuItemId: string,
  modifiers: Array<{ name: string; priceDelta: number }> = [],
  qty = 1,
  variant?: { id: string; name: string; price: number },
  kitchenNote?: string
) {
  ensurePosSeeded();
  const shift = getShift(shiftId);
  const outletId = shift?.outletId ?? "";
  const item = outletId ? getMenuItemForOutlet(menuItemId, outletId) : getMenuItem(menuItemId);
  if (!item || item.soldOut) return null;
  const modKey = modifierKey(modifiers);
  const cart = getCart(shiftId);
  const basePrice = variant?.price ?? item.basePrice;
  const unitPrice = cartLineUnitPrice(basePrice, modifiers);
  const baseLabel = variant ? `${item.name} (${variant.name})` : item.name;
  const displayName = formatLineName(baseLabel, modifiers);
  const variantKey = variant?.id ?? "";
  const noteKey = kitchenNote?.trim() ?? "";
  const existing = cart.find(
    (l) =>
      l.menuItemId === menuItemId &&
      modifierKey(l.modifiers ?? []) === modKey &&
      l.unitPrice === unitPrice &&
      lineVariantId(l) === variantKey &&
      (l.kitchenNote ?? "") === noteKey
  );
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      lineId: nextId("CLN"),
      menuItemId: item.id,
      name: displayName,
      unitPrice,
      qty,
      variantId: variantKey || undefined,
      kitchenNote: noteKey || undefined,
      modifiers: modifiers.length ? modifiers : undefined
    });
  }
  store().posCarts[shiftId] = cart;
  return cart;
}

export function updateCartQty(shiftId: string, lineId: string, qty: number) {
  ensurePosSeeded();
  const cart = getCart(shiftId);
  const idx = cart.findIndex((l) => l.lineId === lineId);
  if (idx === -1) return cart;
  if (qty <= 0) cart.splice(idx, 1);
  else cart[idx].qty = qty;
  store().posCarts[shiftId] = cart;
  return cart;
}

export function clearCart(shiftId: string) {
  ensurePosSeeded();
  store().posCarts[shiftId] = [];
}

function cartLinesToOrderItems(cart: PosCartLine[]): PosOrderItem[] {
  const items: PosOrderItem[] = [];
  for (const line of cart) {
    if (line.isPackageBundle && line.packageId) {
      const pkg = getMenuPackage(line.packageId);
      const components = listPackageItems(line.packageId);
      const bundleNote = `Paket: ${pkg?.name ?? line.name}`;
      components.forEach((comp, idx) => {
        const menu = store().menuItems.find((m) => m.id === comp.menuItemId);
        const unitPrice = idx === 0 ? line.unitPrice : 0;
        items.push({
          id: nextId("OLI"),
          menuItemId: comp.menuItemId,
          nameSnapshot: menu?.name ?? comp.menuItemId,
          qty: comp.qty * line.qty,
          unitPrice,
          modifiersSnapshot: [],
          lineTotal: unitPrice * comp.qty * line.qty,
          note: bundleNote,
          status: "pending"
        });
      });
      if (!components.length) {
        items.push({
          id: nextId("OLI"),
          menuItemId: undefined,
          nameSnapshot: line.name,
          qty: line.qty,
          unitPrice: line.unitPrice,
          modifiersSnapshot: line.modifiers ?? [],
          lineTotal: line.unitPrice * line.qty,
          note: bundleNote,
          status: "pending"
        });
      }
      continue;
    }
    const mods = line.modifiers ?? [];
    items.push({
      id: nextId("OLI"),
      menuItemId: line.menuItemId,
      nameSnapshot: line.name,
      qty: line.qty,
      unitPrice: line.unitPrice,
      modifiersSnapshot: mods,
      lineTotal: line.unitPrice * line.qty,
      note: line.kitchenNote ?? (line.note?.startsWith("var:") ? undefined : line.note),
      status: "pending"
    });
  }
  return items;
}

export function addPackageToCart(shiftId: string, packageId: string, qty = 1) {
  ensurePosSeeded();
  const pkg = getMenuPackage(packageId);
  if (!pkg || !pkg.active) return null;
  const components = listPackageItems(packageId);
  if (!components.length) return null;
  for (const comp of components) {
    const menu = getMenuItem(comp.menuItemId);
    if (!menu || menu.soldOut) return null;
  }
  const cart = getCart(shiftId);
  const summary = packageComponentSummary(packageId);
  const existing = cart.find((l) => l.packageId === packageId && l.isPackageBundle);
  if (existing) existing.qty += qty;
  else {
    cart.push({
      lineId: nextId("CLN"),
      menuItemId: components[0].menuItemId,
      packageId: pkg.id,
      isPackageBundle: true,
      name: `${pkg.name} (${summary})`,
      unitPrice: pkg.bundlePrice,
      qty
    });
  }
  store().posCarts[shiftId] = cart;
  return cart;
}

export function listPackagesForOutlet(outletId: string): MenuPackage[] {
  ensurePosSeeded();
  ensurePackagesReady(outletId);
  return listMenuPackages(outletId);
}

function appendItemsToOrder(order: PosOrder, newItems: PosOrderItem[]) {
  order.items.push(...newItems);
  recalcOrderTotals(order);
}

/** Open bill aktif per meja dalam shift yang sama. */
export function findOpenBill(shiftId: string, tableLabel: string) {
  ensurePosSeeded();
  const key = tableLabel.trim().toLowerCase();
  if (!key) return undefined;
  return store().posOrders.find(
    (o) =>
      o.shiftId === shiftId &&
      o.status === "open" &&
      o.tableLabel?.trim().toLowerCase() === key
  );
}

/** Semua bill terbuka di shift (belum lunas, tidak ditahan). */
export function listOpenBills(shiftId: string) {
  ensurePosSeeded();
  return store().posOrders.filter(
    (o) =>
      o.shiftId === shiftId &&
      o.status === "open" &&
      o.paymentStatus !== "paid"
  );
}

/** Bill ditahan sementara (hold). */
export function listHeldBills(shiftId: string) {
  ensurePosSeeded();
  return store().posOrders.filter((o) => o.shiftId === shiftId && o.status === "held");
}

export function holdOrder(orderId: string, reason?: string) {
  ensurePosSeeded();
  const order = getOrder(orderId);
  if (!order || order.status !== "open") return { error: "Hanya bill terbuka yang bisa ditahan." as const };
  if (order.paymentStatus === "partial") {
    return { error: "Bill yang sudah ada pembayaran tidak bisa ditahan." as const };
  }
  order.status = "held";
  order.heldAt = new Date().toISOString();
  order.holdReason = reason?.trim() || undefined;
  return { order };
}

export function resumeOrder(orderId: string) {
  ensurePosSeeded();
  const order = getOrder(orderId);
  if (!order || order.status !== "held") return { error: "Bill tidak dalam status hold." as const };
  order.status = "open";
  order.heldAt = undefined;
  order.holdReason = undefined;
  return { order };
}

export function countOrderPendingItems(order: PosOrder) {
  return order.items.filter((it) => it.status === "pending").length;
}

/** Gabung keranjang ke open bill (buat baru bila belum ada). */
export function addCartToOpenBill(input: {
  shiftId: string;
  outletId: string;
  channel: PosOrderChannel;
  tableLabel: string;
  createdBy: string;
  customerName?: string;
  waiterId?: string;
  waiterName?: string;
}) {
  ensurePosSeeded();
  const cart = getCart(input.shiftId);
  if (cart.length === 0) return { error: "Keranjang kosong." as const };

  const valid = validatePosOrderContext({
    outletId: input.outletId,
    channel: input.channel,
    tableLabel: input.tableLabel
  });
  if (!valid.ok) return { error: valid.error };

  const table = input.tableLabel.trim();

  const newItems = cartLinesToOrderItems(cart);
  let order = findOpenBill(input.shiftId, table);

  if (order) {
    appendItemsToOrder(order, newItems);
    touchOrderSync(order, "update");
  } else {
    const subtotal = newItems.reduce((s, it) => s + it.lineTotal, 0);
    order = {
      id: nextId("ORD"),
      outletId: input.outletId,
      shiftId: input.shiftId,
      orderNumber: orderNumberFor(input.outletId),
      channel: input.channel,
      tableLabel: table,
      customerName: input.customerName?.trim() || undefined,
      waiterId: input.waiterId?.trim() || undefined,
      waiterName: input.waiterName?.trim() || undefined,
      status: "open",
      paymentStatus: "unpaid",
      subtotal,
      discountAmount: 0,
      taxAmount: 0,
      serviceChargeAmount: 0,
      total: subtotal,
      createdBy: input.createdBy,
      createdAt: new Date().toISOString(),
      items: newItems,
      payments: []
    };
    store().posOrders.unshift(order);
    touchOrderSync(order, "create");
  }

  clearCart(input.shiftId);
  return { order, addedCount: newItems.length };
}

export function createOrderFromCart(input: {
  shiftId: string;
  outletId: string;
  channel: PosOrderChannel;
  tableLabel?: string;
  customerName?: string;
  waiterId?: string;
  waiterName?: string;
  createdBy: string;
}) {
  ensurePosSeeded();
  const valid = validatePosOrderContext({
    outletId: input.outletId,
    channel: input.channel,
    tableLabel: input.tableLabel
  });
  if (!valid.ok) return null;

  const cart = getCart(input.shiftId);
  if (cart.length === 0) return null;

  const items = cartLinesToOrderItems(cart);

  const subtotal = items.reduce((s, it) => s + it.lineTotal, 0);
  const order: PosOrder = {
    id: nextId("ORD"),
    outletId: input.outletId,
    shiftId: input.shiftId,
    orderNumber: orderNumberFor(input.outletId),
    channel: input.channel,
    tableLabel: input.tableLabel,
    customerName: input.customerName?.trim() || undefined,
    waiterId: input.waiterId?.trim() || undefined,
    waiterName: input.waiterName?.trim() || undefined,
    status: "open",
    paymentStatus: "unpaid",
    subtotal,
    discountAmount: 0,
    taxAmount: 0,
    serviceChargeAmount: 0,
    total: subtotal,
    createdBy: input.createdBy,
    createdAt: new Date().toISOString(),
    items,
    payments: []
  };

  store().posOrders.unshift(order);
  clearCart(input.shiftId);
  touchOrderSync(order, "create");
  return order;
}

export function getOrder(id: string) {
  ensurePosSeeded();
  return store().posOrders.find((o) => o.id === id);
}

export function listShiftOrders(shiftId: string) {
  ensurePosSeeded();
  return store().posOrders.filter((o) => o.shiftId === shiftId);
}

export function getOrderBalance(order: PosOrder) {
  const paid = sumPayments(order.payments);
  return Math.max(0, order.total - paid);
}

export function addPayment(input: {
  orderId: string;
  method: PosPaymentMethod;
  amount: number;
  reference?: string;
  createdBy: string;
  outletName?: string;
}) {
  ensurePosSeeded();
  const order = getOrder(input.orderId);
  if (!order || order.status === "void" || order.status === "completed" || order.status === "held") {
    return null;
  }

  const balance = getOrderBalance(order);
  const amount = Math.min(input.amount, balance);
  if (amount <= 0) return null;

  const payment: PosOrderPayment = {
    id: nextId("PAY"),
    method: input.method,
    amount,
    reference: input.reference,
    status: "captured",
    financeAccountId: resolvePaymentCoaAccount(order.outletId, input.method)
  };
  order.payments.push(payment);
  recalcOrderTotals(order);

  if (order.paymentStatus === "paid") {
    order.status = "completed";
    order.paidAt = new Date().toISOString();
    order.completedAt = order.paidAt;
    const shift = order.shiftId ? getShift(order.shiftId) : undefined;
    if (shift) recomputeShiftTotals(shift);
    touchOrderSync(order, "complete");
  } else {
    touchOrderSync(order, "update");
  }

  return { order, payment, remaining: getOrderBalance(order) };
}

/** Selesaikan order bernilai 0 (mis. 100% reward) tanpa payment. */
export function completeZeroOrder(orderId: string) {
  ensurePosSeeded();
  const order = getOrder(orderId);
  if (!order || order.status !== "open") return null;
  if (getOrderBalance(order) > 0) return null;
  order.status = "completed";
  order.paymentStatus = "paid";
  order.paidAt = new Date().toISOString();
  order.completedAt = order.paidAt;
  const shift = order.shiftId ? getShift(order.shiftId) : undefined;
  if (shift) recomputeShiftTotals(shift);
  touchOrderSync(order, "complete");
  return order;
}

export async function closeShift(input: {
  shiftId: string;
  closedBy: string;
  closedByName: string;
  userId: string;
  physicalCash?: number;
}) {
  ensurePosSeeded();
  const shift = getShift(input.shiftId);
  if (!shift || shift.status !== "open") return { error: "Shift tidak ditemukan atau sudah ditutup." };

  const openOrders = listShiftOrders(shift.id).filter(
    (o) =>
      o.status === "open" ||
      o.status === "held" ||
      o.paymentStatus === "partial"
  );
  if (openOrders.length > 0) {
    const held = openOrders.filter((o) => o.status === "held").length;
    const msg =
      held > 0
        ? `${openOrders.length} order belum selesai (${held} masih hold). Selesaikan atau lanjutkan dulu.`
        : `${openOrders.length} order belum lunas. Selesaikan dulu.`;
    return { error: msg };
  }

  recomputeShiftTotals(shift);
  const now = new Date().toISOString();
  shift.status = "closed";
  shift.closedAt = now;
  shift.closedBy = input.closedByName;

  const cash = shift.systemCashTotal ?? 0;
  const qris = shift.systemQrisTotal ?? 0;
  const online = shift.systemOnlineTotal ?? 0;
  const total = shift.systemGrandTotal ?? 0;
  const drawer = getCashDrawerSummary(shift.id);
  const expectedCash = drawer?.expectedCash ?? cash;
  const physical = input.physicalCash;
  const cashVariance =
    physical != null && Number.isFinite(physical) ? physical - expectedCash : 0;

  const submission: Submission = {
    id: nextId("REQ"),
    formType: "setoran_kasir",
    formLabel: "Setoran Kasir",
    outletId: shift.outletId,
    outletName: outletDisplayName(shift.outletId),
    area: shift.shiftLabel,
    submittedById: input.userId,
    submittedByName: input.closedByName,
    payload: {
      shift: shift.shiftLabel,
      source: "pos_shift",
      cash: String(cash),
      qris: String(qris),
      online: String(online),
      total_penjualan: String(total),
      total_setoran: String(cash + qris + online),
      uang_fisik_laci: physical != null ? String(physical) : "",
      perkiraan_sistem_laci: String(expectedCash),
      pengeluaran_outlet: String(drawer?.outletExpensesTotal ?? 0),
      total_kas_akhir: String(drawer?.totalKasAkhir ?? expectedCash),
      selisih_vs_sistem: String(cashVariance),
      catatan: `Auto dari POS shift ${shift.id} · ${shift.orderCount ?? 0} order${
        physical != null ? ` · fisik ${physical} vs perkiraan ${expectedCash}` : ""
      }`
    },
    status: "menunggu_dicek",
    createsTask: false,
    needsApproval: true,
    history: [
      {
        status: "menunggu_dicek",
        note: "Setoran otomatis dari tutup shift POS — menunggu verifikasi leader.",
        at: now,
        byName: "Sistem POS"
      }
    ],
    createdAt: now
  };

  addSubmission(submission);

  const approverLevel = resolveApproverLevel(submission);
  const approvalId = nextId("APR");
  const approval: Approval = {
    id: approvalId,
    requestType: "setoran_kasir",
    requestLabel: "Setoran Kasir",
    requestId: submission.id,
    requestedById: input.userId,
    requestedByName: input.closedByName,
    outletId: shift.outletId,
    outletName: outletDisplayName(shift.outletId),
    amount: extractAmount(submission),
    reason: extractReason(submission),
    status: "pending",
    approverLevel,
    createdAt: now,
    updatedAt: now
  };
  submission.approvalId = approvalId;
  addApproval(approval);
  shift.setoranSubmissionId = submission.id;

  const waLog = await sendWaNotification({
    event: "approval_pending",
    target: approverLevel === "owner" ? "owner" : "leader",
    outletId: shift.outletId,
    message: formatApprovalPendingWa(approval, submission)
  });
  addNotificationLog(waLog);

  recordAuditEvent({
    action: "pos.shift_close",
    actorId: input.userId,
    actorName: input.closedByName,
    outletId: shift.outletId,
    entityType: "pos_shift",
    entityId: shift.id,
    meta: {
      orderCount: shift.orderCount ?? 0,
      grandTotal: shift.systemGrandTotal ?? 0
    }
  });

  touchShiftSync(shift.id, shift.outletId);
  persistStore();

  return { shift, submission, approval };
}

/** Tempel member ke order (low-level; validasi member di action). */
export function setOrderCustomer(orderId: string, customerId: string, memberCode: string) {
  const order = getOrder(orderId);
  if (!order || order.status === "completed" || order.status === "void") return null;
  order.customerId = customerId;
  order.memberCode = memberCode;
  return order;
}

export function clearOrderCustomer(orderId: string) {
  const order = getOrder(orderId);
  if (!order) return null;
  order.customerId = undefined;
  order.memberCode = undefined;
  return order;
}

/** Tambah diskon loyalty/voucher/manual ke order. */
export function addOrderDiscount(
  orderId: string,
  amount: number,
  kind: "loyalty" | "voucher" | "manual" | "cashier_voucher",
  meta?: { note?: string; approvedBy?: string }
) {
  const order = getOrder(orderId);
  if (!order || order.status === "completed" || order.status === "void" || order.status === "held") {
    return null;
  }
  const remaining = Math.max(0, order.subtotal - order.discountAmount);
  const capped = Math.min(amount, remaining);
  if (capped <= 0) return null;

  order.discountAmount += capped;
  if (kind === "loyalty") {
    order.totalLoyaltyDiscount = (order.totalLoyaltyDiscount ?? 0) + capped;
  } else if (kind === "voucher") {
    order.totalVoucherDiscount = (order.totalVoucherDiscount ?? 0) + capped;
  } else if (kind === "cashier_voucher") {
    order.totalCashierVoucherDiscount = (order.totalCashierVoucherDiscount ?? 0) + capped;
  } else {
    order.totalManualDiscount = (order.totalManualDiscount ?? 0) + capped;
    order.manualDiscountNote = meta?.note;
    order.manualDiscountApprovedBy = meta?.approvedBy;
  }
  recalcOrderTotals(order);
  recordAuditEvent({
    action: "pos.discount",
    actorName: meta?.approvedBy ?? "system",
    outletId: order.outletId,
    entityType: "pos_order",
    entityId: order.id,
    reason: meta?.note,
    meta: { kind, amount: capped }
  });
  return { order, applied: capped };
}

/** Tambah item reward gratis (final price 0, stok tetap dipotong nanti). */
export function addRewardItemToOrder(input: {
  orderId: string;
  menuItemId: string;
  voucherId?: string;
  programId?: string;
}) {
  const order = getOrder(input.orderId);
  if (!order || order.status === "completed" || order.status === "void") return null;
  const menu = getMenuItem(input.menuItemId);
  if (!menu) return null;

  order.items.push({
    id: nextId("OLI"),
    menuItemId: menu.id,
    nameSnapshot: `${menu.name} (REWARD)`,
    qty: 1,
    unitPrice: 0,
    modifiersSnapshot: [],
    lineTotal: 0,
    status: "pending",
    isRewardItem: true,
    rewardVoucherId: input.voucherId,
    rewardProgramId: input.programId,
    normalPrice: menu.basePrice,
    discountAmount: menu.basePrice,
    finalPrice: 0,
    stockDeductedStatus: "pending"
  });
  order.rewardRedeemedStatus = "applied";
  recalcOrderTotals(order);
  return { order, menu };
}

export function getShiftSummary(shiftId: string) {
  ensurePosSeeded();
  const shift = getShift(shiftId);
  if (!shift) return null;
  recomputeShiftTotals(shift);
  const orders = listShiftOrders(shiftId);
  return {
    shift,
    orders,
    completedCount: orders.filter((o) => o.status === "completed").length,
    openCount: orders.filter((o) => o.status === "open" || o.status === "held").length,
    heldCount: orders.filter((o) => o.status === "held").length
  };
}

/** P2 — ringkasan laci kas shift aktif. */
export function getCashDrawerSummary(shiftId: string) {
  ensurePosSeeded();
  const shift = getShift(shiftId);
  if (!shift) return null;

  recomputeShiftTotals(shift);
  const entries = shift.cashDrawerEntries ?? [];
  const payIn = entries.filter((e) => e.type === "pay_in").reduce((s, e) => s + e.amount, 0);
  const payOut = entries.filter((e) => e.type === "pay_out").reduce((s, e) => s + e.amount, 0);
  const outletExpensesTotal = sumOutletExpenses(shiftId);
  const cashSales = shift.systemCashTotal ?? 0;
  const openingFloat = shift.openingFloat ?? 0;
  /** Audit: Kas Awal + Pembayaran Tunai − Pengeluaran Outlet */
  const totalKasAkhir = openingFloat + cashSales - outletExpensesTotal;
  /** Perkiraan fisik laci termasuk pay in/out operasional */
  const expectedCash = totalKasAkhir + payIn - payOut;

  return {
    shift,
    entries,
    payIn,
    payOut,
    outletExpensesTotal,
    totalKasAkhir,
    expectedCash
  };
}

export function recordCashDrawerEntry(input: {
  shiftId: string;
  type: "pay_in" | "pay_out";
  amount: number;
  reason: string;
  createdBy: string;
}) {
  ensurePosSeeded();
  const shift = getShift(input.shiftId);
  if (!shift || shift.status !== "open") return { error: "Shift tidak aktif." as const };
  if (input.amount <= 0) return { error: "Nominal harus lebih dari 0." as const };
  if (!input.reason.trim()) return { error: "Alasan wajib diisi." as const };

  const entry = {
    id: nextId("CDR"),
    type: input.type,
    amount: input.amount,
    reason: input.reason.trim(),
    createdBy: input.createdBy,
    createdAt: new Date().toISOString()
  };
  if (!shift.cashDrawerEntries) shift.cashDrawerEntries = [];
  shift.cashDrawerEntries.unshift(entry);
  return { entry };
}

function reassignKdsTickets(itemIds: string[], newOrderId: string, order: PosOrder) {
  const idSet = new Set(itemIds);
  for (const ticket of store().kdsTickets) {
    if (idSet.has(ticket.orderItemId)) {
      ticket.orderId = newOrderId;
      ticket.tableLabel = order.tableLabel;
      ticket.orderNumber = order.orderNumber;
    }
  }
}

function allocateDiscountSlice(totalDiscount: number, subtotal: number, movedSub: number) {
  if (totalDiscount <= 0 || subtotal <= 0) return 0;
  return Math.min(totalDiscount, Math.round(totalDiscount * (movedSub / subtotal)));
}

function assertBillEditable(order: PosOrder | undefined) {
  if (!order || order.status !== "open") return "Hanya bill terbuka yang bisa diubah.";
  if (order.paymentStatus === "partial") return "Bill dengan pembayaran partial tidak bisa diubah.";
  return null;
}

/** P3 — pisah item terpilih ke bill baru (bayar terpisah). */
export function splitOrder(input: {
  orderId: string;
  itemIds: string[];
  newTableLabel: string;
  createdBy: string;
}) {
  ensurePosSeeded();
  const source = getOrder(input.orderId);
  const err = assertBillEditable(source);
  if (err) return { error: err as string };

  const idSet = new Set(input.itemIds);
  const moving = source!.items.filter((it) => idSet.has(it.id));
  const staying = source!.items.filter((it) => !idSet.has(it.id));

  if (moving.length === 0) return { error: "Pilih minimal 1 item." };
  if (staying.length === 0) return { error: "Bill asal harus menyisakan minimal 1 item." };

  const newTable = input.newTableLabel.trim();
  if (!newTable) return { error: "Label bill baru wajib diisi." };
  if (source!.shiftId && findOpenBill(source!.shiftId, newTable)) {
    return { error: `Bill "${newTable}" sudah terbuka.` };
  }

  const srcSub = source!.subtotal;
  const movedSub = moving.reduce((s, it) => s + it.lineTotal, 0);
  const movedDisc = allocateDiscountSlice(source!.discountAmount, srcSub, movedSub);
  const movedManual = allocateDiscountSlice(source!.totalManualDiscount ?? 0, srcSub, movedSub);
  const movedLoyalty = allocateDiscountSlice(source!.totalLoyaltyDiscount ?? 0, srcSub, movedSub);
  const movedVoucher = allocateDiscountSlice(source!.totalVoucherDiscount ?? 0, srcSub, movedSub);

  source!.items = staying;
  source!.discountAmount -= movedDisc;
  source!.totalManualDiscount = Math.max(0, (source!.totalManualDiscount ?? 0) - movedManual);
  source!.totalLoyaltyDiscount = Math.max(0, (source!.totalLoyaltyDiscount ?? 0) - movedLoyalty);
  source!.totalVoucherDiscount = Math.max(0, (source!.totalVoucherDiscount ?? 0) - movedVoucher);
  recalcOrderTotals(source!);

  const newOrder: PosOrder = {
    id: nextId("ORD"),
    outletId: source!.outletId,
    shiftId: source!.shiftId,
    orderNumber: orderNumberFor(source!.outletId),
    channel: source!.channel,
    tableLabel: newTable,
    status: "open",
    paymentStatus: "unpaid",
    subtotal: movedSub,
    discountAmount: movedDisc,
    taxAmount: 0,
    serviceChargeAmount: 0,
    total: movedSub - movedDisc,
    createdBy: input.createdBy,
    createdAt: new Date().toISOString(),
    items: moving,
    payments: [],
    splitFromOrderId: source!.id,
    totalManualDiscount: movedManual || undefined,
    totalLoyaltyDiscount: movedLoyalty || undefined,
    totalVoucherDiscount: movedVoucher || undefined
  };
  recalcOrderTotals(newOrder);
  store().posOrders.unshift(newOrder);
  reassignKdsTickets(
    moving.map((i) => i.id),
    newOrder.id,
    newOrder
  );
  syncKdsFromOrder(source!);
  syncKdsFromOrder(newOrder);

  return { source: source!, newOrder };
}

/** P3 — gabung beberapa bill terbuka ke satu bill target. */
export function mergeOrders(input: {
  targetOrderId: string;
  sourceOrderIds: string[];
}) {
  ensurePosSeeded();
  const target = getOrder(input.targetOrderId);
  const err = assertBillEditable(target);
  if (err) return { error: err as string };

  const sourceIds = input.sourceOrderIds.filter((id) => id !== target!.id);
  const sources = sourceIds
    .map((id) => getOrder(id))
    .filter((o): o is PosOrder => Boolean(o));

  if (sources.length === 0) return { error: "Pilih minimal 1 bill lain untuk digabung." };

  for (const src of sources) {
    const srcErr = assertBillEditable(src);
    if (srcErr) return { error: `${src.orderNumber}: ${srcErr}` };
  }

  for (const src of sources) {
    target!.items.push(...src.items);
    target!.discountAmount += src.discountAmount;
    target!.totalManualDiscount =
      (target!.totalManualDiscount ?? 0) + (src.totalManualDiscount ?? 0);
    target!.totalLoyaltyDiscount =
      (target!.totalLoyaltyDiscount ?? 0) + (src.totalLoyaltyDiscount ?? 0);
    target!.totalVoucherDiscount =
      (target!.totalVoucherDiscount ?? 0) + (src.totalVoucherDiscount ?? 0);

    reassignKdsTickets(
      src.items.map((i) => i.id),
      target!.id,
      target!
    );

    src.status = "merged";
    src.mergedIntoOrderId = target!.id;
    src.items = [];
    src.discountAmount = 0;
    src.total = 0;
    src.subtotal = 0;
  }

  recalcOrderTotals(target!);
  syncKdsFromOrder(target!);
  for (const src of sources) {
    syncKdsFromOrder(src);
  }
  return { target: target!, mergedCount: sources.length };
}

/** P4 — void satu item di bill terbuka (butuh PIN leader). */
export function voidOrderItem(input: {
  orderId: string;
  itemId: string;
  reason: string;
  voidedBy: string;
}) {
  ensurePosSeeded();
  const order = getOrder(input.orderId);
  const err = assertBillEditable(order);
  if (err) return { error: err as string };

  const activeItems = order!.items.filter((it) => it.status !== "void");
  const item = order!.items.find((it) => it.id === input.itemId);
  if (!item || item.status === "void") return { error: "Item tidak ditemukan." };
  if (activeItems.length <= 1) return { error: "Tidak bisa void item terakhir — void bill penuh saja." };
  if (!input.reason.trim()) return { error: "Alasan void wajib diisi." };

  item.status = "void";
  item.note = [item.note, `VOID: ${input.reason.trim()}`].filter(Boolean).join(" · ");
  voidKdsTicketForOrderItem(item.id);
  recalcOrderTotals(order!);
  recordAuditEvent({
    action: "pos.void_item",
    actorName: input.voidedBy,
    outletId: order!.outletId,
    entityType: "pos_order_item",
    entityId: item.id,
    reason: input.reason.trim(),
    meta: { orderId: order!.id, itemName: item.nameSnapshot }
  });
  return { order: order!, voidedItem: item };
}

/** P4 — pindah meja bill terbuka. */
export function moveOrderTable(input: { orderId: string; newTableLabel: string }) {
  ensurePosSeeded();
  const order = getOrder(input.orderId);
  const err = assertBillEditable(order);
  if (err) return { error: err as string };

  const newTable = input.newTableLabel.trim();
  if (!newTable) return { error: "Meja tujuan wajib diisi." };

  if (order!.shiftId && findOpenBill(order!.shiftId, newTable)) {
    const existing = findOpenBill(order!.shiftId, newTable);
    if (existing && existing.id !== order!.id) {
      return { error: `Meja "${newTable}" sudah punya bill terbuka.` };
    }
  }

  order!.tableLabel = newTable;
  for (const ticket of store().kdsTickets) {
    if (ticket.orderId === order!.id) {
      ticket.tableLabel = newTable;
    }
  }
  syncKdsFromOrder(order!);
  return { order: order! };
}

/** P4 — terima order online manual (GoFood/Grab/Shopee). */
export function createOnlineOrder(input: {
  shiftId: string;
  outletId: string;
  platform: "gofood" | "grab" | "shopee";
  externalOrderId: string;
  customerName?: string;
  items: Array<{ menuItemId: string; qty: number; note?: string }>;
  createdBy: string;
}) {
  ensurePosSeeded();
  const extId = input.externalOrderId.trim();
  if (!extId) return { error: "ID order platform wajib diisi." as const };
  if (input.items.length === 0) return { error: "Minimal 1 item." as const };

  const orderItems: PosOrderItem[] = [];
  for (const row of input.items) {
    const menu = getMenuItem(row.menuItemId);
    if (!menu) return { error: `Menu ${row.menuItemId} tidak ditemukan.` as const };
    orderItems.push({
      id: nextId("OLI"),
      menuItemId: menu.id,
      nameSnapshot: menu.name,
      qty: row.qty,
      unitPrice: menu.basePrice,
      modifiersSnapshot: [],
      lineTotal: menu.basePrice * row.qty,
      note: row.note,
      status: "pending"
    });
  }

  const subtotal = orderItems.reduce((s, it) => s + it.lineTotal, 0);
  const channel = input.platform;
  const order: PosOrder = {
    id: nextId("ORD"),
    outletId: input.outletId,
    shiftId: input.shiftId,
    orderNumber: orderNumberFor(input.outletId),
    channel,
    customerName: input.customerName?.trim() || undefined,
    externalPlatform: input.platform,
    externalOrderId: extId,
    status: "open",
    paymentStatus: "unpaid",
    subtotal,
    discountAmount: 0,
    taxAmount: 0,
    serviceChargeAmount: 0,
    total: subtotal,
    createdBy: input.createdBy,
    createdAt: new Date().toISOString(),
    items: orderItems,
    payments: []
  };
  store().posOrders.unshift(order);
  return { order };
}

/** P4 — inbox order online belum lunas shift ini. */
export function listOnlinePendingOrders(shiftId: string) {
  ensurePosSeeded();
  return store().posOrders.filter(
    (o) =>
      o.shiftId === shiftId &&
      o.externalPlatform &&
      o.status === "open" &&
      o.paymentStatus !== "paid"
  );
}

/** P4 — catat cetak ulang struk. */
export function recordReprint(orderId: string, byName: string) {
  ensurePosSeeded();
  const order = getOrder(orderId);
  if (!order) return null;
  order.reprintCount = (order.reprintCount ?? 0) + 1;
  order.lastReprintAt = new Date().toISOString();
  order.lastReprintBy = byName;
  return order;
}

export type ShiftSalesReport = {
  shift: PosShift;
  completedOrders: PosOrder[];
  grossSales: number;
  totalDiscount: number;
  netSales: number;
  byPayment: Record<string, number>;
  byChannel: Record<string, number>;
  topItems: Array<{ name: string; qty: number; revenue: number }>;
  voidCount: number;
  reprintCount: number;
  onlinePending: number;
  drawerExpected?: number;
};

/** P4 — laporan penjualan shift. */
export function getShiftSalesReport(shiftId: string): ShiftSalesReport | null {
  ensurePosSeeded();
  const shift = getShift(shiftId);
  if (!shift) return null;
  recomputeShiftTotals(shift);

  const orders = listShiftOrders(shiftId);
  const completed = orders.filter((o) => o.status === "completed");
  const grossSales = completed.reduce((s, o) => s + o.subtotal, 0);
  const totalDiscount = completed.reduce((s, o) => s + o.discountAmount, 0);
  const netSales = completed.reduce((s, o) => s + o.total, 0);

  const byPayment: Record<string, number> = {};
  const byChannel: Record<string, number> = {};
  const itemMap = new Map<string, { qty: number; revenue: number }>();

  for (const o of completed) {
    byChannel[o.channel] = (byChannel[o.channel] ?? 0) + o.total;
    for (const p of o.payments.filter((x) => x.status === "captured")) {
      byPayment[p.method] = (byPayment[p.method] ?? 0) + p.amount;
    }
    for (const it of o.items.filter((x) => x.status !== "void" && !x.isRewardItem)) {
      const cur = itemMap.get(it.nameSnapshot) ?? { qty: 0, revenue: 0 };
      cur.qty += it.qty;
      cur.revenue += it.lineTotal;
      itemMap.set(it.nameSnapshot, cur);
    }
  }

  const topItems = [...itemMap.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  const drawer = getCashDrawerSummary(shiftId);

  return {
    shift,
    completedOrders: completed,
    grossSales,
    totalDiscount,
    netSales,
    byPayment,
    byChannel,
    topItems,
    voidCount: orders.filter((o) => o.status === "void").length,
    reprintCount: completed.reduce((s, o) => s + (o.reprintCount ?? 0), 0),
    onlinePending: listOnlinePendingOrders(shiftId).length,
    drawerExpected: drawer?.expectedCash
  };
}

export { ensurePosSeeded };
