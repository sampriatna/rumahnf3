/** Jadwal harga default — happy hour per outlet. */
export const PRICE_SCHEDULE_SEED: Array<{
  outletId: string;
  name: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  adjustType: "fixed_price" | "percent_off";
  value: number;
  targetMenuItemIds?: string[];
  targetCategoryIds?: string[];
}> = [
  {
    outletId: "kbu",
    name: "Happy Hour Kopi",
    daysOfWeek: [1, 2, 3, 4, 5],
    startTime: "15:00",
    endTime: "17:00",
    adjustType: "percent_off",
    value: 15,
    targetCategoryIds: ["cat-kbu-kopi", "cat-kbu-minum"]
  },
  {
    outletId: "kbu",
    name: "Late Night Snack",
    daysOfWeek: [5, 6],
    startTime: "20:00",
    endTime: "22:00",
    adjustType: "percent_off",
    value: 10,
    targetCategoryIds: ["cat-kbu-snack"]
  },
  {
    outletId: "kisamen",
    name: "Happy Hour",
    daysOfWeek: [1, 2, 3, 4, 5],
    startTime: "14:00",
    endTime: "16:00",
    adjustType: "percent_off",
    value: 12,
    targetCategoryIds: ["cat-kbu-kopi", "cat-kbu-minum"]
  }
];
