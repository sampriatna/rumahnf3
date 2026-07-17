import type { FinanceSource } from "./finance-source";

/**
 * Supabase adapter — TODO: baca tabel nf3.finance_* setelah migrasi dari Sheets.
 */
export class SupabaseSource implements FinanceSource {
  async getMasterOutlet() {
    // TODO: select dari nf3.master_outlet
    return [];
  }

  async getMasterAkun() {
    // TODO: select dari nf3.master_akun
    return [];
  }

  async getUangMasuk() {
    // TODO: select dari nf3.uang_masuk
    return [];
  }

  async getPengeluaran() {
    // TODO: select dari nf3.pengeluaran
    return [];
  }

  async getPriveOwner() {
    // TODO: select dari nf3.prive_owner
    return [];
  }

  async getTransferAntarAkun() {
    // TODO: select dari nf3.transfer_antar_akun
    return [];
  }

  async getPiutang() {
    // TODO: select dari nf3.piutang
    return [];
  }

  async getHutang() {
    // TODO: select dari nf3.hutang
    return [];
  }

  async getKasHarianFNB() {
    // TODO: select dari nf3.kas_harian_fnb
    return [];
  }
}
