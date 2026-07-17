import { supabaseAdmin } from "../supabase";
import type {
  PosRegister,
  MenuCategory,
  MenuItem,
  MenuItemVariant,
  MenuModifier,
  MenuCatalogMeta,
  PosShift,
  PosOrder,
  KdsTicket
} from "../pos-kds-roadmap";
import type { MenuRecipe } from "../pos-recipes";
import type { KdsStation } from "../station-service";
import type { NotesCategory } from "../notes-category-service";
import type { TableSection, FloorTable } from "../floor-service";
import type { MenuPackage, MenuPackageItem } from "../package-service";
import type { PosPromotion } from "../promotion-service";
import type { SalesChannel } from "../channel-service";
import type { MenuBranchSetting } from "../branch-menu-service";
import type { CancelReason } from "../cancel-reason-service";
import type { CashierVoucher } from "../cashier-voucher-service";
import type { MenuPriceSchedule } from "../price-schedule-service";
import type { PosMenuLayout } from "../pos-menu-layout-service";
import type { PosPaymentMethodMaster } from "../payment-method-service";

// ============================================================================
// Repository relasional POS / KDS (Fase D2b lanjutan).
// Catatan: item & payment order disimpan jsonb verbatim (camelCase) → tidak perlu
// dipetakan. Timestamp disimpan teks verbatim. Pull pakai kolom eksplisit
// (bukan select *) karena PostgREST bisa kosongkan "*" tepat setelah DDL.
// ============================================================================

export type PosSnapshot = {
  posRegisters: PosRegister[];
  menuCategories: MenuCategory[];
  menuItems: MenuItem[];
  menuModifiers: MenuModifier[];
  menuItemModifierLinks: Record<string, string[]>;
  menuItemVariants: MenuItemVariant[];
  menuCatalogMeta: Record<string, MenuCatalogMeta>;
  posRecipes: MenuRecipe[];
  posShifts: PosShift[];
  posOrders: PosOrder[];
  kdsStations: KdsStation[];
  kdsTickets: KdsTicket[];
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
  posPaymentMethods: PosPaymentMethodMaster[];
  tableSections: TableSection[];
  floorTables: FloorTable[];
};

const n = <T>(v: T | undefined): T | null => (v === undefined ? null : v);
const u = <T>(v: T | null): T | undefined => (v === null ? undefined : v);
const num = (v: unknown): number => (v == null ? 0 : Number(v));
const numU = (v: unknown): number | undefined => (v == null ? undefined : Number(v));

// ---- map: app -> row -------------------------------------------------------
const registerRow = (r: PosRegister) => ({
  id: r.id, outlet_id: r.outletId, area_id: n(r.areaId), code: r.code, name: r.name, active: r.active,
  settings: r.settings ?? null
});

const menuCategoryRow = (c: MenuCategory) => ({
  id: c.id, outlet_id: c.outletId, name: c.name, sort_order: c.sortOrder, active: c.active
});

const modifierRow = (m: MenuModifier) => ({
  id: m.id, outlet_id: m.outletId, name: m.name, price_delta: m.priceDelta, active: m.active
});

const menuItemRow = (m: MenuItem) => ({
  id: m.id, outlet_id: m.outletId, category_id: n(m.categoryId), sku: n(m.sku), name: m.name,
  description: n(m.description), image_url: n(m.imageUrl), base_price: m.basePrice,
  cost_price: n(m.costPrice), sold_out: m.soldOut ?? false, tax_included: m.taxIncluded,
  default_area_id: n(m.defaultAreaId), prep_time_minutes: n(m.prepTimeMinutes), active: m.active
});

const variantRow = (v: MenuItemVariant) => ({
  id: v.id, menu_item_id: v.menuItemId, outlet_id: v.outletId, name: v.name, sku: n(v.sku),
  price: v.price, cost_price: n(v.costPrice), sort_order: v.sortOrder, active: v.active
});

const catalogMetaRow = (m: MenuCatalogMeta) => ({
  outlet_id: m.outletId, version: m.version, updated_at: m.updatedAt
});

const recipeRow = (r: MenuRecipe) => ({
  menu_item_id: r.menuItemId, name: r.name, lines: r.lines
});

