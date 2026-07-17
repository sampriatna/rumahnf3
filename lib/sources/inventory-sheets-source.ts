import type { InventorySource } from "./inventory-source";

/**
 * Google Sheets inventory adapter — TODO: fetch dari spreadsheet owner.
 * Sheet ID: 1az9ak9JWE5JpZwatcGkmN76hb4IEN9vc2k8Qx84ISe4
 */
export class InventorySheetsSource implements InventorySource {
  async getMasterLokasi() {
    // TODO: Master_Lokasi
    return [];
  }

  async getMasterBahan() {
    // TODO: Master_Bahan
    return [];
  }

  async getOpnameAwal() {
    // TODO: Opname_Awal
    return [];
  }

  async getBarangMasuk() {
    // TODO: Barang_Masuk — validasi lokasiTujuan wajib saat import
    return [];
  }

  async getTransferStok() {
    // TODO: Transfer_Stok
    return [];
  }

  async getPemakaianOutlet() {
    // TODO: Pemakaian_Outlet (+ auto dari POS BOM nanti)
    return [];
  }

  async getWasteSelisih() {
    // TODO: Waste_Selisih
    return [];
  }
}
