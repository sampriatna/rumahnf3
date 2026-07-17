import type { Customer, MemberDepositTxn } from "./loyalty";
import {
  findCustomerByMemberCode,
  getCustomer,
  searchCustomers,
  ensureLoyaltyReady
} from "./loyalty-service";
import { store, nextId } from "./store";

export function getMemberDepositBalance(customerId: string): number {
  const customer = getCustomer(customerId);
  return customer?.depositBalance ?? 0;
}

export function listMemberDepositTxns(customerId: string, limit = 20): MemberDepositTxn[] {
  return (store().memberDepositTxns ?? [])
    .filter((t) => t.customerId === customerId)
    .slice(0, limit);
}

export function listMembersWithDeposit(query?: string): Customer[] {
  const customers = store().customers.filter((c) => c.status === "active");
  if (!query?.trim()) {
    return customers
      .filter((c) => (c.depositBalance ?? 0) > 0)
      .sort((a, b) => (b.depositBalance ?? 0) - (a.depositBalance ?? 0))
      .slice(0, 20);
  }
  return searchCustomers(query);
}

export function resolveMemberForDeposit(input: {
  memberCode?: string;
  customerId?: string;
}): Customer | undefined {
  if (input.customerId) return getCustomer(input.customerId);
  if (input.memberCode?.trim()) return findCustomerByMemberCode(input.memberCode);
  return undefined;
}

export async function ensureMemberDepositReady() {
  await ensureLoyaltyReady();
}

function appendDepositTxn(txn: MemberDepositTxn) {
  if (!store().memberDepositTxns) store().memberDepositTxns = [];
  store().memberDepositTxns.unshift(txn);
}

export function topUpMemberDeposit(input: {
  customerId: string;
  outletId: string;
  shiftId?: string;
  amount: number;
  note?: string;
  createdBy: string;
}): { error?: string; txn?: MemberDepositTxn; balance?: number } {
  const customer = getCustomer(input.customerId);
  if (!customer || customer.status !== "active") {
    return { error: "Member tidak ditemukan atau tidak aktif." };
  }
  if (input.amount <= 0) return { error: "Nominal top-up harus lebih dari 0." };

  const prev = customer.depositBalance ?? 0;
  const next = prev + input.amount;
  customer.depositBalance = next;

  const txn: MemberDepositTxn = {
    id: nextId("MDP"),
    customerId: customer.id,
    outletId: input.outletId,
    shiftId: input.shiftId,
    type: "top_up",
    amount: input.amount,
    balanceAfter: next,
    note: input.note?.trim() || undefined,
    createdBy: input.createdBy,
    createdAt: new Date().toISOString()
  };
  appendDepositTxn(txn);
  return { txn, balance: next };
}

/** Kurangi saldo deposit (checkout / adjustment). Dipakai modul bayar menyusul. */
export function debitMemberDeposit(input: {
  customerId: string;
  outletId: string;
  amount: number;
  orderId?: string;
  shiftId?: string;
  note?: string;
  createdBy: string;
}): { error?: string; txn?: MemberDepositTxn; balance?: number } {
  const customer = getCustomer(input.customerId);
  if (!customer) return { error: "Member tidak ditemukan." };
  if (input.amount <= 0) return { error: "Nominal tidak valid." };

  const prev = customer.depositBalance ?? 0;
  if (prev < input.amount) return { error: "Saldo deposit tidak mencukupi." };

  const next = prev - input.amount;
  customer.depositBalance = next;

  const txn: MemberDepositTxn = {
    id: nextId("MDP"),
    customerId: customer.id,
    outletId: input.outletId,
    shiftId: input.shiftId,
    type: "payment",
    amount: -input.amount,
    balanceAfter: next,
    note: input.note?.trim() || undefined,
    orderId: input.orderId,
    createdBy: input.createdBy,
    createdAt: new Date().toISOString()
  };
  appendDepositTxn(txn);
  return { txn, balance: next };
}

export const DEPOSIT_TXN_LABEL: Record<MemberDepositTxn["type"], string> = {
  top_up: "Top-up",
  payment: "Bayar",
  refund: "Refund",
  adjustment: "Penyesuaian"
};