const shiftRow = (s: PosShift) => ({
  id: s.id, outlet_id: s.outletId, register_id: s.registerId, shift_label: s.shiftLabel,
  opened_by: n(s.openedBy), closed_by: n(s.closedBy), opening_float: s.openingFloat, status: s.status,
  opened_at: n(s.openedAt), closed_at: n(s.closedAt), system_cash_total: n(s.systemCashTotal),
  system_qris_total: n(s.systemQrisTotal), system_online_total: n(s.systemOnlineTotal),
  system_grand_total: n(s.systemGrandTotal), order_count: n(s.orderCount),
  setoran_submission_id: n(s.setoranSubmissionId)
});

const orderRow = (o: PosOrder) => ({
  id: o.id, outlet_id: o.outletId, shift_id: n(o.shiftId), order_number: o.orderNumber, channel: o.channel,
  table_label: n(o.tableLabel), customer_name: n(o.customerName), status: o.status,
  payment_status: o.paymentStatus, subtotal: o.subtotal, discount_amount: o.discountAmount,
  tax_amount: o.taxAmount, service_charge_amount: o.serviceChargeAmount, total: o.total,
  external_platform: n(o.externalPlatform), external_order_id: n(o.externalOrderId),
  created_by: n(o.createdBy), created_at: o.createdAt, paid_at: n(o.paidAt), completed_at: n(o.completedAt),
  items: o.items ?? [], payments: o.payments ?? [],
  integrated_at: n(o.integratedAt), inventory_integrated: n(o.inventoryIntegrated),
  customer_id: n(o.customerId), member_code: n(o.memberCode), loyalty_program_applied: n(o.loyaltyProgramApplied),
  total_gross: n(o.totalGross), total_discount: n(o.totalDiscount),
  total_loyalty_discount: n(o.totalLoyaltyDiscount), total_voucher_discount: n(o.totalVoucherDiscount),
  total_net: n(o.totalNet), points_earned: n(o.pointsEarned), points_redeemed: n(o.pointsRedeemed),
  stamps_earned: n(o.stampsEarned), reward_redeemed_status: n(o.rewardRedeemedStatus),
  loyalty_earned: n(o.loyaltyEarned), void_reason: n(o.voidReason), voided_at: n(o.voidedAt),
  voided_by: n(o.voidedBy), loyalty_reversed: n(o.loyaltyReversed)
});

const stationRow = (s: KdsStation) => ({
  id: s.id,
  outlet_id: s.outletId,
  name: s.name,
  sort_order: s.sortOrder,
  active: s.active
});

const notesCategoryRow = (cat: NotesCategory) => ({
  id: cat.id,
  outlet_id: cat.outletId,
  name: cat.name,
  grp: n(cat.group),
  sort_order: cat.sortOrder,
  active: cat.active
});

const menuPackageRow = (p: MenuPackage) => ({
  id: p.id,
  outlet_id: p.outletId,
  name: p.name,
  description: n(p.description),
  image_url: n(p.imageUrl),
  bundle_price: p.bundlePrice,
  sort_order: p.sortOrder,
  active: p.active
});

const menuPackageItemRow = (it: MenuPackageItem) => ({
  id: it.id,
  package_id: it.packageId,
  menu_item_id: it.menuItemId,
  qty: it.qty,
  sort_order: it.sortOrder
});

const salesChannelRow = (c: SalesChannel) => ({
  id: c.id,
  outlet_id: c.outletId,
  name: c.name,
  kind: c.kind,
  requires_table: c.requiresTable,
  sort_order: c.sortOrder,
  is_default: c.isDefault,
  active: c.active
});

const toSalesChannel = (r: any): SalesChannel => ({
  id: r.id,
  outletId: r.outlet_id,
  name: r.name,
  kind: r.kind,
  requiresTable: r.requires_table ?? false,
  sortOrder: num(r.sort_order),
  isDefault: r.is_default ?? false,
  active: r.active ?? true
});

