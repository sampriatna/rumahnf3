import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { requireOpsDiagnosticsAuth } from "@/lib/api-auth";
import { PHASE0_FLAGS } from "@/lib/phase0-flags";
import { auditPersistenceMismatch } from "@/lib/persistence-mismatch";
import { auditKdsDiscrepancies } from "@/lib/kds-discrepancy";
import { auditLogSummary } from "@/lib/audit-log";
import {
  cloudLoad,
  cloudLoadLoyalty,
  cloudLoadPos,
  cloudLoadInventory,
  cloudLoadFinance,
  cloudLoadForms,
  cloudLoadReports
} from "@/lib/cloud-persist";
import { countAuthRows } from "@/lib/db/auth-repo";
import { getRlsDiagnostics, type RlsDiagnostics } from "@/lib/db/rls-repo";

export const dynamic = "force-dynamic";

// Diagnostik read-only status persistensi cloud (tanpa PII). Aman untuk dipantau.
export async function GET(req: Request) {
  if (PHASE0_FLAGS.authorizationPipeline) {
    const authz = requireOpsDiagnosticsAuth(req);
    if (!authz.ok) return authz.response;
  }

  const configured = isSupabaseConfigured();

  let appState: { exists: boolean; keys?: number } = { exists: false };
  try {
    const snap = await cloudLoad();
    appState = { exists: Boolean(snap), keys: snap ? Object.keys(snap).length : 0 };
  } catch {
    /* abaikan */
  }

  let loyaltyRelational: Record<string, number> | string = "belum ada (jalankan supabase/loyalty-app.sql)";
  try {
    const l = await cloudLoadLoyalty();
    if (l) {
      loyaltyRelational = {
        customers: l.customers.length,
        membershipTiers: l.membershipTiers.length,
        loyaltyPrograms: l.loyaltyPrograms.length,
        loyaltyTxns: l.loyaltyTxns.length,
        vouchers: l.vouchers.length,
        rewardRedemptions: l.rewardRedemptions.length
      };
    }
  } catch {
    /* abaikan */
  }

  let posRelational: Record<string, number> | string = "belum ada (jalankan supabase/pos-app.sql)";
  try {
    const p = await cloudLoadPos();
    if (p) {
      posRelational = {
        posRegisters: p.posRegisters.length,
        menuCategories: p.menuCategories.length,
        menuItems: p.menuItems.length,
        posRecipes: p.posRecipes.length,
        posShifts: p.posShifts.length,
        posOrders: p.posOrders.length,
        kdsStations: p.kdsStations.length,
        kdsTickets: p.kdsTickets.length
      };
    }
  } catch {
    /* abaikan */
  }

  let inventoryRelational: Record<string, number> | string =
    "belum ada (jalankan supabase/inventory-app.sql)";
  try {
    const inv = await cloudLoadInventory();
    if (inv) {
      inventoryRelational = {
        items: inv.items.length,
        stockLevels: Object.keys(inv.stock).length,
        stockMovements: inv.movements.length,
        suppliers: inv.suppliers.length,
        purchaseRequests: inv.purchaseRequests.length,
        purchaseOrders: inv.purchaseOrders.length,
        stockTransferRequests: inv.stockTransferRequests?.length ?? 0
      };
    }
  } catch {
    /* abaikan */
  }

  let financeRelational: Record<string, number> | string =
    "belum ada (jalankan supabase/finance-app.sql)";
  try {
    const fin = await cloudLoadFinance();
    if (fin) {
      financeRelational = {
        accountBalances: Object.keys(fin.accountBalances).length,
        ledger: fin.ledger.length,
        debts: fin.debts.length,
        receivables: fin.receivables.length,
        heldCash: fin.heldCash.length
      };
    }
  } catch {
    /* abaikan */
  }

  let formsRelational: Record<string, number> | string =
    "belum ada (jalankan supabase/forms-app.sql)";
  try {
    const f = await cloudLoadForms();
    if (f) {
      formsRelational = {
        submissions: f.submissions.length,
        approvals: f.approvals.length,
        notificationLogs: f.notificationLogs.length
      };
    }
  } catch {
    /* abaikan */
  }

  let reportsRelational: Record<string, number> | string =
    "belum ada (jalankan supabase/reports-app.sql)";
  try {
    const r = await cloudLoadReports();
    if (r) {
      reportsRelational = {
        aiInsights: r.aiInsights.length,
        customerRatings: r.customerRatings.length
      };
    }
  } catch {
    /* abaikan */
  }

  let authRelational: Record<string, number> | string =
    "belum ada (jalankan supabase/auth-app.sql lalu npm run seed:admin)";
  try {
    const a = await countAuthRows();
    if (a) authRelational = { authAccounts: a.accounts, outletCashierPins: a.cashierPins };
  } catch {
    /* abaikan */
  }

  let rls: RlsDiagnostics | string =
    "belum ada (jalankan supabase/rls-policies.sql)";
  try {
    const r = await getRlsDiagnostics();
    if (r && r.enabledTables > 0) rls = r;
  } catch {
    /* abaikan */
  }

  const persistenceMismatch = PHASE0_FLAGS.persistenceMismatchLog
    ? await auditPersistenceMismatch()
    : { enabled: false, checkedAt: new Date().toISOString() };

  const kdsDiscrepancy = auditKdsDiscrepancies();

  const auditLog = auditLogSummary();

  return NextResponse.json({
    configured,
    appState,
    loyaltyRelational,
    posRelational,
    inventoryRelational,
    financeRelational,
    formsRelational,
    reportsRelational,
    authRelational,
    rls,
    persistenceMismatch,
    kdsDiscrepancy,
    auditLog
  });
}
