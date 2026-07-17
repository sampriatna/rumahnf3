import Link from "next/link";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { getSession } from "@/lib/session";
import { OUTLETS } from "@/lib/mock-data";
import { formatRp } from "@/lib/finance";
import { listCustomers, searchCustomers, getLoyaltySummary, getTier, ensureLoyaltyReady } from "@/lib/loyalty-service";
import { createMemberAction } from "../loyalty-actions";

const MEMBER_ROLES = ["owner"];

export default async function MembersPage({
  searchParams
}: {
  searchParams: { q?: string; ok?: string; error?: string };
}) {
  const session = getSession();
  if (!session) redirect("/login");
  if (!MEMBER_ROLES.includes(session.role)) redirect("/dashboard");

  await ensureLoyaltyReady();
  const all = listCustomers();
  const list = searchParams.q ? searchCustomers(searchParams.q) : all.slice(0, 50);
  const summary = getLoyaltySummary();

  return (
    <main className="mx-auto max-w-4xl px-5 py-8">
      <Link href="/dashboard" className="text-sm font-bold text-navy-700">
        ← Dashboard
      </Link>
      <header className="mt-3 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-800 text-gold-400">
          <Users className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <h1 className="text-2xl font-black text-navy-900">Member & Loyalty</h1>
          <p className="text-sm text-slate-600">
            {summary.totalMembers} member · {summary.pointsOutstanding} poin beredar ·{" "}
            {summary.activeVouchers} voucher aktif
          </p>
        </div>
      </header>

      {searchParams.ok === "created" && (
        <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          Member baru berhasil dibuat.
        </div>
      )}
      {searchParams.error && (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          {searchParams.error}
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <form method="get" className="mb-4 flex gap-2">
            <input
              name="q"
              defaultValue={searchParams.q ?? ""}
              placeholder="Cari HP / nama / kode member"
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
            />
            <button type="submit" className="btn-secondary px-4 text-sm">
              Cari
            </button>
          </form>

          <div className="panel divide-y divide-slate-100">
            {list.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-slate-500">Belum ada member.</p>
            )}
            {list.map((c) => (
              <Link
                key={c.id}
                href={`/members/${c.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 truncate font-bold text-navy-900">
                    {c.fullName}
                    {getTier(c.tierId) && (
                      <span className="rounded-full bg-navy-800 px-2 py-0.5 text-[10px] font-bold uppercase text-gold-300">
                        {getTier(c.tierId)!.name}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">
                    {c.phone} · {c.memberCode}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-bold text-gold-700">{c.totalPoints} poin</p>
                  <p className="text-xs text-slate-500">{formatRp(c.totalSpending)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <aside>
          <div className="panel p-5">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
              Daftar Member Baru
            </h2>
            <form action={createMemberAction} className="grid gap-2">
              <input
                name="fullName"
                required
                placeholder="Nama lengkap"
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
              />
              <input
                name="phone"
                required
                placeholder="Nomor HP (unik)"
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
              />
              <input
                name="birthDate"
                type="date"
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
              />
              {(session.role === "owner" || session.role === "admin") && (
                <select
                  name="outletId"
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
                >
                  {OUTLETS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              )}
              <button type="submit" className="btn-primary py-2.5 text-sm">
                Simpan Member
              </button>
            </form>
          </div>

          {(session.role === "owner" || session.role === "admin") && (
            <Link href="/reports/loyalty" className="btn-secondary mt-3 block w-full py-3 text-center text-sm">
              Lihat Report Loyalty →
            </Link>
          )}
        </aside>
      </div>
    </main>
  );
}