const priceScheduleRow = (s: MenuPriceSchedule) => ({
  id: s.id,
  outlet_id: s.outletId,
  name: s.name,
  days_of_week: s.daysOfWeek,
  start_time: s.startTime,
  end_time: s.endTime,
  adjust_type: s.adjustType,
  value: s.value,
  target_menu_item_ids: s.targetMenuItemIds ?? [],
  target_category_ids: s.targetCategoryIds ?? [],
  sort_order: s.sortOrder,
  active: s.active
});

const toPriceSchedule = (r: any): MenuPriceSchedule => ({
  id: r.id,
  outletId: r.outlet_id,
  name: r.name,
  daysOfWeek: Array.isArray(r.days_of_week) ? r.days_of_week.map(Number) : [],
  startTime: r.start_time,
  endTime: r.end_time,
  adjustType: r.adjust_type,
  value: num(r.value),
  targetMenuItemIds: Array.isArray(r.target_menu_item_ids) ? r.target_menu_item_ids : [],
  targetCategoryIds: Array.isArray(r.target_category_ids) ? r.target_category_ids : [],
  sortOrder: num(r.sort_order),
  active: r.active ?? true
});

const posMenuLayoutRow = (l: PosMenuLayout) => ({
  id: l.id,
  outlet_id: l.outletId,
  name: l.name,
  columns: l.columns,
  view_mode: l.viewMode,
  show_packages: l.showPackages,
  category_order: l.categoryOrder ?? [],
  hidden_category_ids: l.hiddenCategoryIds ?? [],
  item_order_by_category: l.itemOrderByCategory ?? {},
  pinned_item_ids: l.pinnedItemIds ?? [],
  sort_order: l.sortOrder,
  active: l.active
});

const toPosMenuLayout = (r: any): PosMenuLayout => ({
  id: r.id,
  outletId: r.outlet_id,
  name: r.name,
  columns: (Number(r.columns) === 2 ? 2 : Number(r.columns) === 4 ? 4 : 3) as PosMenuLayout["columns"],
  viewMode: r.view_mode === "scroll" ? "scroll" : "tabs",
  showPackages: r.show_packages ?? true,
  categoryOrder: Array.isArray(r.category_order) ? r.category_order : [],
  hiddenCategoryIds: Array.isArray(r.hidden_category_ids) ? r.hidden_category_ids : [],
  itemOrderByCategory:
    r.item_order_by_category && typeof r.item_order_by_category === "object"
      ? (r.item_order_by_category as Record<string, string[]>)
      : {},
  pinnedItemIds: Array.isArray(r.pinned_item_ids) ? r.pinned_item_ids : [],
  sortOrder: num(r.sort_order),
  active: r.active ?? true
});

const paymentMethodRow = (m: PosPaymentMethodMaster) => ({
  id: m.id,
  outlet_id: m.outletId,
  name: m.name,
  kind: m.kind,
  coa_account_id: m.coaAccountId,
  shift_bucket: m.shiftBucket,
  held_cash_enabled: m.heldCashEnabled,
  held_cash_source: n(m.heldCashSource),
  held_cash_release_days: n(m.heldCashReleaseDays),
  sort_order: m.sortOrder,
  active: m.active
});

const toPaymentMethod = (r: any): PosPaymentMethodMaster => ({
  id: r.id,
  outletId: r.outlet_id,
  name: r.name,
  kind: r.kind,
  coaAccountId: r.coa_account_id,
  shiftBucket: r.shift_bucket ?? "cash",
  heldCashEnabled: r.held_cash_enabled ?? false,
  heldCashSource: u(r.held_cash_source),
  heldCashReleaseDays: numU(r.held_cash_release_days),
  sortOrder: num(r.sort_order),
  active: r.active ?? true
});

const cashierVoucherRow = (v: CashierVoucher) => ({
  id: v.id,
  outlet_id: v.outletId,
  name: v.name,
  code: v.code,
  voucher_type: v.voucherType,
  value: v.value,
  min_subtotal: n(v.minSubtotal),
  max_discount: n(v.maxDiscount),
  usage_limit: n(v.usageLimit),
  used_count: v.usedCount,
  valid_from: n(v.validFrom),
  valid_to: n(v.validTo),
  sort_order: v.sortOrder,
  active: v.active
});

