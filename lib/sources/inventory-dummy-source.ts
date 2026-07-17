import type { InventorySource, DateRange } from "./inventory-source";
import { filterInventoryByDate } from "./inventory-source";
import { getInventorySheetRuntime } from "@/lib/inventory-sheet-store";
import {
  DUMMY_MASTER_LOKASI,
  DUMMY_MASTER_BAHAN,
  DUMMY_OPNAME,
  DUMMY_BARANG_MASUK,
  DUMMY_TRANSFER,
  DUMMY_PEMAKAIAN,
  DUMMY_WASTE
} from "./inventory-dummy-data";

function mergeRows<T extends { tanggal: string }>(base: T[], extra: T[], range?: DateRange) {
  return filterInventoryByDate([...base, ...extra], range);
}

export class InventoryDummySource implements InventorySource {
  async getMasterLokasi() {
    return [...DUMMY_MASTER_LOKASI];
  }

  async getMasterBahan() {
    return [...DUMMY_MASTER_BAHAN];
  }

  async getOpnameAwal(range?: DateRange) {
    const rt = getInventorySheetRuntime();
    return mergeRows(DUMMY_OPNAME, rt.opnameLogs, range);
  }

  async getBarangMasuk(range?: DateRange) {
    const rt = getInventorySheetRuntime();
    return mergeRows(DUMMY_BARANG_MASUK, rt.barangMasuk, range);
  }

  async getTransferStok(range?: DateRange) {
    return filterInventoryByDate(DUMMY_TRANSFER, range);
  }

  async getPemakaianOutlet(range?: DateRange) {
    const rt = getInventorySheetRuntime();
    return mergeRows(DUMMY_PEMAKAIAN, rt.pemakaian, range);
  }

  async getWasteSelisih(range?: DateRange) {
    const rt = getInventorySheetRuntime();
    return mergeRows(DUMMY_WASTE, rt.waste, range);
  }
}
