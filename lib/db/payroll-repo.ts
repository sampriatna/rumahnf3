import { supabaseAdmin, isSupabaseConfigured } from "../supabase";
import type { Payslip, PayslipLine } from "../payroll";

export type PayrollSnapshot = {
  payslips: Payslip[];
};

const payslipRow = (p: Payslip) => ({
  id: p.id,
  user_id: p.userId,
  user_name: p.userName,
  outlet_id: p.outletId ?? null,
  outlet_name: p.outletName ?? null,
  period_label: p.periodLabel,
  period_start: p.periodStart,
  period_end: p.periodEnd,
  status: p.status,
  published_at: p.publishedAt ?? null,
  note: p.note ?? null
});

const lineRow = (payslipId: string, line: PayslipLine, sortOrder: number) => ({
  id: `${payslipId}-line-${sortOrder}`,
  payslip_id: payslipId,
  label: line.label,
  amount: line.amount,
  line_type: line.type,
  sort_order: sortOrder
});

const toPayslip = (row: any, lines: PayslipLine[]): Payslip => ({
  id: row.id,
  userId: row.user_id,
  userName: row.user_name,
  outletId: row.outlet_id ?? undefined,
  outletName: row.outlet_name ?? undefined,
  periodLabel: row.period_label,
  periodStart: row.period_start,
  periodEnd: row.period_end,
  status: row.status,
  publishedAt: row.published_at ?? undefined,
  note: row.note ?? undefined,
  lines
});

/** Tulis slip gaji ke Supabase (upsert). */
export async function pushPayroll(snap: PayrollSnapshot): Promise<void> {
  if (!snap.payslips.length) return;
  try {
    const db = supabaseAdmin();
    await db.from("payroll_payslips").upsert(snap.payslips.map(payslipRow) as never[], {
      onConflict: "id"
    });
    const lineRows = snap.payslips.flatMap((p) =>
      p.lines.map((line, idx) => lineRow(p.id, line, idx))
    );
    if (lineRows.length) {
      await db.from("payroll_payslip_lines").upsert(lineRows as never[], { onConflict: "id" });
    }
  } catch {
    /* relasional opsional */
  }
}

/** Baca slip gaji dari Supabase. null bila kosong / belum migrasi. */
export async function pullPayroll(): Promise<PayrollSnapshot | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const db = supabaseAdmin();
    const { data: payslips, error } = await db
      .from("payroll_payslips")
      .select(
        "id,user_id,user_name,outlet_id,outlet_name,period_label,period_start,period_end,status,published_at,note"
      )
      .order("period_start", { ascending: false });
    if (error || !payslips?.length) return null;

    const { data: lines } = await db
      .from("payroll_payslip_lines")
      .select("id,payslip_id,label,amount,line_type,sort_order")
      .order("sort_order", { ascending: true });

    const linesByPayslip = new Map<string, PayslipLine[]>();
    for (const row of lines ?? []) {
      const list = linesByPayslip.get(row.payslip_id) ?? [];
      list.push({
        label: row.label,
        amount: Number(row.amount),
        type: row.line_type
      });
      linesByPayslip.set(row.payslip_id, list);
    }

    return {
      payslips: payslips.map((row) => toPayslip(row, linesByPayslip.get(row.id) ?? []))
    };
  } catch {
    return null;
  }
}