const toCashierVoucher = (r: any): CashierVoucher => ({
  id: r.id,
  outletId: r.outlet_id,
  name: r.name,
  code: r.code,
  voucherType: r.voucher_type,
  value: num(r.value),
  minSubtotal: numU(r.min_subtotal),
  maxDiscount: numU(r.max_discount),
  usageLimit: numU(r.usage_limit),
  usedCount: num(r.used_count),
  validFrom: u(r.valid_from),
  validTo: u(r.valid_to),
  sortOrder: num(r.sort_order),
  active: r.active ?? true
});

const cancelReasonRow = (r: CancelReason) => ({
  id: r.id,
  outlet_id: r.outletId,
  name: r.name,
  scope: r.scope,
  requires_note: r.requiresNote,
  sort_order: r.sortOrder,
  active: r.active
});

const toCancelReason = (r: any): CancelReason => ({
  id: r.id,
  outletId: r.outlet_id,
  name: r.name,
  scope: r.scope ?? "all",
  requiresNote: r.requires_note ?? false,
  sortOrder: num(r.sort_order),
  active: r.active ?? true
});

const branchSettingRow = (b: MenuBranchSetting) => ({
  menu_item_id: b.menuItemId,
  outlet_id: b.outletId,
  price: n(b.price),
  active: b.active,
  sold_out: b.soldOut
});

const toBranchSetting = (r: any): MenuBranchSetting => ({
  menuItemId: r.menu_item_id,
  outletId: r.outlet_id,
  price: numU(r.price),
  active: r.active ?? true,
  soldOut: r.sold_out ?? false
});

const promotionRow = (p: PosPromotion) => ({
  id: p.id,
  outlet_id: p.outletId,
  name: p.name,
  code: n(p.code),
  promo_type: p.promoType,
  value: p.value,
  target_menu_item_ids: p.targetMenuItemIds ?? [],
  min_subtotal: n(p.minSubtotal),
  valid_from: n(p.validFrom),
  valid_to: n(p.validTo),
  sort_order: p.sortOrder,
  active: p.active
});

const ticketRow = (t: KdsTicket) => ({
  id: t.id, order_id: t.orderId, order_item_id: t.orderItemId, outlet_id: t.outletId, area_id: t.areaId,
  ticket_number: n(t.ticketNumber), status: t.status, priority: t.priority, fired_at: t.firedAt,
  ready_at: n(t.readyAt), served_at: n(t.servedAt), item_name: t.itemName, qty: t.qty, note: n(t.note),
  table_label: n(t.tableLabel), channel: t.channel, order_number: n(t.orderNumber),
  cooking_at: n(t.cookingAt), bumped_at: n(t.bumpedAt), bump_reason: n(t.bumpReason)
});

const tableSectionRow = (s: TableSection) => ({
  id: s.id, outlet_id: s.outletId, name: s.name, sort_order: s.sortOrder, active: s.active
});

const floorTableRow = (t: FloorTable) => ({
  id: t.id, outlet_id: t.outletId, section_id: t.sectionId, label: t.label,
  seats: t.seats, sort_order: t.sortOrder, active: t.active
});

// ---- map: row -> app -------------------------------------------------------
const toRegister = (r: any): PosRegister => ({
  id: r.id, outletId: r.outlet_id, areaId: u(r.area_id), code: r.code, name: r.name, active: r.active,
  settings: r.settings ?? undefined
});

const toMenuCategory = (r: any): MenuCategory => ({
  id: r.id, outletId: r.outlet_id, name: r.name, sortOrder: num(r.sort_order), active: r.active
});

const toModifier = (r: any): MenuModifier => ({
  id: r.id, outletId: r.outlet_id, name: r.name, priceDelta: num(r.price_delta), active: r.active
});

const toMenuItem = (r: any): MenuItem => ({
  id: r.id, outletId: r.outlet_id, categoryId: u(r.category_id), sku: u(r.sku), name: r.name,
  description: u(r.description), imageUrl: u(r.image_url), basePrice: num(r.base_price),
  costPrice: numU(r.cost_price), soldOut: r.sold_out ?? false, taxIncluded: r.tax_included,
  defaultAreaId: u(r.default_area_id), prepTimeMinutes: numU(r.prep_time_minutes), active: r.active
});

