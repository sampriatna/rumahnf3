import fs from "fs";
import path from "path";
import type {
  BarangMasuk,
  PemakaianOutlet,
  WasteSelisih,
  OpnameAwal,
  ClosingOpnameRule
} from "@/types/inventory";
import { DEFAULT_CLOSING_OPNAME_RULES } from "./closing-opname-defaults";

export type InventorySheetRuntime = {
  waste: WasteSelisih[];
  pemakaian: PemakaianOutlet[];
  barangMasuk: BarangMasuk[];
  opnameLogs: OpnameAwal[];
};

type InventorySheetStore = {
  closingRules: ClosingOpnameRule[];
  runtime: InventorySheetRuntime;
};

const STORE_FILE = path.join(process.cwd(), ".data", "sheet-inventory.json");

const g = globalThis as typeof globalThis & {
  __NF3_SHEET_INV__?: InventorySheetStore;
};

function emptyRuntime(): InventorySheetRuntime {
  return { waste: [], pemakaian: [], barangMasuk: [], opnameLogs: [] };
}

function defaultStore(): InventorySheetStore {
  return {
    closingRules: DEFAULT_CLOSING_OPNAME_RULES.map((r) => ({ ...r })),
    runtime: emptyRuntime()
  };
}

function loadFromDisk(): InventorySheetStore | null {
  try {
    if (!fs.existsSync(STORE_FILE)) return null;
    const raw = fs.readFileSync(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<InventorySheetStore>;
    return {
      closingRules:
        Array.isArray(parsed.closingRules) && parsed.closingRules.length > 0
          ? parsed.closingRules
          : DEFAULT_CLOSING_OPNAME_RULES.map((r) => ({ ...r })),
      runtime: {
        waste: parsed.runtime?.waste ?? [],
        pemakaian: parsed.runtime?.pemakaian ?? [],
        barangMasuk: parsed.runtime?.barangMasuk ?? [],
        opnameLogs: parsed.runtime?.opnameLogs ?? []
      }
    };
  } catch {
    return null;
  }
}

function saveToDisk(store: InventorySheetStore) {
  try {
    const dir = path.dirname(STORE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
  } catch {
    /* abaikan */
  }
}

function getStore(): InventorySheetStore {
  if (!g.__NF3_SHEET_INV__) {
    g.__NF3_SHEET_INV__ = loadFromDisk() ?? defaultStore();
  }
  return g.__NF3_SHEET_INV__;
}

function persist() {
  saveToDisk(getStore());
}

export function getInventorySheetRuntime(): InventorySheetRuntime {
  return getStore().runtime;
}

export function listClosingOpnameRules(): ClosingOpnameRule[] {
  return [...getStore().closingRules];
}

export function listClosingRulesForKds(outletId: string, stationId: string): ClosingOpnameRule[] {
  return getStore().closingRules.filter(
    (r) =>
      r.outletId === outletId && (!r.stationId || r.stationId === stationId)
  );
}

export function saveClosingOpnameRules(rules: ClosingOpnameRule[]) {
  getStore().closingRules = rules;
  persist();
}

export function updateClosingOpnameRule(id: string, patch: Partial<ClosingOpnameRule>) {
  const store = getStore();
  const idx = store.closingRules.findIndex((r) => r.id === id);
  if (idx < 0) return false;
  store.closingRules[idx] = { ...store.closingRules[idx], ...patch };
  persist();
  return true;
}

export function appendSheetWaste(row: WasteSelisih) {
  getStore().runtime.waste.push(row);
  persist();
}

export function appendSheetPemakaian(row: PemakaianOutlet) {
  getStore().runtime.pemakaian.push(row);
  persist();
}

export function appendSheetBarangMasuk(row: BarangMasuk) {
  getStore().runtime.barangMasuk.push(row);
  persist();
}

export function appendSheetOpnameLog(row: OpnameAwal) {
  getStore().runtime.opnameLogs.push(row);
  persist();
}

/** Reset cache — untuk test. */
export function resetInventorySheetStore() {
  delete g.__NF3_SHEET_INV__;
  try {
    if (fs.existsSync(STORE_FILE)) fs.unlinkSync(STORE_FILE);
  } catch {
    /* abaikan */
  }
}
