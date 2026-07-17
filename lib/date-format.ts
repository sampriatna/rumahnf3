/** Format tanggal internal ISO → tampilan dd/mm/yyyy. */
export function formatDisplayDate(iso: string): string {
  const d = iso.slice(0, 10);
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return iso;
  return `${day}/${m}/${y}`;
}

/** Tanggal hari ini sebagai YYYY-MM-DD (UTC date part — konsisten di server). */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Bandingkan tanggal ISO (hanya bagian YYYY-MM-DD). */
export function isSameIsoDay(a: string, b: string): boolean {
  return a.slice(0, 10) === b.slice(0, 10);
}