const toVariant = (r: any): MenuItemVariant => ({
  id: r.id, menuItemId: r.menu_item_id, outletId: r.outlet_id, name: r.name, sku: u(r.sku),
  price: num(r.price), costPrice: numU(r.cost_price), sortOrder: num(r.sort_order), active: r.active
});

const toCatalogMeta = (r: any): MenuCatalogMeta => ({
  outletId: r.outlet_id, version: num(r.version), updatedAt: r.updated_at
});

const toRecipe = (r: any): MenuRecipe => ({ menuItemId: r.menu_item_id, name: r.name, lines: r.lines ?? [] });

const toShift = (r: any): PosShift => ({
  id: r.id, outletId: r.outlet_id, registerId: r.register_id, shiftLabel: r.shift_label,
  openedBy: r.opened_by ?? "", closedBy: u(r.closed_by), openingFloat: num(r.opening_float), status: r.status,
  openedAt: r.opened_at ?? "", closedAt: u(r.closed_at), systemCashTotal: numU(r.system_cash_total),
  systemQrisTotal: numU(r.system_qris_total), systemOnlineTotal: numU(r.system_online_total),
  systemGrandTotal: numU(r.system_grand_total), orderCount: numU(r.order_count),
  setoranSubmissionId: u(r.setoran_submission_id)
});

const toOrder = (r: any): PosOrder => ({
  id: r.id, outletId: r.outlet_id, shiftId: u(r.shift_id), orderNumber: r.order_number, channel: r.channel,
  tableLabel: u(r.table_label), customerName: u(r.customer_name), status: r.status,
  paymentStatus: r.payment_status, subtotal: num(r.subtotal), discountAmount: num(r.discount_amount),
  taxAmount: num(r.tax_amount), serviceChargeAmount: num(r.service_charge_amount), total: num(r.total),
  externalPlatform: u(r.external_platform), externalOrderId: u(r.external_order_id),
  createdBy: u(r.created_by), createdAt: r.created_at, paidAt: u(r.paid_at), completedAt: u(r.completed_at),
  items: r.items ?? [], payments: r.payments ?? [],
  integratedAt: u(r.integrated_at), inventoryIntegrated: u(r.inventory_integrated),
  customerId: u(r.customer_id), memberCode: u(r.member_code), loyaltyProgramApplied: u(r.loyalty_program_applied),
  totalGross: numU(r.total_gross), totalDiscount: numU(r.total_discount),
  totalLoyaltyDiscount: numU(r.total_loyalty_discount), totalVoucherDiscount: numU(r.total_voucher_discount),
  totalNet: numU(r.total_net), pointsEarned: numU(r.points_earned), pointsRedeemed: numU(r.points_redeemed),
  stampsEarned: numU(r.stamps_earned), rewardRedeemedStatus: u(r.reward_redeemed_status),
  loyaltyEarned: u(r.loyalty_earned), voidReason: u(r.void_reason), voidedAt: u(r.voided_at),
  voidedBy: u(r.voided_by), loyaltyReversed: u(r.loyalty_reversed)
});

const toStation = (r: any): KdsStation => ({
  id: r.id,
  outletId: r.outlet_id,
  name: r.name,
  sortOrder: num(r.sort_order),
  active: r.active ?? true
});

const toNotesCategory = (r: any): NotesCategory => ({
  id: r.id,
  outletId: r.outlet_id,
  name: r.name,
  group: u(r.grp),
  sortOrder: num(r.sort_order),
  active: r.active ?? true
});

const toMenuPackage = (r: any): MenuPackage => ({
  id: r.id,
  outletId: r.outlet_id,
  name: r.name,
  description: u(r.description),
  imageUrl: u(r.image_url),
  bundlePrice: num(r.bundle_price),
  sortOrder: num(r.sort_order),
  active: r.active ?? true
});

const toMenuPackageItem = (r: any): MenuPackageItem => ({
  id: r.id,
  packageId: r.package_id,
  menuItemId: r.menu_item_id,
  qty: num(r.qty) || 1,
  sortOrder: num(r.sort_order)
});

