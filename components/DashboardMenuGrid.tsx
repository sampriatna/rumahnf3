import type { MenuItem } from "@/lib/types";
import { MenuCard } from "./MenuCard";

/** Grid menu — tanpa placeholder kosong yang bikin layout aneh. */
export function DashboardMenuGrid({ items }: { items: MenuItem[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <MenuCard key={item.id} item={item} />
      ))}
    </div>
  );
}
