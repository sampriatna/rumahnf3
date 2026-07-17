import type {
  MasterLokasi,
  MasterBahan,
  BarangMasuk,
  TransferStok,
  PemakaianOutlet,
  WasteSelisih,
  OpnameAwal
} from "@/types/inventory";
import type { DateRange } from "./finance-source";
import { filterByDateRange } from "./finance-source";

export type { DateRange };

/** Kontrak sumber data inventory — Sheets / Supabase / Dummy. */
export interface InventorySource {
  getMasterLokasi(): Promise<MasterLokasi[]>;
  getMasterBahan(): Promise<MasterBahan[]>;
  getOpnameAwal(range?: DateRange): Promise<OpnameAwal[]>;
  getBarangMasuk(range?: DateRange): Promise<BarangMasuk[]>;
  getTransferStok(range?: DateRange): Promise<TransferStok[]>;
  getPemakaianOutlet(range?: DateRange): Promise<PemakaianOutlet[]>;
  getWasteSelisih(range?: DateRange): Promise<WasteSelisih[]>;
}

export function filterInventoryByDate<T extends { tanggal: string }>(
  rows: T[],
  range?: DateRange
): T[] {
  return filterByDateRange(rows, range);
}
