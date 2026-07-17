/** BOM / resep menu → bahan inventory (Fase 7d). Qty per 1 porsi. */

export type MenuRecipeLine = {
  itemId: string;
  qty: number;
  unit: string;
};

export type MenuRecipe = {
  menuItemId: string;
  name: string;
  lines: MenuRecipeLine[];
};

export function seedMenuRecipes(): MenuRecipe[] {
  return [
    {
      menuItemId: "mi-espresso",
      name: "Espresso",
      lines: [{ itemId: "it-kopi", qty: 0.015, unit: "kg" }]
    },
    {
      menuItemId: "mi-latte",
      name: "Latte",
      lines: [
        { itemId: "it-kopi", qty: 0.018, unit: "kg" },
        { itemId: "it-susu", qty: 0.2, unit: "liter" },
        { itemId: "it-cup", qty: 0.04, unit: "pack" }
      ]
    },
    {
      menuItemId: "mi-cappuccino",
      name: "Cappuccino",
      lines: [
        { itemId: "it-kopi", qty: 0.018, unit: "kg" },
        { itemId: "it-susu", qty: 0.18, unit: "liter" },
        { itemId: "it-cup", qty: 0.04, unit: "pack" }
      ]
    },
    {
      menuItemId: "mi-v60",
      name: "V60",
      lines: [
        { itemId: "it-kopi", qty: 0.022, unit: "kg" },
        { itemId: "it-cup", qty: 0.04, unit: "pack" }
      ]
    },
    {
      menuItemId: "mi-teh-tarik",
      name: "Teh Tarik",
      lines: [
        { itemId: "it-susu", qty: 0.15, unit: "liter" },
        { itemId: "it-cup", qty: 0.04, unit: "pack" }
      ]
    },
    {
      menuItemId: "mi-matcha",
      name: "Matcha Latte",
      lines: [
        { itemId: "it-susu", qty: 0.25, unit: "liter" },
        { itemId: "it-cup", qty: 0.04, unit: "pack" }
      ]
    },
    {
      menuItemId: "mi-nasi-goreng",
      name: "Nasi Goreng KBU",
      lines: [
        { itemId: "it-beras", qty: 0.2, unit: "kg" },
        { itemId: "it-ayam", qty: 0.12, unit: "kg" },
        { itemId: "it-minyak", qty: 0.04, unit: "liter" }
      ]
    },
    {
      menuItemId: "mi-mie-goreng",
      name: "Mie Goreng",
      lines: [
        { itemId: "it-ayam", qty: 0.1, unit: "kg" },
        { itemId: "it-minyak", qty: 0.05, unit: "liter" }
      ]
    },
    {
      menuItemId: "mi-sate-ayam",
      name: "Sate Ayam",
      lines: [{ itemId: "it-ayam", qty: 0.3, unit: "kg" }]
    },
    {
      menuItemId: "mi-kentang",
      name: "Kentang Goreng",
      lines: [{ itemId: "it-minyak", qty: 0.08, unit: "liter" }]
    },
    {
      menuItemId: "mi-pisang",
      name: "Pisang Goreng",
      lines: [{ itemId: "it-minyak", qty: 0.06, unit: "liter" }]
    }
  ];
}

export function getRecipeForMenuItem(menuItemId: string, recipes: MenuRecipe[]) {
  return recipes.find((r) => r.menuItemId === menuItemId);
}
