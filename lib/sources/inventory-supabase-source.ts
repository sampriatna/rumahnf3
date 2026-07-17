import type { InventorySource, DateRange } from "./inventory-source";
import { filterInventoryByDate } from "./inventory-source";
import { getInventorySheetRuntime } from "@/lib/inventory-sheet-store";
import { sheetsWriterActive } from "@/lib/inventory-sheets-writer";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  pullMasterLokasi,
  pullMasterBahan,
  pullOpnameAwal,
  pullBarangMasuk,
  pullTransferStok,
  pullPemakaianOutlet,
  pullWasteSelisih
} from "@/lib/db/inventory-sheets-repo";

function mergeRows<T extends { tanggal: string }>(base: T[], extra: T[], range?: DateRange) {
  return filterInventoryByDate([...base, ...extra], range);
}

/**
 * Supabase adapter — nf3.master_bahan, barang_masuk, dll. (inventory-sheets.sql).
 * Runtime lokal hanya di-merge bila Supabase writer belum aktif (mode dummy/dev).
 */
export class InventorySupabaseSource implements InventorySource {
  async getMasterLokasi() {
    if (!isSupabaseConfigured()) return [];
    return pullMasterLokasi();
  }

  async getMasterBahan() {
    if (!isSupabaseConfigured()) return [];
    return pullMasterBahan();
  }

  async getOpnameAwal(range?: DateRange) {
    if (!isSupabaseConfigured()) return [];
    const base = await pullOpnameAwal(range);
    if (sheetsWriterActive()) return filterInventoryByDate(base, range);
    const rt = getInventorySheetRuntime();
    return mergeRows(base, rt.opnameLogs, range);
  }

  async getBarangMasuk(range?: DateRange) {
    if (!isSupabaseConfigured()) return [];
    const base = await pullBarangMasuk(range);
    if (sheetsWriterActive()) return filterInventoryByDate(base, range);
    const rt = getInventorySheetRuntime();
    return mergeRows(base, rt.barangMasuk, range);
  }

  async getTransferStok(range?: DateRange) {
    if (!isSupabaseConfigured()) return [];
    return pullTransferStok(range);
  }

  async getPemakaianOutlet(range?: DateRange) {
    if (!isSupabaseConfigured()) return [];
    const base = await pullPemakaianOutlet(range);
    if (sheetsWriterActive()) return filterInventoryByDate(base, range);
    const rt = getInventorySheetRuntime();
    return mergeRows(base, rt.pemakaian, range);
  }

  async getWasteSelisih(range?: DateRange) {
    if (!isSupabaseConfigured()) return [];
    const base = await pullWasteSelisih(range);
    if (sheetsWriterActive()) return filterInventoryByDate(base, range);
    const rt = getInventorySheetRuntime();
    return mergeRows(base, rt.waste, range);
  }
}
