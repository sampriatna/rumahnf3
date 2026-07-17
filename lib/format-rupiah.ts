/** Format nilai rupiah untuk dashboard — null = belum ada data. */
export function formatRupiah(value: number | null): string {
  if (value == null) return "Rp —";
  return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
}
