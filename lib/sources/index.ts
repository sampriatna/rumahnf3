import type { FinanceSource } from "./finance-source";
import type { InventorySource } from "./inventory-source";
import { DummySource } from "./dummy-source";
import { SheetsSource } from "./sheets-source";
import { SupabaseSource } from "./supabase-source";
import { InventoryDummySource } from "./inventory-dummy-source";
import { InventorySheetsSource } from "./inventory-sheets-source";
import { InventorySupabaseSource } from "./inventory-supabase-source";

export type FinanceSourceKind = "dummy" | "sheets" | "supabase";

export type { FinanceSource, DateRange } from "./finance-source";
export { DummySource } from "./dummy-source";
export { SheetsSource } from "./sheets-source";
export { SupabaseSource } from "./supabase-source";

function resolveKind(): FinanceSourceKind {
  const raw = process.env.FINANCE_SOURCE?.toLowerCase();
  if (raw === "sheets" || raw === "supabase") return raw;
  return "dummy";
}

function resolveInventoryKind(): FinanceSourceKind {
  const inv = process.env.INVENTORY_SOURCE?.toLowerCase();
  if (inv === "sheets" || inv === "supabase" || inv === "dummy") return inv;
  return resolveKind();
}

let cached: FinanceSource | null = null;

/** Sumber data keuangan aktif (dummy default, ganti via FINANCE_SOURCE). */
export function getActiveFinanceSource(): FinanceSource {
  if (cached) return cached;
  const kind = resolveKind();
  cached =
    kind === "sheets" ? new SheetsSource() : kind === "supabase" ? new SupabaseSource() : new DummySource();
  return cached;
}

/** Reset cache — berguna di test. */
export function resetFinanceSourceCache() {
  cached = null;
}

export type { InventorySource } from "./inventory-source";
export { InventoryDummySource } from "./inventory-dummy-source";
export { InventorySheetsSource } from "./inventory-sheets-source";
export { InventorySupabaseSource } from "./inventory-supabase-source";

let invCached: InventorySource | null = null;

export function getActiveInventorySource(): InventorySource {
  if (invCached) return invCached;
  const kind = resolveInventoryKind();
  invCached =
    kind === "sheets"
      ? new InventorySheetsSource()
      : kind === "supabase"
        ? new InventorySupabaseSource()
        : new InventoryDummySource();
  return invCached;
}

export function resetInventorySourceCache() {
  invCached = null;
}