const toPromotion = (r: any): PosPromotion => ({
  id: r.id,
  outletId: r.outlet_id,
  name: r.name,
  code: u(r.code),
  promoType: r.promo_type,
  value: num(r.value),
  targetMenuItemIds: Array.isArray(r.target_menu_item_ids) ? r.target_menu_item_ids : [],
  minSubtotal: numU(r.min_subtotal),
  validFrom: u(r.valid_from),
  validTo: u(r.valid_to),
  sortOrder: num(r.sort_order),
  active: r.active ?? true
});

const toTicket = (r: any): KdsTicket => ({
  id: r.id, orderId: r.order_id, orderItemId: r.order_item_id, outletId: r.outlet_id, areaId: r.area_id,
  ticketNumber: numU(r.ticket_number), status: r.status, priority: num(r.priority), firedAt: r.fired_at,
  readyAt: u(r.ready_at), servedAt: u(r.served_at), itemName: r.item_name, qty: num(r.qty), note: u(r.note),
  tableLabel: u(r.table_label), channel: r.channel, orderNumber: u(r.order_number),
  cookingAt: u(r.cooking_at), bumpedAt: u(r.bumped_at), bumpReason: u(r.bump_reason)
});

const toTableSection = (r: any): TableSection => ({
  id: r.id, outletId: r.outlet_id, name: r.name, sortOrder: num(r.sort_order), active: r.active
});

const toFloorTable = (r: any): FloorTable => ({
  id: r.id, outletId: r.outlet_id, sectionId: r.section_id, label: r.label,
  seats: num(r.seats), sortOrder: num(r.sort_order), active: r.active
});

async function upsert(table: string, rows: unknown[], onConflict = "id") {
  if (!rows.length) return;
  await supabaseAdmin().from(table).upsert(rows as never[], { onConflict });
}

const COLS = {
  pos_registers: "id,outlet_id,area_id,code,name,active",
  menu_categories: "id,outlet_id,name,sort_order,active",
  menu_items: "id,outlet_id,category_id,sku,name,description,image_url,base_price,cost_price,sold_out,tax_included,default_area_id,prep_time_minutes,active",
  menu_modifiers: "id,outlet_id,name,price_delta,active",
  menu_item_modifiers: "menu_item_id,modifier_id",
  menu_item_variants: "id,menu_item_id,outlet_id,name,sku,price,cost_price,sort_order,active",
  menu_catalog_meta: "outlet_id,version,updated_at",
  pos_recipes: "menu_item_id,name,lines",
  pos_shifts: "id,outlet_id,register_id,shift_label,opened_by,closed_by,opening_float,status,opened_at,closed_at,system_cash_total,system_qris_total,system_online_total,system_grand_total,order_count,setoran_submission_id",
  pos_orders: "id,outlet_id,shift_id,order_number,channel,table_label,customer_name,status,payment_status,subtotal,discount_amount,tax_amount,service_charge_amount,total,external_platform,external_order_id,created_by,created_at,paid_at,completed_at,items,payments,integrated_at,inventory_integrated,customer_id,member_code,loyalty_program_applied,total_gross,total_discount,total_loyalty_discount,total_voucher_discount,total_net,points_earned,points_redeemed,stamps_earned,reward_redeemed_status,loyalty_earned,void_reason,voided_at,voided_by,loyalty_reversed",
  pos_kds_stations: "id,outlet_id,name,sort_order,active",
  pos_notes_categories: "id,outlet_id,name,grp,sort_order,active",
  menu_packages: "id,outlet_id,name,description,image_url,bundle_price,sort_order,active",
  menu_package_items: "id,package_id,menu_item_id,qty,sort_order",
  pos_promotions: "id,outlet_id,name,code,promo_type,value,target_menu_item_ids,min_subtotal,valid_from,valid_to,sort_order,active",
  pos_sales_channels: "id,outlet_id,name,kind,requires_table,sort_order,is_default,active",
  menu_branch_settings: "menu_item_id,outlet_id,price,active,sold_out",
  pos_cancel_reasons: "id,outlet_id,name,scope,requires_note,sort_order,active",
  pos_cashier_vouchers: "id,outlet_id,name,code,voucher_type,value,min_subtotal,max_discount,usage_limit,used_count,valid_from,valid_to,sort_order,active",
  menu_price_schedules: "id,outlet_id,name,days_of_week,start_time,end_time,adjust_type,value,target_menu_item_ids,target_category_ids,sort_order,active",
  pos_menu_layouts: "id,outlet_id,name,columns,view_mode,show_packages,category_order,hidden_category_ids,item_order_by_category,pinned_item_ids,sort_order,active",
  pos_payment_methods:
    "id,outlet_id,name,kind,coa_account_id,shift_bucket,held_cash_enabled,held_cash_source,held_cash_release_days,sort_order,active",
  kds_tickets: "id,order_id,order_item_id,outlet_id,area_id,ticket_number,status,priority,fired_at,ready_at,served_at,item_name,qty,note,table_label,channel,order_number,cooking_at,bumped_at,bump_reason",
  table_sections: "id,outlet_id,name,sort_order,active",
  floor_tables: "id,outlet_id,section_id,label,seats,sort_order,active"
} as const;

