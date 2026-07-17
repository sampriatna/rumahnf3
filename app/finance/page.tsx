import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { PageHeader } from "@/components/PageHeader";
import {
  getFinanceSummary,
  listDebts,
  listReceivables,
  listHeldCash,
  getAccountBalances,
  ACCOUNTS,
  listLedger
} from "@/lib/finance-service";
import { formatRp, KAS_MASUK_CATEGORIES, KAS_KELUAR_CATEGORIES } from "@/lib/finance";
import { getLoyaltySummary, ensureLoyaltyReady } from "@/lib/loyalty-service";
import {
  recordKasMasukAction,
  recordKasKeluarAction,
  payDebtAction,
  transferKasAction
} from "../finance-actions";
import { financeAccessForSession } from "@/lib/finance-access";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { dateStyle: "medium" });
}

export default async function FinancePage() {
  const session = getSession();
  if (!session) redirect("/login");
  const access = financeAccessForSession(session);
  if (!access.canOpenFinance) redirect("/dashboard");

  await ensureLoyaltyReady();
  const isGlobalFinance = session.isSuperAdmin === true || session.role === "owner" || session.role === "admin";
  const balances = getAccountBalances();
  const scopedBalances = Object.fromEntries(
    Object.entries(balances).filter(([id]) =>
      access.viewAccounts.includes(id as keyof typeof ACCOUNTS)
    )
  ) as typeof balances;
  const scopedLedger = listLedger(500).filter((e) => access.viewAccounts.includes(e.accountId));
  const summary = isGlobalFinance
    ? getFinanceSummary()
    : {
        kasTersedia: Object.values(scopedBalances).reduce((sum, v) => sum + (v ?? 0), 0),
        kasMasukHariIni: scopedLedger
          .filter((e) => e.transactionType === "in" && e.createdAt.slice(0, 10) === new Date().toISOString().slice(0, 10))
          .reduce((sum, e) => sum + e.amount, 0),
        kasKeluarHariIni: scopedLedger
          .filter((e) => e.transactionType === "out" && e.createdAt.slice(0, 10) === new Date().toISOString().slice(0, 10))
          .reduce((sum, e) => sum + e.amount, 0),
        kasTertahan: 0,
        piutang: 0,
        utangJatuhTempo: 0,
        kebutuhanWajib7Hari: 0,
        freeCash: Object.values(scopedBalances).reduce((sum, v) => sum + (v ?? 0), 0),
        totalUangBisnis: Object.values(scopedBalances).reduce((sum, v) => sum + (v ?? 0), 0)
      };
  const debts = isGlobalFinance ? listDebts().filter((d) => d.status !== "paid") : [];
  const receivables = isGlobalFinance ? listReceivables().filter((r) => r.status === "unpaid") : [];
  const held = isGlobalFinance ? listHeldCash() : [];
  const loyalty = getLoyaltySummary();

  const isOwner = session.role === "owner";

  const primaryKas = [
    {
      label: "Kas Tersedia",
      value: formatRp(summary.kasTersedia),
      hint: "Cash fisik + bank"
    },
    {
      label: "Free Cash",
      value: formatRp(summary.freeCash),
      hint:
        summary.utangJatuhTempo > 0
          ? `Setelah utang 7 hari (${formatRp(summary.utangJatuhTempo)})`
          : "Setelah utang wajib 7 hari"
    },
    {
      label: "Kas Masuk Hari Ini",
      value: formatRp(summary.kasMasukHariIni),
      hint: summary.kasMasukHariIni > 0 ? "Dari ledger hari ini" : "Belum ada setoran"
    },
    {
      label: "Kas Keluar Hari Ini",
      value: formatRp(summary.kasKeluarHariIni),
      hint: summary.kasKeluarHariIni > 0 ? "Dari ledger hari ini" : "Belum ada pengeluaran"
    }
  ];

  const secondaryMetrics = [
    { label: "Total Uang Bisnis", value: formatRp(summary.totalUangBisnis) },
    { label: "Kas Tertahan", value: formatRp(summary.kasTertahan), hint: "QRIS & online belum cair" },
    { label: "Piutang", value: formatRp(summary.piutang) },
    { label: "Utang Jatuh Tempo (7 hari)", value: formatRp(summary.utangJatuhTempo) },
    { label: "Kebutuhan Wajib 7 Hari", value: formatRp(summary.kebutuhanWajib7Hari) }
  ];

  return (
    <main className="mx-auto max-w-4xl px-5 py-8">
      <PageHeader
        title={isOwner ? "Kas Hari Ini" : "Keuangan & Kas"}
        subtitle="Kas tersedia, free cash, utang, piutang, dan kas tertahan."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Keuangan" }
        ]}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <Link href="/finance/ledger" className="btn-secondary text-sm">
          Buku Kas / Ledger
        </Link>
        <Link href="/reports/loyalty" className="btn-secondary text-sm">
          Report Loyalty
        </Link>
      </div>

      <section className="mb-8">
        <h2 className="dashboard-section-title">Ringkasan Kas</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {primaryKas.map((w, i) => (
            <div
              key={w.label}
              className={`panel p-4 ${i < 2 ? "border-gold-400/60 bg-gold-50/40" : ""}`}
            >
              <p className="text-xs font-semibold text-slate-500">{w.label}</p>
              <p className="mt-1 text-xl font-black text-navy-900 lg:text-2xl">{w.value}</p>
              <p className="mt-1 text-[10px] text-slate-400">{w.hint}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="dashboard-section-title">Posisi Keuangan</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {secondaryMetrics.map((w) => (
            <div key={w.label} className="panel p-4">
              <p className="text-xs font-semibold text-slate-500">{w.label}</p>
              <p className="mt-1 text-lg font-black text-navy-900">{w.value}</p>
              {w.hint && <p className="mt-1 text-[10px] text-slate-400">{w.hint}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="dashboard-section-title">Saldo per Akun</h2>
        <div className="panel mt-4 divide-y divide-slate-100">
          {(Object.keys(ACCOUNTS) as Array<keyof typeof ACCOUNTS>).map((id) =>
            access.viewAccounts.includes(id) ? (
              <div key={id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-slate-700">{ACCOUNTS[id].label}</span>
                <span className="font-bold text-navy-900">{formatRp(scopedBalances[id] ?? 0)}</span>
              </div>
            ) : null
          )}
        </div>
      </section>

      {access.canTransfer && (
        <section className="mb-8 panel p-5">
          <h2 className="mb-4 text-sm font-bold text-navy-900">Transfer Antar Dompet</h2>
          <form action={transferKasAction} className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-slate-500">Dari Dompet</label>
              <select name="fromAccountId" className="nf3-select mt-1" required>
                {access.inputAccounts.map((id) => (
                  <option key={id} value={id}>
                    {ACCOUNTS[id].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500">Ke Dompet</label>
              <select name="toAccountId" className="nf3-select mt-1" required>
                {access.inputAccounts.map((id) => (
                  <option key={id} value={id}>
                    {ACCOUNTS[id].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500">Nominal (Rp)</label>
              <input name="amount" type="number" required min={1} className="nf3-input mt-1" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500">Unit/Area</label>
              <input
                name="areaUnit"
                defaultValue={access.areaUnit ?? ""}
                placeholder="Contoh: Jagasatru"
                className="nf3-input mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-500">Catatan</label>
              <input name="note" className="nf3-input mt-1" placeholder="Opsional" />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="btn-secondary">
                Simpan Transfer
              </button>
            </div>
          </form>
        </section>
      )}

      {held.length > 0 && (
        <section className="mb-8">
          <h2 className="dashboard-section-title">Kas Tertahan (Menunggu Cair)</h2>
          <div className="mt-4 grid gap-2">
            {held.map((h) => (
              <div key={h.id} className="panel flex items-center justify-between p-4 text-sm">
                <div>
                  <p className="font-semibold text-navy-900">{h.source}</p>
                  <p className="text-xs text-slate-400">
                    Estimasi cair: {h.expectedReleaseDate ? formatDate(h.expectedReleaseDate) : "—"}
                  </p>
                </div>
                <p className="font-bold text-amber-700">{formatRp(h.amount)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {debts.length > 0 && (
        <section className="mb-8">
          <h2 className="dashboard-section-title">Utang Belum Lunas</h2>
          <div className="mt-4 grid gap-3">
            {debts.map((d) => (
              <div key={d.id} className="panel p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-navy-900">{d.party}</p>
                    <p className="text-xs text-slate-400">
                      {d.type} · Jatuh tempo {formatDate(d.dueDate)}
                    </p>
                    {d.note && <p className="mt-1 text-sm text-slate-600">{d.note}</p>}
                  </div>
                  <p className="font-bold text-rose-700">{formatRp(d.amount)}</p>
                </div>
                <form action={payDebtAction} className="mt-3 border-t border-slate-100 pt-3">
                  <input type="hidden" name="debtId" value={d.id} />
                  <button type="submit" className="btn-primary px-3 py-2 text-xs">
                    Bayar dari Bank
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}

      {receivables.length > 0 && (
        <section className="mb-8">
          <h2 className="dashboard-section-title">Piutang</h2>
          <div className="mt-4 grid gap-2">
            {receivables.map((r) => (
              <div key={r.id} className="panel flex items-center justify-between p-4 text-sm">
                <div>
                  <p className="font-semibold text-navy-900">{r.party}</p>
                  <p className="text-xs text-slate-400">Jatuh tempo {formatDate(r.dueDate)}</p>
                </div>
                <p className="font-bold text-emerald-700">{formatRp(r.amount)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mb-8 grid gap-6 sm:grid-cols-2">
        <div className="panel p-5">
          <h2 className="mb-4 text-sm font-bold text-navy-900">Catat Kas Masuk</h2>
          <form action={recordKasMasukAction} className="grid gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500">Nominal (Rp)</label>
              <input
                name="amount"
                type="number"
                required
                min={1}
                className="nf3-input mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500">Kategori</label>
              <select name="category" className="nf3-select mt-1">
                {KAS_MASUK_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500">Masuk ke Akun</label>
              <select name="accountId" className="nf3-select mt-1">
                {access.inputAccounts.map((id) => (
                  <option key={id} value={id}>
                    {ACCOUNTS[id].label}
                  </option>
                ))}
              </select>
            </div>
            <input type="hidden" name="areaUnit" value={access.areaUnit ?? ""} />
            <div>
              <label className="text-xs font-bold text-slate-500">Catatan</label>
              <input
                name="note"
                type="text"
                className="nf3-input mt-1"
                placeholder="Opsional"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500">Bukti (URL foto nota)</label>
              <input name="evidenceUrl" type="url" className="nf3-input mt-1" placeholder="https://..." />
            </div>
            <button type="submit" className="btn-primary">
              Simpan Kas Masuk
            </button>
          </form>
        </div>

        <div className="panel p-5">
          <h2 className="mb-4 text-sm font-bold text-navy-900">Catat Kas Keluar</h2>
          <form action={recordKasKeluarAction} className="grid gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500">Nominal (Rp)</label>
              <input
                name="amount"
                type="number"
                required
                min={1}
                className="nf3-input mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500">Kategori</label>
              <select name="category" className="nf3-select mt-1">
                {KAS_KELUAR_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500">Keluar dari Akun</label>
              <select name="accountId" className="nf3-select mt-1">
                {access.inputAccounts.map((id) => (
                  <option key={id} value={id}>
                    {ACCOUNTS[id].label}
                  </option>
                ))}
              </select>
            </div>
            <input type="hidden" name="areaUnit" value={access.areaUnit ?? ""} />
            <div>
              <label className="text-xs font-bold text-slate-500">Catatan</label>
              <input
                name="note"
                type="text"
                className="nf3-input mt-1"
                placeholder="Opsional"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500">Bukti (URL foto nota)</label>
              <input name="evidenceUrl" type="url" className="nf3-input mt-1" placeholder="https://..." />
            </div>
            <button type="submit" className="btn-secondary">
              Simpan Kas Keluar
            </button>
          </form>
        </div>
      </section>

      <section className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
          Biaya Promo Loyalty (non-kas)
        </p>
        <p className="mt-1 text-lg font-black text-rose-700">
          {formatRp(loyalty.promoCostToday)}{" "}
          <span className="text-sm font-semibold text-slate-500">hari ini</span>
          <span className="ml-3 text-sm font-semibold text-slate-600">
            · total {formatRp(loyalty.promoCostTotal)}
          </span>
        </p>
        <p className="mt-1 text-[11px] text-slate-500">
          Item gratis & diskon member. Tidak mengurangi kas, tapi stok bahan tetap berkurang via
          inventory.
        </p>
      </section>
    </main>
  );
}
