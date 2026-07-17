import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { OUTLETS } from "@/lib/mock-data";
import { POS_OUTLET_IDS } from "@/lib/pos-seed";
import { resolveLibraryOutletId } from "@/lib/portal-outlet-scope";
import { ensurePromotionsReady, listPromotions } from "@/lib/promotion-service";
import { PageHeader } from "@/components/PageHeader";
import { PromotionLibraryClient } from "@/components/library/PromotionLibraryClient";

const LIBRARY_ROLES = ["leader", "admin", "owner"];

export default function LibraryPromotionsPage({
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

  ensurePromotionsReady(outletId);
  const promotions = listPromotions(outletId, true);
  const canPickOutlet = session.role === "owner" || session.role === "admin";

  const messages: Record<string, string> = {
    "promo-saved": "Promosi disimpan.",
    "promo-on": "Promosi diaktifkan.",
    "promo-off": "Promosi dinonaktifkan.",
    bootstrapped: "Promosi diisi dari template default.",
    duplicate: "Nama promosi sudah dipakai.",
    invalid: "Data tidak valid."
  };

  return (
    <main>
      <PageHeader
        title="Promosi"
        subtitle="Promotion — diskon order/item untuk kasir di checkout."
        backHref="/dashboard"
      />

      {canPickOutlet && (
        <div className="mb-4 flex flex-wrap gap-2">
          {fnbOutlets.map((o) => (
            <Link
              key={o.id}
              href={`/library/promotions?outlet=${o.id}`}
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

      <PromotionLibraryClient outletId={outletId} promotions={promotions} />
    </main>
  );
}
