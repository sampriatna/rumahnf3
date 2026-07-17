/** Label tampilan operasional (Bahasa Indonesia) — display only, tidak ubah enum backend. */

export const orderStatusLabel: Record<string, string> = {
  open: "Menunggu",
  held: "Simpan Draft",
  completed: "Selesai",
  void: "Dibatalkan",
  merged: "Digabung"
};

export const paymentStatusLabel: Record<string, string> = {
  unpaid: "Belum Dibayar",
  partial: "Dibayar Sebagian",
  paid: "Lunas",
  refunded: "Dikembalikan"
};

export const productionStatusLabel: Record<string, string> = {
  pending: "Menunggu",
  fired: "Dikirim Dapur",
  cooking: "Sedang Dibuat",
  ready: "Siap",
  served: "Sudah Disajikan",
  void: "Dibatalkan"
};

export const kdsColumnLabel: Record<string, string> = {
  baru: "Pesanan Baru",
  diproces: "Sedang Dibuat",
  siap: "Siap",
  problem: "Bermasalah",
  selesai: "Selesai"
};

export function labelFor(
  map: Record<string, string>,
  key: string | undefined | null,
  fallback = "—"
): string {
  if (!key) return fallback;
  return map[key] ?? fallback;
}
