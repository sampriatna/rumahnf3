import type { DashboardMenuGroup, MenuItem } from "./types";

export const DASHBOARD_GROUP_LABELS: Record<DashboardMenuGroup, string> = {
  operasional: "Operasional & Laporan",
  sales: "Penjualan & POS",
  gudang: "Gudang & Inventory",
  "hr-keuangan": "Keuangan & Insight",
  sistem: "Pengaturan Sistem"
};

export const DASHBOARD_GROUP_ORDER: DashboardMenuGroup[] = [
  "operasional",
  "sales",
  "gudang",
  "hr-keuangan",
  "sistem"
];

export type MenuGroupSection = {
  group: DashboardMenuGroup;
  label: string;
  items: MenuItem[];
};

export function groupMenuItems(menu: MenuItem[]): MenuGroupSection[] {
  const buckets = new Map<DashboardMenuGroup, MenuItem[]>();

  for (const item of menu) {
    const group = item.group ?? "operasional";
    const list = buckets.get(group) ?? [];
    list.push(item);
    buckets.set(group, list);
  }

  return DASHBOARD_GROUP_ORDER.filter((group) => buckets.has(group)).map((group) => ({
    group,
    label: DASHBOARD_GROUP_LABELS[group],
    items: buckets.get(group)!
  }));
}
