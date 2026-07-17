import { NextResponse } from "next/server";
import { assessProdReadiness } from "@/lib/prod-readiness";
import { recentCronRuns } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Health check publik untuk uptime monitor / Vercel. Tanpa auth, tanpa PII. */
export async function GET() {
  const report = assessProdReadiness();
  const lastQuietHour = recentCronRuns("quiet-hour", 1)[0];

  return NextResponse.json(
    {
      ok: report.ready || !report.isProduction,
      service: "rumah-nf3",
      version: process.env.npm_package_version ?? "0.1.0",
      environment: report.environment,
      productionReady: report.ready,
      checks: Object.fromEntries(report.checks.map((c) => [c.id, c.ok])),
      cron: {
        quietHour: lastQuietHour
          ? { at: lastQuietHour.at, ok: lastQuietHour.ok, detail: lastQuietHour.detail }
          : null
      }
    },
    { status: report.isProduction && !report.ready ? 503 : 200 }
  );
}
