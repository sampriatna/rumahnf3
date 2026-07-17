import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { OUTLETS } from "@/lib/mock-data";
import { POS_OUTLET_IDS } from "@/lib/pos-seed";
import { resolveLibraryOutletId } from "@/lib/portal-outlet-scope";
import { ensureCoaReady, listChartOfAccounts } from "@/lib/coa-service";
import { ensurePaymentMethodsReady, listPosPaymentMethods } from "@/lib/payment-method-service";
import { PageHeader } from "@/components/PageHeader";
import { PaymentMethodLibraryClient } from "@/components/library/PaymentMethodLibraryClient";

const LIBRARY_ROLES = ["leader", "admin", "owner"];

export default function LibraryPaymentMethodsPage({
  searchParams
}: {
  searchParams: { outlet?: string; ok?: string; error?: string };
}) {
  const session = getSession();
  if (!session) redirect("/login");
  if (!LIBRARY_ROLES.includes(session.role)) redirect("/dashboard");

  const fnbOutlets = OUTLETS.filter((o) => POS_OUTLET_IDS.has(o.id));
  const outletId = resolveLibraryOutletId(session, searchParams.outlet, fnbOutlets);

  if (!outletId) redirect("/dashboard");

  ensureCoaReady();
  ensurePaymentMethodsReady(outletId);
  const methods = listPosPaymentMethods(outletId, true);
  const coaAccounts = listChartOfAccounts();
  const canPickOutlet = session.role === "owner" || session.role === "admin";

  const messages: Record<string, string> = {
    saved: "Metode bayar disimpan.",
    on: "Metode diaktifkan.",
    off: "Metode dinonaktifkan.",
    bootstrapped: "Metode bayar diisi dari template default.",
    coa: "Akun COA tidak valid — pilih dari Bagan Akun.",
    invalid: "Data tidak valid — cek lagi.",
    "not-found": "Data tidak ditemukan."
  };

  return (
    <main>
      <PageHeader
        title="Metode Bayar"
        subtitle="Master pembayaran kasir per outlet — dipetakan ke COA & setoran shift."
        backHref="/dashboard"
      />

      {canPickOutlet && (
        <div className="mb-4 flex flex-wrap gap-2">
          {fnbOutlets.map((o) => (
            <Link
              key={o.id}
              href={`/library/payment-methods?outlet=${o.id}`}
              className={`rounded-full px-4 py-2 text-xs font-bold ${
                o.id === outletId ? "bg-navy-800 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {o.name}
            </Link>
          ))}
        </div>
      )}

      {searchParams.ok && (
        <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {messages[searchParams.ok] ?? "Berhasil."}
        </p>
      )}
      {searchParams.error && (
        <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {messages[searchParams.error] ?? "Terjadi kesalahan."}
        </p>
      )}

      <PaymentMethodLibraryClient outletId={outletId} methods={methods} coaAccounts={coaAccounts} />
    </main>
  );
}
