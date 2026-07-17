import type {
  MasterOutlet,
  MasterAkun,
  UangMasuk,
  Pengeluaran,
  PriveOwner,
  TransferAntarAkun,
  Piutang,
  Hutang,
  KasHarianFNB
} from "@/types/finance";

export type DateRange = {
  from?: string;
  to?: string;
};

/** Kontrak sumber data keuangan — implementasi Sheets / Supabase / Dummy. */
export interface FinanceSource {
  getMasterOutlet(): Promise<MasterOutlet[]>;
  getMasterAkun(): Promise<MasterAkun[]>;
  getUangMasuk(range?: DateRange): Promise<UangMasuk[]>;
  getPengeluaran(range?: DateRange): Promise<Pengeluaran[]>;
  getPriveOwner(range?: DateRange): Promise<PriveOwner[]>;
  getTransferAntarAkun(range?: DateRange): Promise<TransferAntarAkun[]>;
  getPiutang(): Promise<Piutang[]>;
  getHutang(): Promise<Hutang[]>;
  getKasHarianFNB(range?: DateRange): Promise<KasHarianFNB[]>;
}

export function filterByDateRange<T extends { tanggal: string }>(
  rows: T[],
  range?: DateRange
): T[] {
  if (!range?.from && !range?.to) return rows;
  return rows.filter((r) => {
    const d = r.tanggal.slice(0, 10);
    if (range.from && d < range.from) return false;
    if (range.to && d > range.to) return false;
    return true;
  });
}
