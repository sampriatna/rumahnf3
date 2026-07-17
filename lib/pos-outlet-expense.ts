import { store, nextId } from "./store";
import type { OutletExpense } from "./pos-kds-roadmap";

export const OUTLET_EXPENSE_CATEGORIES = [
  "Bahan / Belanja",
  "Operasional",
  "Transport",
  "Utilitas",
  "Lainnya"
] as const;

export type OutletExpenseCategory = (typeof OUTLET_EXPENSE_CATEGORIES)[number];

export function listOutletExpenses(shiftId: string): OutletExpense[] {
  const shift = store().posShifts.find((s) => s.id === shiftId);
  return shift?.outletExpenses ?? [];
}

export function sumOutletExpenses(shiftId: string): number {
  return listOutletExpenses(shiftId).reduce((s, e) => s + e.amount, 0);
}

export function addOutletExpense(input: {
  shiftId: string;
  category: string;
  amount: number;
  note: string;
  createdBy: string;
}): { error?: string; expense?: OutletExpense } {
  const shift = store().posShifts.find((s) => s.id === input.shiftId);
  if (!shift || shift.status !== "open") {
    return { error: "Shift tidak aktif." };
  }
  if (input.amount <= 0) return { error: "Nominal harus lebih dari 0." };
  const category = input.category.trim();
  if (!category) return { error: "Kategori wajib dipilih." };
  if (!input.note.trim()) return { error: "Catatan wajib diisi." };

  const expense: OutletExpense = {
    id: nextId("EXP"),
    category,
    amount: input.amount,
    note: input.note.trim(),
    createdBy: input.createdBy,
    createdAt: new Date().toISOString()
  };
  if (!shift.outletExpenses) shift.outletExpenses = [];
  shift.outletExpenses.unshift(expense);
  return { expense };
}
