// Finance / Kas — ledger append-only, akun, utang, piutang, kas tertahan.

export type TransactionType = "in" | "out";

export type AccountId =
  | "cash_physical"
  | "bank"
  | "jagasatru_wallet"
  | "purchasing_kecil_wallet"
  | "qris_pending"
  | "marketplace_pending"
  | "gofood_pending";

export const ACCOUNTS: Record<AccountId, { label: string; ready: boolean }> = {
  cash_physical: { label: "Kas Besar", ready: true },
  bank: { label: "Rekening", ready: true },
  jagasatru_wallet: { label: "Jagasatru", ready: true },
  purchasing_kecil_wallet: { label: "Purchasing Kecil", ready: true },
  qris_pending: { label: "QRIS Belum Cair", ready: false },
  marketplace_pending: { label: "Marketplace Belum Cair", ready: false },
  gofood_pending: { label: "GoFood/Grab/Shopee Belum Cair", ready: false }
};

export type LedgerEntry = {
  id: string;
  date: string; // ISO
  outletId?: string;
  outletName?: string;
  accountId: AccountId;
  transactionType: TransactionType;
  category: string;
  amount: number;
  paymentMethod?: string;
  sourceDocType?: string;
  sourceDocId?: string;
  transferRef?: string;
  areaUnit?: string;
  verificationStatus?: "verified" | "pending";
  verifiedBy?: string;
  evidenceUrl?: string;
  note?: string;
  createdBy: string;
  createdAt: string;
};

export type Debt = {
  id: string;
  type: "supplier" | "operational" | "payroll";
  party: string;
  amount: number;
  dueDate: string;
  status: "unpaid" | "paid" | "overdue";
  sourceDocType?: string;
  sourceDocId?: string;
  note?: string;
  createdAt: string;
};

export type Receivable = {
  id: string;
  party: string;
  amount: number;
  dueDate: string;
  status: "unpaid" | "paid";
  note?: string;
  createdAt: string;
};

export type HeldCash = {
  id: string;
  source: string;
  amount: number;
  expectedReleaseDate?: string;
  status: "pending" | "released";
  sourceDocId?: string;
  createdAt: string;
};

export type FinanceSummary = {
  kasTersedia: number;
  kasMasukHariIni: number;
  kasKeluarHariIni: number;
  kasTertahan: number;
  piutang: number;
  utangJatuhTempo: number;
  kebutuhanWajib7Hari: number;
  freeCash: number;
  totalUangBisnis: number;
};

export const KAS_MASUK_CATEGORIES = [
  "Setoran Kasir",
  "Cash Outlet",
  "Transfer Bank",
  "QRIS",
  "GoFood/Grab/Shopee",
  "Marketplace NF",
  "Piutang Masuk",
  "Lainnya"
];

export const KAS_KELUAR_CATEGORIES = [
  "Belanja Bahan",
  "Packaging",
  "Supplier",
  "Gaji",
  "Lembur",
  "Kasbon",
  "Ads",
  "Maintenance",
  "Listrik",
  "Air",
  "Internet",
  "Sewa",
  "Biaya Lain"
];

/** Saldo awal demo. */
export function seedAccountBalances(): Record<AccountId, number> {
  return {
    cash_physical: 35_000_000,
    bank: 120_000_000,
    jagasatru_wallet: 0,
    purchasing_kecil_wallet: 0,
    qris_pending: 0,
    marketplace_pending: 0,
    gofood_pending: 0
  };
}

export function seedReceivables(): Receivable[] {
  return [
    {
      id: "piut-1",
      party: "Catering Event ABC",
      amount: 8_500_000,
      dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
      status: "unpaid",
      note: "DP catering belum lunas",
      createdAt: new Date().toISOString()
    }
  ];
}

export function seedDebts(): Debt[] {
  return [
    {
      id: "utang-1",
      type: "operational",
      party: "PLN Outlet KBU",
      amount: 2_200_000,
      dueDate: new Date(Date.now() + 3 * 86400000).toISOString(),
      status: "unpaid",
      note: "Tagihan listrik bulan ini",
      createdAt: new Date().toISOString()
    }
  ];
}

export function formatRp(n: number) {
  return `Rp ${Math.round(n).toLocaleString("id-ID")}`;
}
