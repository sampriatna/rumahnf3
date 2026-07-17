import Link from "next/link";
import { redirect } from "next/navigation";
import { Smartphone, Tablet, Banknote } from "lucide-react";
import { getSession } from "@/lib/session";
import { OUTLETS } from "@/lib/mock-data";
import { PageHeader } from "@/components/PageHeader";
import { StaffAccountForm } from "@/components/settings/StaffAccountForm";
import { listAuthAccounts } from "@/lib/db/auth-repo";
import { isSupabaseConfigured } from "@/lib/supabase";
import { toggleStaffAccountAction, resetStaffPinAction } from "./actions";
import { workUnitForIdentity, isJagasatruPurchasingIdentity } from "@/lib/finance-access";

const VIEW_ROLES = ["owner", "admin"];

const TYPE_BADGE: Record<string, string> = {
  leader: "Leader",
  kds: "Tablet KDS",
  forms: "Staf pribadi",
  purchasing: "Purchasing",
  default: "Staf"
};

function accountBadge(a: { role: string; capabilities?: string[] }) {
  if (a.role === "leader") return TYPE_BADGE.leader;
  if (a.role === "owner" || a.role === "admin") return a.role === "owner" ? "Owner" : "Admin";
  if (a.role === "staff" && a.capabilities?.includes("inventory")) return TYPE_BADGE.purchasing;
  if (a.capabilities?.includes("kds") && a.capabilities.length === 1) return TYPE_BADGE.kds;
  if (a.capabilities?.includes("forms") || !a.capabilities?.length) return TYPE_BADGE.forms;
  return TYPE_BADGE.default;
}

export default async function StaffAccountsPage({
  searchParams
}: {
  searchParams: { ok?: string; error?: string };
}) {
  const session = getSession();
  if (!session) redirect("/login");
  if (!VIEW_ROLES.includes(session.role)) redirect("/dashboard");

  const dbReady = isSupabaseConfigured();
  const accounts = await listAuthAccounts(["staff", "leader"]);
  const fnbOutlets = OUTLETS.filter((o) => o.id !== "nf-prod");

  const errors: Record<string, string> = {
    invalid: "Isi nama, HP, PIN, dan pilih outlet.",
    phone: "Nomor HP sudah dipakai akun lain.",
    save: "Gagal simpan. Coba lagi.",
    "no-db": "Database belum siap. Hubungkan Supabase dulu."
  };

  return (
    <main className="mx-auto max-w-lg px-5 py-8">
      <PageHeader
        title="Kelola Staf"
        subtitle="Buat akun HP + PIN untuk tim kamu."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Pengaturan" },
          { label: "Kelola Staf" }
        ]}
      />

      {/* Panduan singkat */}
      <div className="mb-6 grid gap-2 text-xs">
        <div className="panel flex items-center gap-3 p-3">
          <Smartphone className="h-5 w-5 shrink-0 text-navy-700" aria-hidden />
          <span>
            <strong>Staf pribadi</strong> — login HP di halaman masuk (gaji, form, SOP)
          </span>
        </div>
        <div className="panel flex items-center gap-3 p-3">
          <Tablet className="h-5 w-5 shrink-0 text-navy-700" aria-hidden />
          <span>
            <strong>Tablet KDS</strong> — akun khusus layar dapur/bar
          </span>
        </div>
        <div className="panel flex items-center gap-3 p-3">
          <Banknote className="h-5 w-5 shrink-0 text-navy-700" aria-hidden />
          <span>
            <strong>Kasir tablet?</strong>{" "}
            <Link href="/settings/pins" className="font-bold text-navy-800 underline">
              Atur PIN Kasir
            </Link>{" "}
            (bukan di sini)
          </span>
        </div>
      </div>

      {searchParams.ok === "1" && (
        <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          Akun berhasil dibuat.
        </p>
      )}
      {searchParams.ok === "pin" && (
        <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          PIN berhasil diubah.
        </p>
      )}
      {searchParams.error && (
        <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {errors[searchParams.error] ?? "Terjadi kesalahan."}
        </p>
      )}

      <section className="panel mb-8 p-5">
        <h2 className="mb-4 text-lg font-bold text-navy-900">Tambah Akun</h2>
        <StaffAccountForm outlets={fnbOutlets} disabled={!dbReady} />
        {!dbReady && (
          <p className="mt-3 text-xs text-amber-700">Supabase belum aktif — form nonaktif sementara.</p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
          Tim ({accounts.length})
        </h2>
        {accounts.length === 0 ? (
          <p className="panel p-4 text-sm text-slate-400">Belum ada akun staf.</p>
        ) : (
          <div className="grid gap-3">
            {accounts.map((a) => {
              const outlet = a.outletId ? OUTLETS.find((o) => o.id === a.outletId)?.name : "—";
              const badge = accountBadge(a);
              const areaUnit = workUnitForIdentity({ name: a.fullName, email: a.email, phone: a.phone });
              const isAbdul = isJagasatruPurchasingIdentity({
                name: a.fullName,
                email: a.email,
                phone: a.phone
              });

              return (
                <div key={a.id} className="panel p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-lg font-bold text-navy-900">{a.fullName}</p>
                      <p className="font-mono text-sm text-slate-600">{a.phone}</p>
                      <p className="mt-1 text-xs text-slate-500">{outlet}</p>
                      {areaUnit && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                            Purchasing
                          </span>
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                            {areaUnit}
                          </span>
                        </div>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                        a.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {a.active ? badge : "Nonaktif"}
                    </span>
                  </div>
                  {isAbdul && (
                    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                      <p className="font-bold text-slate-700">Akses Dompet</p>
                      <p>Role: Purchasing</p>
                      <p>Area kerja: Jagasatru</p>
                      <p>Jagasatru: input dan lihat</p>
                      <p>Rekening: input dan lihat</p>
                      <p>Purchasing Kecil: tidak ada akses</p>
                    </div>
                  )}

                  {dbReady && (
                    <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                      <form action={toggleStaffAccountAction}>
                        <input type="hidden" name="id" value={a.id} />
                        <input type="hidden" name="active" value={a.active ? "0" : "1"} />
                        <button type="submit" className="btn-secondary px-3 py-2 text-xs">
                          {a.active ? "Nonaktifkan" : "Aktifkan lagi"}
                        </button>
                      </form>
                      <form action={resetStaffPinAction} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={a.id} />
                        <input
                          name="pin"
                          type="password"
                          inputMode="numeric"
                          placeholder="PIN baru"
                          minLength={4}
                          maxLength={8}
                          pattern="[0-9]{4,8}"
                          className="w-24 rounded-lg border border-slate-200 px-2 py-2 text-sm"
                        />
                        <button type="submit" className="btn-secondary px-3 py-2 text-xs">
                          Ganti PIN
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
