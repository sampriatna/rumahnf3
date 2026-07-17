import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { OUTLETS } from "@/lib/mock-data";
import { formatRp } from "@/lib/finance";
import { getMenuForOutlet } from "@/lib/pos-service";
import {
  getCustomer,
  listActiveVouchers,
  listTxnsForCustomer,
  getTier,
  computeSegments,
  SEGMENT_LABEL,
  ensureLoyaltyReady
} from "@/lib/loyalty-service";
import { store } from "@/lib/store";
import { createVoucherAction, adjustPointsAction } from "../../loyalty-actions";

const MEMBER_ROLES = ["owner"];
const ADMIN_ROLES = ["owner"];

const TX_LABEL: Record<string, string> = {
  earn_point: "Dapat poin",
  redeem_point: "Tukar poin",
  earn_stamp: "Dapat stamp",
  redeem_stamp: "Tukar stamp",
  voucher_issued: "Voucher terbit",
  voucher_used: "Voucher dipakai",
  point_expired: "Poin hangus",
  manual_adjustment: "Penyesuaian manual",
  reversal: "Pembatalan"
};

export default async function MemberDetailPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { ok?: string; error?: string };
}) {
  const session = getSession();
  if (!session) redirect("/login");
  if (!MEMBER_ROLES.includes(session.role)) redirect("/dashboard");

  await ensureLoyaltyReady();
  const member = getCustomer(params.id);
  if (!member) notFound();

  const isAdmin = ADMIN_ROLES.includes(session.role);
  const vouchers = listActiveVouchers(member!.id);
  const txns = listTxnsForCustomer(member!.id, 40);
  const redemptions = store().rewardRedemptions.filter((r) => r.customerId === member!.id);
  const orders = store()
    .posOrders.filter((o) => o.customerId === member!.id && o.status === "completed")
    .slice(0, 20);
  const outlet = OUTLETS.find((o) => o.id === member!.registeredOutletId);
  const menu = getMenuForOutlet(member!.registeredOutletId ?? "kbu");
  const tier = getTier(member!.tierId);
  const segments = computeSegments(member!);

  return (
    <main className="mx-auto max-w-4xl px-5 py-8">
      <Link href="/members" className="text-sm font-bold text-navy-700">
        ← Daftar Member
      </Link>

      {searchParams.ok === "voucher" && (
        <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          Voucher berhasil diterbitkan.
        </div>
      )}
      {searchParams.ok === "adjust" && (
        <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          Poin berhasil disesuaikan (tercatat di audit log).
        </div>
      )}
      {searchParams.error && (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          {searchParams.error}
        </div>
      )}

      <header className="mt-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-black text-navy-900">{member!.fullName}</h1>
          {tier && (
            <span className="rounded-full bg-navy-800 px-2.5 py-1 text-xs font-bold uppercase text-gold-300">
              {tier.name}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-600">
          {member!.phone} · {member!.memberCode}
          {outlet && ` · daftar di ${outlet.name}`}
        </p>
        {tier && tier.discountPercent > 0 && (
          <p className="mt-1 text-xs text-emerald-700">Benefit: {tier.benefitDescription}</p>
        )}
        {segments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {segments.map((seg) => (
              <span
                key={seg}
                className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600"
              >
                {SEGMENT_LABEL[seg]}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="panel p-4 text-center">
          <p className="text-xs text-slate-500">Poin</p>
          <p className="text-xl font-black text-gold-700">{member!.totalPoints}</p>
        </div>
        <div className="panel p-4 text-center">
          <p className="text-xs text-slate-500">Stamp Kopi</p>
          <p className="text-xl font-black text-navy-800">
            {member!.stamps["prog-stamp-kopi"] ?? 0}/10
          </p>
        </div>
        <div className="panel p-4 text-center">
          <p className="text-xs text-slate-500">Total Belanja</p>
          <p className="text-lg font-black text-navy-900">{formatRp(member!.totalSpending)}</p>
        </div>
        <div className="panel p-4 text-center">
          <p className="text-xs text-slate-500">Transaksi</p>
          <p className="text-xl font-black text-navy-900">{member!.totalTransactions}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section className="panel p-5">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
            Voucher Aktif ({vouchers.length})
          </h2>
          {vouchers.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada voucher aktif.</p>
          ) : (
            <ul className="space-y-2">
              {vouchers.map((v) => (
                <li key={v.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2 text-sm">
                  <span className="font-semibold text-navy-900">
                    {v.type === "free_item"
                      ? `Gratis ${v.rewardMenuName ?? "item"}`
                      : `Diskon ${formatRp(v.discountAmount ?? 0)}`}
                  </span>
                  <span className="text-xs text-slate-500">{v.code} · {v.source}</span>
                </li>
              ))}
            </ul>
          )}

          {isAdmin && (
            <form action={createVoucherAction} className="mt-4 grid gap-2 border-t border-slate-100 pt-4">
              <input type="hidden" name="customerId" value={member!.id} />
              <p className="text-xs font-bold uppercase text-slate-500">Terbitkan Voucher Manual</p>
              <select name="type" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm">
                <option value="discount_amount">Diskon nominal</option>
                <option value="free_item">Gratis item</option>
              </select>
              <input
                name="discountAmount"
                type="number"
                placeholder="Nominal diskon (untuk diskon)"
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
              />
              <select name="rewardMenuId" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm">
                <option value="">— pilih menu (untuk gratis item) —</option>
                {menu.items.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({formatRp(m.basePrice)})
                  </option>
                ))}
              </select>
              <button type="submit" className="btn-secondary py-2.5 text-sm">
                Terbitkan Voucher
              </button>
            </form>
          )}

          {isAdmin && (
            <form action={adjustPointsAction} className="mt-4 grid gap-2 border-t border-slate-100 pt-4">
              <input type="hidden" name="customerId" value={member!.id} />
              <p className="text-xs font-bold uppercase text-slate-500">
                Penyesuaian Poin Manual (audit)
              </p>
              <input
                name="delta"
                type="number"
                required
                placeholder="Jumlah poin (+/−)"
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
              />
              <input
                name="reason"
                required
                placeholder="Alasan (wajib)"
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
              />
              <button type="submit" className="btn-secondary py-2.5 text-sm">
                Sesuaikan Poin
              </button>
            </form>
          )}
        </section>

        <section className="panel p-5">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
            Riwayat Poin & Stamp
          </h2>
          {txns.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada aktivitas loyalty.</p>
          ) : (
            <ul className="max-h-80 space-y-2 overflow-y-auto text-sm">
              {txns.map((t) => (
                <li key={t.id} className="flex items-start justify-between gap-2 border-b border-slate-50 pb-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-navy-900">{TX_LABEL[t.txType] ?? t.txType}</p>
                    <p className="truncate text-xs text-slate-500">{t.description}</p>
                  </div>
                  <span
                    className={`shrink-0 text-xs font-bold ${
                      t.pointsChange + t.stampsChange >= 0 ? "text-emerald-700" : "text-rose-600"
                    }`}
                  >
                    {t.pointsChange !== 0 && `${t.pointsChange > 0 ? "+" : ""}${t.pointsChange}p`}
                    {t.stampsChange !== 0 && ` ${t.stampsChange > 0 ? "+" : ""}${t.stampsChange}s`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="panel mt-5 p-5">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
          Riwayat Transaksi ({orders.length})
        </h2>
        {orders.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada transaksi tercatat.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {orders.map((o) => (
              <li key={o.id} className="flex justify-between gap-2 border-b border-slate-50 pb-1">
                <span className="font-semibold text-navy-900">{o.orderNumber}</span>
                <span className="text-slate-600">
                  {formatRp(o.total)}
                  {(o.pointsEarned ?? 0) > 0 && ` · +${o.pointsEarned}p`}
                  {o.items.some((i) => i.isRewardItem) && " · reward"}
                </span>
              </li>
            ))}
          </ul>
        )}
        {redemptions.length > 0 && (
          <p className="mt-3 text-xs text-slate-500">
            Total promo cost reward member ini:{" "}
            <span className="font-bold text-rose-600">
              {formatRp(redemptions.reduce((s, r) => s + r.promoCost, 0))}
            </span>
          </p>
        )}
      </section>
    </main>
  );
}
