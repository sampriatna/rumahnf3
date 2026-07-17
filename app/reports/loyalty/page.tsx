import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { formatRp } from "@/lib/finance";
import { getLoyaltySummary, SEGMENT_LABEL, type SegmentKey, ensureLoyaltyReady } from "@/lib/loyalty-service";
import { generateLoyaltyInsight } from "@/lib/ai-advisor";
import { generateBirthdayAction, generateWinbackAction } from "../../loyalty-actions";

const ROLES = ["owner", "admin"];

function Stat({ label, value, tone = "navy" }: { label: string; value: string; tone?: string }) {
  const toneClass =
    tone === "gold"
      ? "text-gold-700"
      : tone === "rose"
      ? "text-rose-600"
      : tone === "emerald"
      ? "text-emerald-700"
      : "text-navy-900";
  return (
    <div className="panel p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-black ${toneClass}`}>{value}</p>
    </div>
  );
}

export default async function LoyaltyReportPage({
  searchParams
}: {
  searchParams: { ok?: string };
}) {
  const session = getSession();
  if (!session) redirect("/login");
  if (!ROLES.includes(session.role)) redirect("/dashboard");

  await ensureLoyaltyReady();
  const s = getLoyaltySummary();
  const ai = generateLoyaltyInsight();

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <Link href="/dashboard" className="text-sm font-bold text-navy-700">
        ← Dashboard
      </Link>
      <header className="mt-3">
        <h1 className="text-2xl font-black text-navy-900">Report Member & Loyalty</h1>
        <p className="text-sm text-slate-600">
          Kesehatan program loyalty — apakah untung atau bocor.
        </p>
      </header>

      {searchParams.ok && (
        <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {searchParams.ok}
        </div>
      )}

      {/* AI Direktur — Loyalty */}
      <section className="mt-5 rounded-xl border border-navy-200 bg-navy-50/50 p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-navy-700">
          AI Direktur · Insight Loyalty
        </h2>
        <p className="mt-2 text-sm text-navy-900">{ai.ringkasan}</p>
        {ai.temuan.length > 0 && (
          <ul className="mt-3 space-y-1 text-xs text-slate-600">
            {ai.temuan.map((t, i) => (
              <li key={i}>• {t}</li>
            ))}
          </ul>
        )}
        {ai.rekomendasi.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-bold uppercase text-slate-500">Rekomendasi</p>
            <ul className="mt-1 space-y-1 text-xs text-emerald-800">
              {ai.rekomendasi.map((r, i) => (
                <li key={i}>→ {r}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Kampanye otomatis */}
      <section className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase text-slate-500">Kampanye otomatis:</span>
        <form action={generateBirthdayAction}>
          <button type="submit" className="btn-secondary px-4 py-2 text-xs">
            Terbitkan Voucher Ulang Tahun ({s.segmentCounts.birthday})
          </button>
        </form>
        <form action={generateWinbackAction}>
          <button type="submit" className="btn-secondary px-4 py-2 text-xs">
            Terbitkan Voucher Winback ({s.segmentCounts.inactive})
          </button>
        </form>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Member Aktif" value={String(s.activeMembers)} />
        <Stat label="Member Baru Hari Ini" value={String(s.newToday)} tone="emerald" />
        <Stat label="Repeat Customer" value={String(s.repeatCustomers)} />
        <Stat label="Poin Beredar" value={String(s.pointsOutstanding)} tone="gold" />
      </section>

      <section className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Voucher Aktif" value={String(s.activeVouchers)} />
        <Stat label="Voucher Terpakai" value={String(s.usedVouchers)} />
        <Stat
          label="Reward 10 Gratis 1"
          value={`${s.stampRewardsRedeemed}/${s.stampRewardsIssued}`}
        />
        <Stat label="Biaya Promo (non-kas)" value={formatRp(s.promoCostTotal)} tone="rose" />
      </section>

      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
        <strong>Biaya promo loyalty hari ini: {formatRp(s.promoCostToday)}</strong> · diskon poin/voucher{" "}
        {formatRp(s.discountTotal)}. Biaya item gratis tidak mengurangi kas (tidak ada uang keluar),
        tapi stok bahan tetap berkurang via inventory. Angka ini = potensi revenue yang direlakan
        untuk reward.
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section className="panel p-5">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
            Spending Tertinggi
          </h2>
          <ul className="space-y-2 text-sm">
            {s.topSpenders.map((c, i) => (
              <li key={c.id} className="flex justify-between gap-2">
                <span className="font-semibold text-navy-900">
                  {i + 1}. {c.fullName}
                </span>
                <span className="text-gold-700">{formatRp(c.totalSpending)}</span>
              </li>
            ))}
            {s.topSpenders.length === 0 && <li className="text-slate-500">Belum ada data.</li>}
          </ul>
        </section>

        <section className="panel p-5">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
            Paling Sering Beli
          </h2>
          <ul className="space-y-2 text-sm">
            {s.topFrequent.map((c, i) => (
              <li key={c.id} className="flex justify-between gap-2">
                <span className="font-semibold text-navy-900">
                  {i + 1}. {c.fullName}
                </span>
                <span className="text-slate-600">{c.totalTransactions}x</span>
              </li>
            ))}
            {s.topFrequent.length === 0 && <li className="text-slate-500">Belum ada data.</li>}
          </ul>
        </section>

        <section className="panel p-5">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
            Menu Favorit Member
          </h2>
          <ul className="space-y-2 text-sm">
            {s.favoriteMenus.map((m, i) => (
              <li key={i} className="flex justify-between gap-2">
                <span className="font-semibold text-navy-900">
                  {i + 1}. {m.name}
                </span>
                <span className="text-slate-600">{m.qty} item</span>
              </li>
            ))}
            {s.favoriteMenus.length === 0 && (
              <li className="text-slate-500">Belum ada transaksi member.</li>
            )}
          </ul>
        </section>

        <section className="panel p-5">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
            Pelanggan Lama Belum Datang (≥30 hari)
          </h2>
          <ul className="space-y-2 text-sm">
            {s.inactiveCustomers.map((c) => (
              <li key={c.id} className="flex justify-between gap-2">
                <Link href={`/members/${c.id}`} className="font-semibold text-navy-700 hover:underline">
                  {c.fullName}
                </Link>
                <span className="text-rose-600">{c.totalTransactions}x · perlu winback</span>
              </li>
            ))}
            {s.inactiveCustomers.length === 0 && (
              <li className="text-slate-500">Tidak ada pelanggan tidak aktif.</li>
            )}
          </ul>
        </section>

        <section className="panel p-5">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
            Distribusi Tier
          </h2>
          <ul className="space-y-2 text-sm">
            {s.tierDistribution.map((t) => (
              <li key={t.tier.id} className="flex items-center justify-between gap-2">
                <span className="font-semibold text-navy-900">
                  {t.tier.name}
                  {t.tier.discountPercent > 0 && (
                    <span className="ml-1 text-xs font-normal text-emerald-700">
                      — diskon {t.tier.discountPercent}% untuk member
                    </span>
                  )}
                </span>
                <span className="text-slate-600">{t.count} member</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel p-5">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
            Segmentasi Pelanggan
          </h2>
          <ul className="space-y-2 text-sm">
            {(Object.keys(s.segmentCounts) as SegmentKey[]).map((key) => (
              <li key={key} className="flex justify-between gap-2">
                <span className="font-semibold text-navy-900">{SEGMENT_LABEL[key]}</span>
                <span className="text-slate-600">{s.segmentCounts[key]} member</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-slate-400">
            Segmen ini siap dipakai untuk WA campaign di fase berikutnya (struktur data sudah ada).
          </p>
        </section>
      </div>
    </main>
  );
}
