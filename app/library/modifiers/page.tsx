import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { OUTLETS } from "@/lib/mock-data";
import { POS_OUTLET_IDS } from "@/lib/pos-seed";
import { resolveLibraryOutletId } from "@/lib/portal-outlet-scope";
import { listModifiers } from "@/lib/modifier-service";
import { PageHeader } from "@/components/PageHeader";
import { ModifierLibraryClient } from "@/components/library/ModifierLibraryClient";

const LIBRARY_ROLES = ["leader", "admin", "owner"];

export default function LibraryModifiersPage({
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

  const modifiers = listModifiers(outletId, true);
  const canPickOutlet = session.role === "owner" || session.role === "admin";

  return (
    <main>
      <PageHeader
        title="Add-on / Modifier"
        subtitle="Kelola pilihan tambahan di POS — Extra Shot, Ice, topping (mirip Pengubah di Moka)."
        backHref="/dashboard"
      />

      {canPickOutlet && (
        <div className="mb-4 flex flex-wrap gap-2">
          {fnbOutlets.map((o) => (
            <Link
              key={o.id}
              href={`/library/modifiers?outlet=${o.id}`}
              className={`rounded-full px-4 py-2 text-xs font-bold ${
                o.id === outletId ? "bg-navy-800 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {o.name}
            </Link>
          ))}
        </div>
      )}

      {searchParams.ok === "saved" && (
        <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          Add-on disimpan — langsung tersedia di POS.
        </p>
      )}

      <ModifierLibraryClient outletId={outletId} modifiers={modifiers} />
    </main>
  );
}
