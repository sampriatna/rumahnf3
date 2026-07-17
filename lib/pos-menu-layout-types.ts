import type { MenuCategory, MenuItem } from "./pos-kds-roadmap";

export type PosMenuLayoutViewMode = "tabs" | "scroll";
export type PosMenuLayoutColumns = 2 | 3 | 4;

export type AppliedPosMenuLayout = {
  categories: MenuCategory[];
  itemsByCategory: Record<string, MenuItem[]>;
  pinnedItems: MenuItem[];
  showPackages: boolean;
  columns: PosMenuLayoutColumns;
  viewMode: PosMenuLayoutViewMode;
};
