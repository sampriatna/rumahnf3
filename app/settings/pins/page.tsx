import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { OUTLETS } from "@/lib/mock-data";
import { PageHeader } from "@/components/PageHeader";
import { listCashierPins } from "@/lib/db/auth-repo";
import { addCashierPinAction, toggleCashierPinAction } from "./actions";
import { isPosOutlet } from "@/lib/pos-seed";
import { posAppUrl } from "@/lib/subdomains";

const VIEW_ROLES = ["owner", "admin"];

export default async function CashierPinsPage({
  searchParams
}: {
  searchParams: { ok?: string; error?: string };
}) {
  const session = getSession();
  if (!session) redirect("/login");
  if (!VIEW_ROLES.includes(session.role)) redirect("/dashboard");

  const posOutlets = OUTLETS.filter((o) => isPosOutlet(o.id));
  const pins = await listCashierPins();
  const byOutlet = posOutlets.map((o) => ({
    outlet: o,
    pins: pins.filter((p) => p.outletId === o.id)
  }));

  return (
    <main className="mx-auto max-w-lg px-5 py-8">
      <PageHeader
        title="PIN Kasir Tablet"
        subtitle="Untuk tablet di counter — bukan akun pribadi staf."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Pengaturan" },
          { label: "PIN Kasir" }
        ]}
      />

      <p className="mb-6 text-xs text-slate-500">
        Staf buka{" "}
        <a href={posAppUrl("/pos/login")} className="font-mono font-bold text-navy-700 underline">
          {posAppUrl("/pos/login")}
        </a>{" "}
        di tablet → pilih outlet → ketik PIN di bawah.
      </p>

      {searchParams.ok === "1" && (
        <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          PIN kasir tersimpan.
        </p>
      )}
      {searchParams.error && (
        <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          Gagal simpan. Pilih outlet dan PIN 4–8 angka.
        </p>
      )}

      <section className="panel mb-8 p-5">
        <h2 className="mb-4 text-lg font-bold text-navy-900">Buat PIN Baru</h2>
        <form action={addCashierPinAction} className="grid gap-4">
          <div>
            <label className="text-sm font-bold text-slate-700">Outlet</label>
            <select
              name="outletId"
              required
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-base"
            >
              {posOutlets.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-bold text-slate-700">PIN (4–8 angka)</label>
            <input
              name="pin"
              type="password"
              inputMode="numeric"
              required
              minLength={4}
              maxLength={8}
              pattern="[0-9]{4,8}"
              placeholder="••••"
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-xl tracking-widest"
            />
          </div>
          <button type="submit" className="btn-primary py-4 text-base">
            Simpan PIN
          </button>
        </form>
      </section>

      {byOutlet.map(({ outlet, pins: outletPins }) => (
        <section key={outlet.id} className="mb-6">
          <h2 className="mb-2 font-bold text-navy-900">{outlet.name}</h2>
          {outletPins.length === 0 ? (
            <p className="panel p-4 text-sm text-slate-400">Belum ada PIN.</p>
          ) : (
            <div className="grid gap-2">
              {outletPins.map((p) => (
                <div key={p.id} className="panel flex items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-bold text-navy-900">{p.label}</p>
                    <p className="text-xs text-slate-500">{p.active ? "Aktif" : "Nonaktif"}</p>
                  </div>
                  <form action={toggleCashierPinAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="active" value={p.active ? "0" : "1"} />
                    <button type="submit" className="btn-secondary text-xs">
                      {p.active ? "Matikan" : "Aktifkan"}
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </section>
      ))}

      <p className="text-center text-xs text-slate-400">
        Akun HP staf?{" "}
        <Link href="/settings/accounts" className="font-bold text-navy-700 underline">
          Kelola Staf
        </Link>
      </p>
    </main>
  );
}
