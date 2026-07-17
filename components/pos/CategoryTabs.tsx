"use client";

import type { MenuCategory } from "@/lib/pos-kds-roadmap";

export function CategoryTabs({
  categories,
  activeId,
  onChange,
  variant = "v2"
}: {
  categories: MenuCategory[];
  activeId: string | null;
  onChange: (id: string) => void;
  variant?: "default" | "v2";
}) {
  if (categories.length === 0) return null;

  const tabActiveClass =
    variant === "v2"
      ? "nf3-chip-active px-4 py-2.5 text-sm"
      : "rounded-full bg-navy-800 px-4 py-2 text-xs font-bold text-white";
  const tabIdleClass =
    variant === "v2"
      ? "nf3-chip px-4 py-2.5 text-sm"
      : "rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200";

  return (
    <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Kategori menu">
      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          role="tab"
          aria-selected={activeId === cat.id}
          onClick={() => onChange(cat.id)}
          className={`transition ${activeId === cat.id ? tabActiveClass : tabIdleClass}`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
