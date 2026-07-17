import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { PageHeader } from "@/components/PageHeader";
import { listLedger, getAccountBalances } from "@/lib/finance-service";
import { coaAccountLabel } from "@/lib/coa-service";
import { formatRp, ACCOUNTS } from "@/lib/finance";
import { financeAccessForSession } from "@/lib/finance-access";

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

function toStatusLabel(status?: string) {
  return status === "pending" ? "Belum Verifikasi" : "Terverifikasi";
}

export default function LedgerPage({
  searchParams
}: {
  searchParams?: {
    wallet?: string;
    area?: string;
    user?: string;
    category?: string;
    status?: string;
    from?: string;
    to?: string;
  };
}) {
  const session = getSession();
  if (!session) redirect("/login");
  const access = financeAccessForSession(session);
  if (!access.canOpenFinance) redirect("/dashboard");

  const entries = listLedger(300).filter((e) => access.viewAccounts.includes(e.accountId));
  const balances = getAccountBalances();
  const filtered = entries.filter((e) => {
    if (searchParams?.wallet && e.accountId !== searchParams.wallet) return false;
    if (searchParams?.area && (e.areaUnit ?? "") !== searchParams.area) return false;
    if (searchParams?.user && !e.createdBy.toLowerCase().includes(searchParams.user.toLowerCase())) return false;
    if (searchParams?.category && !e.category.toLowerCase().includes(searchParams.category.toLowerCase())) return false;
    if (searchParams?.status && (e.verificationStatus ?? "verified") !== searchParams.status) return false;
    if (searchParams?.from && e.createdAt.slice(0, 10) < searchParams.from) return false;
    if (searchParams?.to && e.createdAt.slice(0, 10) > searchParams.to) return false;
    return true;
  });
  const selectedWallet = (searchParams?.wallet ?? "") as keyof typeof ACCOUNTS | "";
  const jagasatruReportMode = selectedWallet === "jagasatru_wallet";
  const rangeScoped = filtered;
  const netRange = rangeScoped.reduce(
    (sum, e) => sum + (e.transactionType === "in" ? e.amount : -e.amount),
    0
  );
  const closingBalance = selectedWallet ? (balances[selectedWallet] ?? 0) : 0;
  const openingBalance = selectedWallet ? closingBalance - netRange : 0;
  const incomingTransfer = rangeScoped
    .filter((e) => e.transactionType === "in" && e.category === "Transfer Antar Dompet")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalPurchases = rangeScoped
    .filter(
      (e) =>
        e.transactionType === "out" &&
        (e.category.toLowerCase().includes("supplier") || e.category.toLowerCase().includes("belanja"))
    )
    .reduce((sum, e) => sum + e.amount, 0);
  const totalRefund = rangeScoped
    .filter(
      (e) =>
        e.transactionType === "in" &&
        (e.category.toLowerCase().includes("refund") || (e.note ?? "").toLowerCase().includes("refund"))
    )
    .reduce((sum, e) => sum + e.amount, 0);
  const unverifiedCount = rangeScoped.filter((e) => e.verificationStatus === "pending").length;
  const withoutEvidenceCount = rangeScoped.filter((e) => !(e.evidenceUrl ?? "").trim()).length;
  const inputUsers = Array.from(new Set(rangeScoped.map((e) => e.createdBy)));

  return (
    <main className="mx-auto max-w-4xl px-5 py-8">
      <PageHeader title="Buku Kas" subtitle="Ledger append-only — semua transaksi kas tercatat." />

      <div className="mb-4">
        <Link href="/finance" className="btn-secondary text-sm">
          Kembali ke Ringkasan Kas
        </Link>
      </div>

      <form className="panel mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="nf3-field-label">Dompet</label>
          <select name="wallet" defaultValue={searchParams?.wallet ?? ""} className="nf3-select mt-1">
            <option value="">Semua dompet</option>
            {access.viewAccounts.map((id) => (
              <option key={id} value={id}>
                {ACCOUNTS[id].label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="nf3-field-label">Unit/Area</label>
          <input name="area" defaultValue={searchParams?.area ?? ""} className="nf3-input mt-1" />
        </div>
        <div>
          <label className="nf3-field-label">User Pembuat</label>
          <input name="user" defaultValue={searchParams?.user ?? ""} className="nf3-input mt-1" />
        </div>
        <div>
          <label className="nf3-field-label">Kategori</label>
          <input name="category" defaultValue={searchParams?.category ?? ""} className="nf3-input mt-1" />
        </div>
        <div>
          <label className="nf3-field-label">Status Verifikasi</label>
          <select name="status" defaultValue={searchParams?.status ?? ""} className="nf3-select mt-1">
            <option value="">Semua status</option>
            <option value="verified">Terverifikasi</option>
            <option value="pending">Belum verifikasi</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="nf3-field-label">Dari</label>
            <input name="from" type="date" defaultValue={searchParams?.from ?? ""} className="nf3-input mt-1" />
          </div>
          <div>
            <label className="nf3-field-label">Sampai</label>
            <input name="to" type="date" defaultValue={searchParams?.to ?? ""} className="nf3-input mt-1" />
          </div>
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <button type="submit" className="btn-secondary text-sm">
            Terapkan Filter
          </button>
        </div>
      </form>

      {jagasatruReportMode && (
        <section className="panel mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs font-semibold text-slate-500">Saldo Awal</p>
            <p className="text-lg font-black text-navy-900">{formatRp(openingBalance)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Dana Masuk dari Kas Besar</p>
            <p className="text-lg font-black text-emerald-700">{formatRp(incomingTransfer)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Pembelian</p>
            <p className="text-lg font-black text-rose-700">{formatRp(totalPurchases)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Refund / Pengembalian</p>
            <p className="text-lg font-black text-emerald-700">{formatRp(totalRefund)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Saldo Akhir</p>
            <p className="text-lg font-black text-navy-900">{formatRp(closingBalance)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Transaksi Belum Verifikasi</p>
            <p className="text-lg font-black text-amber-700">{unverifiedCount}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Transaksi Tanpa Bukti</p>
            <p className="text-lg font-black text-amber-700">{withoutEvidenceCount}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">User Input</p>
            <p className="text-sm font-semibold text-slate-700">{inputUsers.join(", ") || "-"}</p>
          </div>
        </section>
      )}

      {filtered.length === 0 ? (
        <div className="panel p-8 text-center text-sm text-slate-500">
          Belum ada transaksi. Setoran kasir yang disetujui atau kas manual akan muncul di sini.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="panel w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase text-slate-500">
                <th className="p-3">Waktu</th>
                <th className="p-3">Tipe</th>
                <th className="p-3">Kategori</th>
                <th className="p-3">Akun</th>
                <th className="p-3">Unit</th>
                <th className="p-3">Outlet</th>
                <th className="p-3 text-right">Nominal</th>
                <th className="p-3">Verifikasi</th>
                <th className="p-3">Oleh</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="border-b border-slate-50">
                  <td className="p-3 text-xs text-slate-500">{formatTime(e.createdAt)}</td>
                  <td className="p-3">
                    <span
                      className={
                        e.transactionType === "in"
                          ? "font-bold text-emerald-700"
                          : "font-bold text-rose-700"
                      }
                    >
                      {e.transactionType === "in" ? "Masuk" : "Keluar"}
                    </span>
                  </td>
                  <td className="p-3">{e.category}</td>
                  <td className="p-3 text-xs">{coaAccountLabel(e.accountId)}</td>
                  <td className="p-3 text-xs text-slate-600">{e.areaUnit ?? "-"}</td>
                  <td className="p-3 text-xs text-slate-500">{e.outletName ?? "—"}</td>
                  <td className="p-3 text-right font-semibold">
                    {e.transactionType === "in" ? "+" : "−"}
                    {formatRp(e.amount)}
                  </td>
                  <td className="p-3 text-xs text-slate-600">{toStatusLabel(e.verificationStatus)}</td>
                  <td className="p-3 text-xs text-slate-500">{e.createdBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
