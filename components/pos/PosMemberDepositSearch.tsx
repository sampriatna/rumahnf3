import Link from "next/link";
import { Search } from "lucide-react";

export function PosMemberDepositSearch({
  outletId,
  q
}: {
  outletId: string;
  q?: string;
}) {
  return (
    <form method="get" className="flex gap-2">
      <input type="hidden" name="outlet" value={outletId} />
      <div className="relative min-w-0 flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
        <input
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Cari nama, kode member, atau HP"
          className="nf3-input w-full py-3 pl-9 font-semibold"
        />
      </div>
      <button type="submit" className="pos-cta-secondary shrink-0 px-4 text-sm">
        Cari
      </button>
    </form>
  );
}

export function PosMemberDepositMemberList({
  outletId,
  members,
  selectedId,
  q
}: {
  outletId: string;
  members: Array<{
    id: string;
    fullName: string;
    memberCode: string;
    depositBalance?: number;
  }>;
  selectedId?: string;
  q?: string;
}) {
  if (!members.length) {
    return (
      <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">
        {q ? "Member tidak ditemukan." : "Belum ada member dengan saldo deposit."}
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {members.map((m) => {
        const params = new URLSearchParams({ outlet: outletId, member: m.id });
        if (q) params.set("q", q);
        const active = m.id === selectedId;
        return (
          <li key={m.id}>
            <Link
              href={`/pos/member-deposit?${params.toString()}`}
              className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition ${
                active
                  ? "border-navy-300 bg-navy-50"
                  : "border-slate-100 bg-white hover:border-slate-200"
              }`}
            >
              <span>
                <span className="font-bold text-navy-900">{m.fullName}</span>
                <span className="mt-0.5 block font-mono text-xs text-slate-500">{m.memberCode}</span>
              </span>
              <span className="font-black text-navy-800">
                {(m.depositBalance ?? 0).toLocaleString("id-ID")} Rp
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