/** Tulis seluruh state POS/KDS ke tabel relasional (idempotent). */
export async function pushPos(snap: PosSnapshot): Promise<void> {
  try {
    await upsert("pos_registers", snap.posRegisters.map(registerRow));
    await upsert("menu_categories", snap.menuCategories.map(menuCategoryRow));
    await upsert("menu_items", snap.menuItems.map(menuItemRow));
    await upsert("menu_modifiers", (snap.menuModifiers ?? []).map(modifierRow));
    const linkRows = Object.entries(snap.menuItemModifierLinks ?? {}).flatMap(([menuItemId, ids]) =>
      ids.map((modifierId) => ({ menu_item_id: menuItemId, modifier_id: modifierId }))
    );
    if (linkRows.length) {
      await upsert("menu_item_modifiers", linkRows, "menu_item_id,modifier_id");
    }
    await upsert("menu_item_variants", (snap.menuItemVariants ?? []).map(variantRow));
    const metaRows = Object.values(snap.menuCatalogMeta ?? {}).map(catalogMetaRow);
    if (metaRows.length) await upsert("menu_catalog_meta", metaRows, "outlet_id");
    await upsert("pos_recipes", snap.posRecipes.map(recipeRow), "menu_item_id");
    await upsert("pos_shifts", snap.posShifts.map(shiftRow));
    await upsert("pos_orders", snap.posOrders.map(orderRow));
    await upsert("pos_kds_stations", snap.kdsStations.map(stationRow), "id,outlet_id");
    await upsert("pos_notes_categories", (snap.notesCategories ?? []).map(notesCategoryRow));
    await upsert("menu_packages", (snap.menuPackages ?? []).map(menuPackageRow));
    await upsert("menu_package_items", (snap.menuPackageItems ?? []).map(menuPackageItemRow));
    await upsert("pos_promotions", (snap.posPromotions ?? []).map(promotionRow));
    await upsert("pos_sales_channels", (snap.salesChannels ?? []).map(salesChannelRow), "id,outlet_id");
    await upsert("menu_branch_settings", (snap.menuBranchSettings ?? []).map(branchSettingRow), "menu_item_id,outlet_id");
    await upsert("pos_cancel_reasons", (snap.cancelReasons ?? []).map(cancelReasonRow));
    await upsert("pos_cashier_vouchers", (snap.cashierVouchers ?? []).map(cashierVoucherRow));
    await upsert("menu_price_schedules", (snap.menuPriceSchedules ?? []).map(priceScheduleRow));
    await upsert("pos_menu_layouts", (snap.posMenuLayouts ?? []).map(posMenuLayoutRow));
    await upsert("pos_payment_methods", (snap.posPaymentMethods ?? []).map(paymentMethodRow), "outlet_id,id");
    await upsert("kds_tickets", snap.kdsTickets.map(ticketRow));
    await upsert("table_sections", (snap.tableSections ?? []).map(tableSectionRow));
    await upsert("floor_tables", (snap.floorTables ?? []).map(floorTableRow));
  } catch {
    /* abaikan — relasional opsional, in-memory tetap sumber kerja */
  }
}

