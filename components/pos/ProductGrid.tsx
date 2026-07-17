"use client";

import { useMemo, useState, useEffect } from "react";
import type { MenuCategory, MenuItem, MenuModifier, MenuItemVariant } from "@/lib/pos-kds-roadmap";
import { formatRp } from "@/lib/finance";
import { addToCartAction, addPackageToCartAction } from "@/app/pos-actions";
import type { MenuPackage } from "@/lib/package-service";
import type { AppliedPosMenuLayout } from "@/lib/pos-menu-layout-types";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductSearch } from "./ProductSearch";
import { CategoryTabs } from "./CategoryTabs";
import { ProductCardSoldOut, ProductCardButton } from "./ProductCard";
import { ModifierDialog } from "./ModifierDialog";

export function ProductGrid({
  outletId,
  shiftId,
  categories,
  items,
  modifierMap,
  variantMap,
  packages = [],
  menuLayout,
  variant = "v2",
  focusItemId
}: {
  outletId: string;
  shiftId: string;
  categories: MenuCategory[];
  items: MenuItem[];
  modifierMap: Record<string, MenuModifier[]>;
  variantMap: Record<string, MenuItemVariant[]>;
  packages?: Array<MenuPackage & { summary: string }>;
  menuLayout?: AppliedPosMenuLayout;
  variant?: "default" | "v2";
  focusItemId?: string;
}) {
  const [pickerItem, setPickerItem] = useState<MenuItem | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!focusItemId) return;
    const item = items.find((i) => i.id === focusItemId);
    if (!item || item.soldOut) return;
    setPickerItem(item);
    if (item.categoryId) setActiveCategoryId(item.categoryId);
    setSearchQuery(item.name);
  }, [focusItemId, items]);

  const tileClass =
    variant === "v2"
      ? "pos-menu-tile"
      : "panel flex h-full min-h-[120px] w-full flex-col overflow-hidden p-0 text-left transition hover:border-gold-400 active:scale-[0.98]";

  const layoutCategories = menuLayout?.categories ?? categories;
  const layoutItemsByCategory =
    menuLayout?.itemsByCategory ??
    Object.fromEntries(layoutCategories.map((cat) => [cat.id, items.filter((i) => i.categoryId === cat.id)]));
  const pinnedItems = menuLayout?.pinnedItems ?? [];
  const showPackages = menuLayout?.showPackages ?? true;
  const viewMode = menuLayout?.viewMode ?? "scroll";
  const gridColsClass =
    menuLayout?.columns === 2
      ? "grid-cols-2"
      : menuLayout?.columns === 4
        ? "grid-cols-2 sm:grid-cols-4"
        : "grid-cols-2 sm:grid-cols-3";

  const q = searchQuery.trim().toLowerCase();
  const matchesSearch = (item: MenuItem) => !q || item.name.toLowerCase().includes(q);

  const categoriesWithItems = layoutCategories.filter(
    (cat) => (layoutItemsByCategory[cat.id]?.filter(matchesSearch).length ?? 0) > 0
  );
  const tabCategories = viewMode === "tabs" ? categoriesWithItems : layoutCategories;
  const defaultTabId = tabCategories[0]?.id ?? null;
  const visibleCategoryId =
    viewMode === "tabs"
      ? activeCategoryId && tabCategories.some((c) => c.id === activeCategoryId)
        ? activeCategoryId
        : defaultTabId
      : null;

  const visibleItems = useMemo(() => {
    const match = (item: MenuItem) =>
      !searchQuery.trim() || item.name.toLowerCase().includes(searchQuery.trim().toLowerCase());
    if (viewMode === "tabs" && visibleCategoryId) {
      return (layoutItemsByCategory[visibleCategoryId] ?? []).filter(match);
    }
    return items.filter(match);
  }, [viewMode, visibleCategoryId, layoutItemsByCategory, items, searchQuery]);

  const searchResultCount = visibleItems.length + pinnedItems.filter(matchesSearch).length;

  const needsPicker = (item: MenuItem) =>
    (modifierMap[item.id]?.length ?? 0) > 0 || (variantMap[item.id]?.length ?? 0) > 0;

  const renderItem = (item: MenuItem) => {
    if (item.soldOut) {
      return <ProductCardSoldOut key={item.id} item={item} tileClass={tileClass} />;
    }

    const vars = variantMap[item.id] ?? [];
    const picker = needsPicker(item);

    if (picker) {
      return (
        <ProductCardButton
          key={item.id}
          item={item}
          tileClass={tileClass}
          variants={vars}
          needsPicker
          onPickerOpen={() => setPickerItem(item)}
        />
      );
    }

    return (
      <ProductCardButton
        key={item.id}
        item={item}
        tileClass={tileClass}
        variants={vars}
        needsPicker={false}
        onPickerOpen={() => {}}
        form={
          <form action={addToCartAction} className="h-full w-full text-left">
            <input type="hidden" name="outletId" value={outletId} />
            <input type="hidden" name="shiftId" value={shiftId} />
            <input type="hidden" name="menuItemId" value={item.id} />
            <button type="submit" className="h-full w-full">
              <div className="flex items-center gap-2 p-3">
                <span className="block truncate font-bold text-navy-900">{item.name}</span>
                <span className="text-sm font-semibold text-gold-700">{formatRp(item.basePrice)}</span>
              </div>
            </button>
          </form>
        }
      />
    );
  };

  const hasMenuContent =
    pinnedItems.some(matchesSearch) ||
    (showPackages && packages.length > 0) ||
    tabCategories.length > 0;

  if (!hasMenuContent) {
    return (
      <EmptyState
        title="Menu kosong"
        description="Belum ada produk aktif di outlet ini. Cek Branch Menu & Layout POS di Library."
      />
    );
  }

  if (q && searchResultCount === 0) {
    return (
      <>
        <ProductSearch value={searchQuery} onChange={setSearchQuery} resultCount={0} />
        <EmptyState title="Tidak ada hasil" description={`Tidak ada menu cocok dengan "${searchQuery}".`} />
      </>
    );
  }

  return (
    <>
      <ProductSearch value={searchQuery} onChange={setSearchQuery} resultCount={q ? searchResultCount : undefined} />

      {showPackages && packages.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gold-700">Paket Menu</h2>
          <div className={`grid gap-2 ${gridColsClass}`}>
            {packages.map((pkg) => (
              <form key={pkg.id} action={addPackageToCartAction}>
                <input type="hidden" name="outletId" value={outletId} />
                <input type="hidden" name="shiftId" value={shiftId} />
                <input type="hidden" name="packageId" value={pkg.id} />
                <button type="submit" className={`${tileClass} justify-between p-3`}>
                  <span className="font-bold text-navy-900">{pkg.name}</span>
                  <span className="text-sm font-semibold text-gold-700">{formatRp(pkg.bundlePrice)}</span>
                  <span className="text-[10px] text-slate-500">{pkg.summary}</span>
                </button>
              </form>
            ))}
          </div>
        </div>
      )}

      {pinnedItems.filter(matchesSearch).length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gold-700">Favorit</h2>
          <div className={`grid gap-2 ${gridColsClass}`}>
            {pinnedItems.filter(matchesSearch).map((item) => renderItem(item))}
          </div>
        </div>
      )}

      {viewMode === "tabs" && tabCategories.length > 0 && (
        <CategoryTabs
          categories={tabCategories}
          activeId={visibleCategoryId}
          onChange={setActiveCategoryId}
          variant={variant}
        />
      )}

      {layoutCategories.map((cat) => {
        if (viewMode === "tabs" && cat.id !== visibleCategoryId) return null;
        const catItems = (layoutItemsByCategory[cat.id] ?? []).filter(matchesSearch);
        if (catItems.length === 0) return null;

        return (
          <div key={cat.id} className="mb-6">
            {viewMode === "scroll" && (
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">{cat.name}</h2>
            )}
            <div className={`grid gap-2 ${gridColsClass}`}>{catItems.map((item) => renderItem(item))}</div>
          </div>
        );
      })}

      <ModifierDialog
        item={pickerItem}
        outletId={outletId}
        shiftId={shiftId}
        modifiers={pickerItem ? modifierMap[pickerItem.id] ?? [] : []}
        variants={pickerItem ? variantMap[pickerItem.id] ?? [] : []}
        onClose={() => setPickerItem(null)}
      />
    </>
  );
}

/** Alias kompatibilitas */
export { ProductGrid as PosMenuGrid };
