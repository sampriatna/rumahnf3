/** Layout POS default per outlet F&B — urutan kategori, favorit, tampilan tab. */

export const POS_MENU_LAYOUT_SEED: Array<{

  outletId: string;

  name: string;

  columns?: 2 | 3 | 4;

  viewMode?: "tabs" | "scroll";

  showPackages?: boolean;

  categoryOrder?: string[];

  hiddenCategoryIds?: string[];

  pinnedItemIds?: string[];

}> = [

  {

    outletId: "kbu",

    name: "Default",

    columns: 3,

    viewMode: "scroll",

    showPackages: true,

    categoryOrder: ["cat-kbu-kopi", "cat-kbu-minum", "cat-kbu-makan", "cat-kbu-snack"],

    pinnedItemIds: ["mi-latte", "mi-espresso", "mi-nasi-goreng"]

  },

  {

    outletId: "kisamen",

    name: "Default",

    columns: 3,

    viewMode: "scroll",

    showPackages: true

  },

  {

    outletId: "samtaro",

    name: "Default",

    columns: 2,

    viewMode: "scroll",

    showPackages: true

  }

];

