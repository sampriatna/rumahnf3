import type { AiInsight } from "@/lib/ai-advisor";

const TYPE_LABEL: Record<string, string> = {
  person: "Orang / Perilaku",
  system: "Sistem / Proses",
  business: "Bisnis / Margin"
};

const TYPE_COLOR: Record<string, string> = {
  person: "bg-violet-100 text-violet-800",
  system: "bg-blue-100 text-blue-800",
  business: "bg-amber-100 text-amber-800"
};

export function AiInsightPanel({ insight }: { insight: AiInsight }) {
  const time = new Date(insight.generatedAt).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short"
  });

  return (
    <div className="space-y-5">
      <p className="text-xs text-slate-400">Analisa {time} · AI advisor (bukan keputusan otomatis)</p>

      <section className="panel p-5">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Ringkasan Masalah</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-800">{insight.ringkasan}</p>
      </section>

      {insight.bukti.length > 0 && (
        <section className="panel p-5">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Bukti Data</h3>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-700">
            {insight.bukti.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </section>
      )}

      {insight.analisa.length > 0 && (
        <section className="panel p-5">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Analisa</h3>
          <div className="mt-3 space-y-2">
            {insight.analisa.map((a, i) => (
              <div key={i} className="rounded-lg bg-slate-50 p-3">
                <span
                  className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${TYPE_COLOR[a.type]}`}
                >
                  {TYPE_LABEL[a.type]}
                </span>
                <p className="mt-1 text-sm text-slate-700">{a.note}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {insight.risiko.length > 0 && (
        <section className="panel border-rose-200 p-5">
          <h3 className="text-sm font-bold uppercase tracking-wide text-rose-600">Risiko</h3>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-rose-800">
            {insight.risiko.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </section>
      )}

      {insight.rekomendasi.length > 0 && (
        <section className="panel p-5">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Rekomendasi Tindakan</h3>
          <ul className="mt-2 list-inside list-decimal space-y-1 text-sm text-slate-700">
            {insight.rekomendasi.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </section>
      )}

      {insight.prioritas.length > 0 && (
        <section className="panel border-gold-400 bg-navy-50 p-5">
          <h3 className="text-sm font-bold uppercase tracking-wide text-navy-800">Prioritas Hari Ini</h3>
          <ol className="mt-2 list-inside list-decimal space-y-1 text-sm font-semibold text-navy-900">
            {insight.prioritas.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
