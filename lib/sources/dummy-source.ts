import type { FinanceSource, DateRange } from "./finance-source";
import { filterByDateRange } from "./finance-source";
import {
  DUMMY_MASTER_OUTLET,
  DUMMY_MASTER_AKUN,
  DUMMY_UANG_MASUK,
  DUMMY_PENGELUARAN,
  DUMMY_PRIVE,
  DUMMY_TRANSFER,
  DUMMY_PIUTANG,
  DUMMY_HUTANG,
  DUMMY_KAS_HARIAN
} from "./dummy-data";

/** Sumber data dummy — data terpusat di dummy-data.ts. */
export class DummySource implements FinanceSource {
  async getMasterOutlet() {
    return [...DUMMY_MASTER_OUTLET];
  }

  async getMasterAkun() {
    return [...DUMMY_MASTER_AKUN];
  }

  async getUangMasuk(range?: DateRange) {
    return filterByDateRange(DUMMY_UANG_MASUK, range);
  }

  async getPengeluaran(range?: DateRange) {
    return filterByDateRange(DUMMY_PENGELUARAN, range);
  }

  async getPriveOwner(range?: DateRange) {
    return filterByDateRange(DUMMY_PRIVE, range);
  }

  async getTransferAntarAkun(range?: DateRange) {
    return filterByDateRange(DUMMY_TRANSFER, range);
  }

  async getPiutang() {
    return [...DUMMY_PIUTANG];
  }

  async getHutang() {
    return [...DUMMY_HUTANG];
  }

  async getKasHarianFNB(range?: DateRange) {
    return filterByDateRange(DUMMY_KAS_HARIAN, range);
  }
}
