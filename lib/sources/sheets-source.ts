import type { FinanceSource } from "./finance-source";

/**
 * Google Sheets adapter — TODO: implementasi fetch ke spreadsheet owner.
 * Env: GOOGLE_SHEETS_ID, GOOGLE_SERVICE_ACCOUNT_JSON
 */
export class SheetsSource implements FinanceSource {
  async getMasterOutlet() {
    // TODO: baca sheet Master_Outlet
    return [];
  }

  async getMasterAkun() {
    // TODO: baca sheet Master_Akun
    return [];
  }

  async getUangMasuk() {
    // TODO: baca sheet Uang_Masuk
    return [];
  }

  async getPengeluaran() {
    // TODO: baca sheet Pengeluaran
    return [];
  }

  async getPriveOwner() {
    // TODO: baca sheet Prive_Owner
    return [];
  }

  async getTransferAntarAkun() {
    // TODO: baca sheet Transfer_Antar_Akun
    return [];
  }

  async getPiutang() {
    // TODO: baca sheet Piutang
    return [];
  }

  async getHutang() {
    // TODO: baca sheet Hutang
    return [];
  }

  async getKasHarianFNB() {
    // TODO: baca sheet Kas_Harian_FNB
    return [];
  }
}
