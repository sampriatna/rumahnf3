"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { requireAuthz, requireSession } from "@/lib/auth-guard";
import {
  recordLedger,
  payDebt,
  transferBetweenAccounts
} from "@/lib/finance-service";
import {
  KAS_MASUK_CATEGORIES,
  KAS_KELUAR_CATEGORIES,
  type AccountId
} from "@/lib/finance";
import {
  canInputFinanceAccount,
  financeAccessForSession
} from "@/lib/finance-access";
import { PHASE0_FLAGS } from "@/lib/phase0-flags";

const HANDLER = ["owner", "admin"];

export async function recordKasMasukAction(formData: FormData) {
  const session = PHASE0_FLAGS.authorizationPipeline
    ? requireAuthz({ finance: true, redirectTo: "/finance" })
    : requireSession();

  const amount = Number(formData.get("amount") ?? 0);
  const category = String(formData.get("category") ?? "Lainnya");
  const accountId = String(formData.get("accountId") ?? "bank") as AccountId;
  const note = String(formData.get("note") ?? "").trim();
  const areaUnit = String(formData.get("areaUnit") ?? "").trim() || undefined;
  const evidenceUrl = String(formData.get("evidenceUrl") ?? "").trim() || undefined;

  if (!canInputFinanceAccount(session, accountId)) redirect("/finance?error=forbidden-account");

  if (amount > 0 && KAS_MASUK_CATEGORIES.includes(category)) {
    recordLedger({
      accountId,
      transactionType: "in",
      category,
      amount,
      paymentMethod: accountId === "cash_physical" ? "Cash" : "Transfer",
      areaUnit,
      evidenceUrl,
      verificationStatus: HANDLER.includes(session.role) ? "verified" : "pending",
      verifiedBy: HANDLER.includes(session.role) ? session.name : undefined,
      note: note || undefined,
      createdBy: session.name
    });
  }

  revalidatePath("/finance");
  revalidatePath("/finance/ledger");
  revalidatePath("/dashboard");
}

export async function recordKasKeluarAction(formData: FormData) {
  const session = PHASE0_FLAGS.authorizationPipeline
    ? requireAuthz({ finance: true, redirectTo: "/finance" })
    : requireSession();

  const amount = Number(formData.get("amount") ?? 0);
  const category = String(formData.get("category") ?? "Biaya Lain");
  const accountId = String(formData.get("accountId") ?? "bank") as AccountId;
  const note = String(formData.get("note") ?? "").trim();
  const areaUnit = String(formData.get("areaUnit") ?? "").trim() || undefined;
  const evidenceUrl = String(formData.get("evidenceUrl") ?? "").trim() || undefined;

  if (!canInputFinanceAccount(session, accountId)) redirect("/finance?error=forbidden-account");

  if (amount > 0 && KAS_KELUAR_CATEGORIES.includes(category)) {
    recordLedger({
      accountId,
      transactionType: "out",
      category,
      amount,
      paymentMethod: accountId === "cash_physical" ? "Cash" : "Transfer",
      areaUnit,
      evidenceUrl,
      verificationStatus: HANDLER.includes(session.role) ? "verified" : "pending",
      verifiedBy: HANDLER.includes(session.role) ? session.name : undefined,
      note: note || undefined,
      createdBy: session.name
    });
  }

  revalidatePath("/finance");
  revalidatePath("/finance/ledger");
  revalidatePath("/dashboard");
}

export async function payDebtAction(formData: FormData) {
  const session = PHASE0_FLAGS.authorizationPipeline
    ? requireAuthz({ roles: ["owner", "admin"], redirectTo: "/finance" })
    : getSession();
  if (!session || !HANDLER.includes(session.role)) redirect("/finance");

  const debtId = String(formData.get("debtId") ?? "");
  payDebt(debtId, session.name);

  revalidatePath("/finance");
  revalidatePath("/finance/ledger");
  revalidatePath("/dashboard");
}

export async function transferKasAction(formData: FormData) {
  const session = PHASE0_FLAGS.authorizationPipeline
    ? requireAuthz({ finance: true, redirectTo: "/finance" })
    : requireSession();
  const access = financeAccessForSession(session);
  if (!access.canTransfer) redirect("/finance?error=forbidden-transfer");

  const fromAccountId = String(formData.get("fromAccountId") ?? "") as AccountId;
  const toAccountId = String(formData.get("toAccountId") ?? "") as AccountId;
  const amount = Number(formData.get("amount") ?? 0);
  const note = String(formData.get("note") ?? "").trim();
  const areaUnit = String(formData.get("areaUnit") ?? "").trim() || undefined;

  if (!fromAccountId || !toAccountId || fromAccountId === toAccountId || amount <= 0) {
    redirect("/finance?error=invalid-transfer");
  }
  if (!canInputFinanceAccount(session, fromAccountId) || !canInputFinanceAccount(session, toAccountId)) {
    redirect("/finance?error=forbidden-account");
  }

  transferBetweenAccounts({
    fromAccountId,
    toAccountId,
    amount,
    category: "Transfer Antar Dompet",
    createdBy: session.name,
    note: note || undefined,
    areaUnit
  });

  revalidatePath("/finance");
  revalidatePath("/finance/ledger");
  revalidatePath("/dashboard");
}
