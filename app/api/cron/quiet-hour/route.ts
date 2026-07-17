import { NextResponse } from "next/server";
import { runQuietHourCheck } from "@/lib/ops-quiet-hour";
import { verifyCronAuth } from "@/lib/prod-readiness";
import { recordCronRun } from "@/lib/store";

/** Cron Vercel: cek jam sepi per outlet, bandingkan vs hari yang sama (Senin≠Sabtu). */
export async function GET(req: Request) {
  const auth = verifyCronAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const result = await runQuietHourCheck({ sendWa: true });
    const detail = `${result.alerts.length} alert · ${result.statuses.filter((s) => s.isQuiet).length} outlet sepi`;
    recordCronRun({
      job: "quiet-hour",
      at: result.checkedAt,
      ok: true,
      detail
    });
    return NextResponse.json({
      ok: true,
      checkedAt: result.checkedAt,
      alertsSent: result.alerts.length,
      quietOutlets: result.statuses.filter((s) => s.isQuiet).map((s) => s.outletId)
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    recordCronRun({ job: "quiet-hour", at: new Date().toISOString(), ok: false, detail: msg });
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
