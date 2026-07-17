/** Margin kotor produk menu (%) — aman di client component. */
export function calcMenuMargin(basePrice: number, costPrice?: number): number | null {
  if (costPrice == null || costPrice <= 0 || basePrice <= 0) return null;
  return Math.round(((basePrice - costPrice) / basePrice) * 100);
}
