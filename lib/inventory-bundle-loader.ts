import type { MasterBahan, MasterLokasi } from "@/types/inventory";
import type { InventoryMovementBundle } from "./inventory-metrics";
import { getActiveInventorySource } from "./sources";

export type InventoryBundleSnapshot = {
  bahanList: MasterBahan[];
  lokasiList: MasterLokasi[];
  bundle: InventoryMovementBundle;
};

/** Muat master + pergerakan dari sumber aktif (Supabase / Sheets / dummy). */
export async function loadInventoryBundle(): Promise<InventoryBundleSnapshot> {
  const source = getActiveInventorySource();
  const [bahanList, lokasiList, opname, masuk, transfer, pemakaian, waste] = await Promise.all([
    source.getMasterBahan(),
    source.getMasterLokasi(),
    source.getOpnameAwal(),
    source.getBarangMasuk(),
    source.getTransferStok(),
    source.getPemakaianOutlet(),
    source.getWasteSelisih()
  ]);

  return {
    bahanList,
    lokasiList,
    bundle: { opname, masuk, transfer, pemakaian, waste }
  };
}
