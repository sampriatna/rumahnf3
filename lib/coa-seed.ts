import type { CoaAccountType } from "./coa-service";

/** Bagan akun default NF3 — selaras akun ledger yang sudah dipakai. */
export const COA_SEED: Array<{
  id: string;
  code: string;
  name: string;
  accountType: CoaAccountType;
  trackBalance?: boolean;
  ready?: boolean;
}> = [
  { id: "cash_physical", code: "1101", name: "Kas Fisik Outlet", accountType: "asset", trackBalance: true, ready: true },
  { id: "bank", code: "1102", name: "Saldo Bank", accountType: "asset", trackBalance: true, ready: true },
  { id: "qris_pending", code: "1103", name: "QRIS Belum Cair", accountType: "asset", trackBalance: false, ready: false },
  {
    id: "gofood_pending",
    code: "1104",
    name: "GoFood/Grab Belum Cair",
    accountType: "asset",
    trackBalance: false,
    ready: false
  },
  {
    id: "marketplace_pending",
    code: "1105",
    name: "Marketplace Belum Cair",
    accountType: "asset",
    trackBalance: false,
    ready: false
  },
  { id: "revenue_pos", code: "4101", name: "Pendapatan Penjualan POS", accountType: "revenue", trackBalance: false, ready: true },
  { id: "cogs", code: "5101", name: "Harga Pokok Penjualan", accountType: "expense", trackBalance: false, ready: true }
];
