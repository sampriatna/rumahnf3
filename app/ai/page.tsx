import { redirect } from "next/navigation";
import { Brain } from "lucide-react";
import { getSession } from "@/lib/session";
import { getLatestAiInsight, listAiInsights } from "@/lib/store";
import { aiDataSnapshot } from "@/lib/ai-advisor";
import { PageHeader } from "@/components/PageHeader";
import { AiInsightPanel } from "@/components/AiInsightPanel";
import { runAiAnalysis } from "../ai-actions";

export default function AiDirekturPage() {
  const session = getSession();
  if (!session) redirect("/login");
  if (!["owner", "leader", "admin"].includes(session.role)) redirect("/dashboard");

  const scope = session.role === "leader" ? session.outletId : undefined;
  const latest = getLatestAiInsight();
  const history = listAiInsights(3);
  const snapshot = aiDataSnapshot(scope);

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <PageHeader
        title="AI Direktur"
        subtitle="Advisor operasional — baca data form, approval, waste, kendala. Keputusan tetap manusia."
      />

      <div className="panel mb-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-navy-800 text-gold-400">
            <Brain className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <p className="font-bold text-navy-900">Analisa Hari Ini</p>
            <p className="text-xs text-slate-500">
              Membaca {snapshot.totals.submissionsToday} form hari ini, {snapshot.totals.stuckCount}{" "}
              request macet, {snapshot.totals.pendingApprovals} approval pending.
            </p>
          </div>
        </div>
        <form action={runAiAnalysis}>
          <button type="submit" className="btn-primary whitespace-nowrap">
            Analisa Hari Ini
          </button>
        </form>
      </div>

      {latest ? (
        <AiInsightPanel insight={latest} />
      ) : (
        <div className="panel p-10 text-center text-sm text-slate-500">
          Belum ada analisa. Klik &quot;Analisa Hari Ini&quot; setelah ada data form/approval.
        </div>
      )}

      {history.length > 1 && (
        <section className="mt-10">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
            Riwayat Analisa
          </h2>
          <div className="grid gap-2">
            {history.slice(1).map((h) => (
              <div key={h.id} className="panel p-3 text-xs text-slate-600">
                {new Date(h.generatedAt).toLocaleString("id-ID")} — {h.ringkasan.slice(0, 120)}…
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
