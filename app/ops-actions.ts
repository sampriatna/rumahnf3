"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { runQuietHourCheck } from "@/lib/ops-quiet-hour";
import {
  analyzeMenuPromo,
  formatMenuPromoWa,
  leaderPhone
} from "@/lib/ops-menu-promo";
import { sendWaNotification } from "@/lib/wa";
import { addNotificationLog } from "@/lib/store";
import { ensureTrafficHistorySeeded } from "@/lib/ops-quiet-hour";

const ROLES = ["leader", "admin", "owner"];

export async function checkQuietHourAction(formData: FormData) {
  const session = getSession();
  if (!session || !ROLES.includes(session.role)) redirect("/dashboard");

  const force = String(formData.get("force") ?? "") === "on";
  const outletId =
    session.role === "leader"
      ? session.outletId
      : String(formData.get("outletId") ?? "") || undefined;

  const result = await runQuietHourCheck({
    outletId: outletId ?? undefined,
    force,
    sendWa: true
  });

  const quiet = result.statuses.filter((s) => s.isQuiet);
  const sent = result.alerts.length;

  revalidatePath("/reports/outlet");
  revalidatePath("/reports/owner");

  if (quiet.length === 0) {
    redirect("/reports/outlet?ok=not-quiet");
  }
  redirect(`/reports/outlet?ok=quiet-alert&sent=${sent}`);
}

export async function sendMenuPromoWaAction(formData: FormData) {
  const session = getSession();
  if (!session || !ROLES.includes(session.role)) redirect("/dashboard");

  const outletId =
    session.role === "leader"
      ? session.outletId
      : String(formData.get("outletId") ?? "") || undefined;

  if (!outletId) redirect("/reports/outlet?error=no-outlet");

  ensureTrafficHistorySeeded();
  const report = analyzeMenuPromo(outletId);
  if (!report || report.insights.length === 0) {
    redirect("/reports/outlet?ok=no-menu-data");
  }

  const log = await sendWaNotification({
    event: "menu_promo",
    target: "leader",
    phone: leaderPhone(outletId),
    outletId,
    message: formatMenuPromoWa(report)
  });
  addNotificationLog(log);

  revalidatePath("/reports/outlet");
  redirect(`/reports/outlet?ok=menu-promo&status=${log.status}`);
}
