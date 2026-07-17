/** Denominasi uang tunai umum UKM Indonesia. */
export const CASH_DENOMINATIONS = [5_000, 10_000, 20_000, 50_000, 100_000, 200_000, 500_000] as const;

/** Saran nominal bayar tunai (≥ sisa tagihan), untuk tombol quick cash. */
export function suggestCashAmounts(balance: number): number[] {
  if (balance <= 0) return [];

  const out = new Set<number>();
  out.add(balance);

  for (const d of CASH_DENOMINATIONS) {
    if (d >= balance) out.add(d);
  }

  const step10 = Math.ceil(balance / 10_000) * 10_000;
  if (step10 >= balance) out.add(step10);

  const step50 = Math.ceil(balance / 50_000) * 50_000;
  if (step50 >= balance) out.add(step50);

  return Array.from(out)
    .sort((a, b) => a - b)
    .slice(0, 6);
}

export function calcChange(received: number, balance: number) {
  return Math.max(0, received - balance);
}
