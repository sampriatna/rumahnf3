/** Voucher kasir default per outlet — dipakai dengan kode di checkout. */
export const CASHIER_VOUCHER_SEED: Array<{
  outletId: string;
  name: string;
  code: string;
  voucherType: "fixed" | "percent";
  value: number;
  minSubtotal?: number;
  maxDiscount?: number;
  usageLimit?: number;
}> = [
  {
    outletId: "kbu",
    name: "Voucher Rp 10rb",
    code: "KBU10K",
    voucherType: "fixed",
    value: 10_000,
    minSubtotal: 50_000,
    usageLimit: 500
  },
  {
    outletId: "kbu",
    name: "Diskon 15%",
    code: "KBU15",
    voucherType: "percent",
    value: 15,
    minSubtotal: 80_000,
    maxDiscount: 25_000,
    usageLimit: 200
  },
  {
    outletId: "kisamen",
    name: "Voucher Rp 5rb",
    code: "KSM5K",
    voucherType: "fixed",
    value: 5_000,
    minSubtotal: 35_000
  },
  {
    outletId: "samtaro",
    name: "Grosir potongan 8%",
    code: "SMT8",
    voucherType: "percent",
    value: 8,
    minSubtotal: 100_000,
    maxDiscount: 50_000
  }
];
