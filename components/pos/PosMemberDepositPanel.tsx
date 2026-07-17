import Link from "next/link";
import { Users } from "lucide-react";
import type { Customer, MemberDepositTxn } from "@/lib/loyalty";
import { DEPOSIT_TXN_LABEL } from "@/lib/pos-member-deposit";
import { formatRp } from "@/lib/finance";
import { PosMemberDepositSearch, PosMemberDepositMemberList } from "./PosMemberDepositSearch";
import { PosMemberDepositTopUpForm } from "./PosMemberDepositTopUpForm";

export function PosMemberDepositPanel({
  outletId,
  shiftId,
  members,
  selected,
  txns,
  q,
  ok,
  error
}: {
  outletId: string;
  shiftId?: string;
  members: Customer[];
  selected?: Customer;
  txns: MemberDepositTxn[];
  q?: string;
  ok?: string;
  error?: string;
}) {
  return (
    <div className="mx-auto max-w-lg space-y-4">
      {ok === "deposit-topped" && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          Top-up deposit berhasil disimpan.
        </p>
      )}
      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
          {error.includes("%") ? decodeURIComponent(error) : error}
        </p>
      )}

      <section className="pos-panel p-4">
        <h2 className="flex items-center gap-2 text-sm font-black text-navy-900">
          <Users className="h-4 w-4" aria-hidden />
          Cari Member
        </h2>
        <div className="mt-3">
          <PosMemberDepositSearch outletId={outletId} q={q} />
        </div>
      </section>

      <section className="pos-panel p-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
          {q ? "Hasil Pencarian" : "Member dengan Saldo"}
        </h2>
        <div className="mt-3">
          <PosMemberDepositMemberList
            outletId={outletId}
            members={members}
            selectedId={selected?.id}
            q={q}
          />
        </div>
      </section>

      {selected && (
        <section className="pos-panel p-4">
          <h2 className="text-lg font-black text-navy-900">{selected.fullName}</h2>
          <p className="font-mono text-xs text-slate-500">{selected.memberCode}</p>
          <p className="mt-3 text-sm text-slate-600">
            Saldo deposit:{" "}
            <span className="text-xl font-black text-navy-900">
              {formatRp(selected.depositBalance ?? 0)}
            </span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Poin: {selected.totalPoints} · Tier: {selected.tierId?.replace("tier-", "") ?? "basic"}
          </p>

          {shiftId ? (
            <PosMemberDepositTopUpForm
              outletId={outletId}
              shiftId={shiftId}
              customerId={selected.id}
            />
          ) : (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Buka shift dulu untuk mencatat top-up deposit di kasir.
            </p>
          )}

          {txns.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Riwayat Deposit
              </h3>
              <ul className="mt-2 space-y-2 text-sm">
                {txns.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                  >
                    <span>
                      <span className="font-semibold text-navy-800">{DEPOSIT_TXN_LABEL[t.type]}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {new Date(t.createdAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}
                      </span>
                    </span>
                    <span className="text-right">
                      <span
                        className={`font-bold ${t.amount >= 0 ? "text-emerald-700" : "text-rose-700"}`}
                      >
                        {t.amount >= 0 ? "+" : ""}
                        {formatRp(Math.abs(t.amount))}
                      </span>
                      <span className="block text-xs text-slate-500">
                        sisa {formatRp(t.balanceAfter)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <p className="text-xs text-slate-500">
        <Link href="/members" className="font-bold text-navy-700 underline">
          Kelola member & loyalty
        </Link>{" "}
        · Pembayaran pakai deposit di checkout menyusul.
      </p>
    </div>
  );
}
