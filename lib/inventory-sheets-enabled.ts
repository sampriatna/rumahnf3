/** Apakah penulis mutasi harus ke Supabase Sheets tables. */
export function isSupabaseInventoryEnabled(): boolean {
  const inv = process.env.INVENTORY_SOURCE?.toLowerCase();
  if (inv === "supabase") return true;
  if (inv === "dummy" || inv === "sheets") return false;
  const fin = process.env.FINANCE_SOURCE?.toLowerCase();
  return fin === "supabase";
}