/** Baca seluruh state POS/KDS dari relasional. null bila belum ada data.
 *  Sekuensial (bukan Promise.all) — beberapa query paralel di klien yg sama
 *  bisa balik kosong tepat setelah DDL. */
export async function pullPos(): Promise<PosSnapshot | null> {
  try {
    const db = supabaseAdmin();
    const sel = async (t: keyof typeof COLS) => {
      const { data, error } = await db.from(t).select(COLS[t], { count: "exact" });
      if (error) return [] as any[];
      return (data ?? []) as any[];
    };
    const registers = await sel("pos_registers");
    const cats = await sel("menu_categories");
    const items = await sel("menu_items");
    const modifiers = await sel("menu_modifiers");
    const modLinks = await sel("menu_item_modifiers");
    const variants = await sel("menu_item_variants");
    const catalogMeta = await sel("menu_catalog_meta");
    const recipes = await sel("pos_recipes");
    const shifts = await sel("pos_shifts");
    const orders = await sel("pos_orders");
    const stations = await sel("pos_kds_stations");
    const notesCategories = await sel("pos_notes_categories");
    const menuPackages = await sel("menu_packages");
    const menuPackageItems = await sel("menu_package_items");
    const posPromotions = await sel("pos_promotions");
    const salesChannels = await sel("pos_sales_channels");
    const menuBranchSettings = await sel("menu_branch_settings");
    const cancelReasons = await sel("pos_cancel_reasons");
    const cashierVouchers = await sel("pos_cashier_vouchers");
    const menuPriceSchedules = await sel("menu_price_schedules");
    const posMenuLayouts = await sel("pos_menu_layouts");
    const posPaymentMethods = await sel("pos_payment_methods");
    const tickets = await sel("kds_tickets");
    const tableSections = await sel("table_sections");
    const floorTables = await sel("floor_tables");
    // Anggap "belum migrasi" bila katalog menu kosong (menu pasti ada setelah seed).
    if (items.length === 0 && orders.length === 0) return null;
    const menuItemModifierLinks: Record<string, string[]> = {};
    for (const row of modLinks) {
      const mid = row.menu_item_id as string;
      const modId = row.modifier_id as string;
      if (!menuItemModifierLinks[mid]) menuItemModifierLinks[mid] = [];
      menuItemModifierLinks[mid].push(modId);
    }
    const menuCatalogMeta: Record<string, MenuCatalogMeta> = {};
    for (const row of catalogMeta) {
      const m = toCatalogMeta(row);
      menuCatalogMeta[m.outletId] = m;
    }
    return {
      posRegisters: registers.map(toRegister),
      menuCategories: cats.map(toMenuCategory),
      menuItems: items.map(toMenuItem),
      menuModifiers: modifiers.map(toModifier),
      menuItemModifierLinks,
      menuItemVariants: variants.map(toVariant),
      menuCatalogMeta,
      posRecipes: recipes.map(toRecipe),
      posShifts: shifts.map(toShift),
      posOrders: orders.map(toOrder),
      kdsStations: stations.map(toStation),
      kdsTickets: tickets.map(toTicket),
      notesCategories: notesCategories.map(toNotesCategory),
      menuPackages: menuPackages.map(toMenuPackage),
      menuPackageItems: menuPackageItems.map(toMenuPackageItem),
      posPromotions: posPromotions.map(toPromotion),
      salesChannels: salesChannels.map(toSalesChannel),
      menuBranchSettings: menuBranchSettings.map(toBranchSetting),
      cancelReasons: cancelReasons.map(toCancelReason),
      cashierVouchers: cashierVouchers.map(toCashierVoucher),
      menuPriceSchedules: menuPriceSchedules.map(toPriceSchedule),
      posMenuLayouts: posMenuLayouts.map(toPosMenuLayout),
      posPaymentMethods: posPaymentMethods.map(toPaymentMethod),
      tableSections: tableSections.map(toTableSection),
      floorTables: floorTables.map(toFloorTable)
    };
  } catch {
    return null;
  }
}
