"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { generateAiInsight } from "@/lib/ai-advisor";
import { addAiInsight } from "@/lib/store";

const AI_ROLES = ["owner", "leader", "admin"];

export async function runAiAnalysis() {
  const session = getSession();
  if (!session) redirect("/login");
  if (!AI_ROLES.includes(session.role)) redirect("/dashboard");

  const scope = session.role === "leader" ? session.outletId : undefined;
  const insight = generateAiInsight(scope);
  addAiInsight(insight);

  revalidatePath("/ai");
  revalidatePath("/reports/owner");
  revalidatePath("/dashboard");
}
