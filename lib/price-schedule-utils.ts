/** Util murni — aman di-import dari Client Component (tanpa store/fs). */

export const DAY_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export function formatScheduleDays(days: number[]) {
  if (days.length === 7 || days.length === 0) return "Setiap hari";
  return days.map((d) => DAY_LABELS[d] ?? String(d)).join(", ");
}
