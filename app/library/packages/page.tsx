import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { OUTLETS } from "@/lib/mock-data";
import { POS_OUTLET_IDS } from "@/lib/pos-seed";
import { resolveLibraryOutletId } from "@/lib/portal-outlet-scope";
import { ensureMenuLibraryReady, listMenuItems } from "@/lib/menu-service";
import {
  ensurePackagesReady,
  listMenuPackages,
  listPackageItems,
  packageComponentSummary
} from "@/lib/package-service";
import { PageHeader } from "@/components/PageHeader";
import { PackageLibraryClient } from "@/components/library/PackageLibraryClient";

const LIBRARY_ROLES = ["leader", "admin", "owner"];

export default function LibraryPackagesPage({
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

  ensureMenuLibraryReady(outletId);
  ensurePackagesReady(outletId);
  const packages = listMenuPackages(outletId, true).map((pkg) => ({
    ...pkg,
    summary: packageComponentSummary(pkg.id),
    items: listPackageItems(pkg.id)
  }));
  const menuItems = listMenuItems(outletId, true);
  const canPickOutlet = session.role === "owner" || session.role === "admin";

  const messages: Record<string, string> = {
    "package-saved": "Paket menu disimpan.",
    "package-on": "Paket diaktifkan.",
    "package-off": "Paket dinonaktifkan.",
    bootstrapped: "Paket diisi dari template default.",
    duplicate: "Nama paket sudah dipakai.",
    "empty-items": "Pilih minimal satu komponen menu.",
    invalid: "Data tidak valid."
  };

  return (
    <main>
      <PageHeader
        title="Paket Menu"
        subtitle="Menu Package — bundling beberapa item jadi satu harga (ESB Core)."
        backHref="/dashboard"
      />

      {canPickOutlet && (
        <div className="mb-4 flex flex-wrap gap-2">
          {fnbOutlets.map((o) => (
            <Link
              key={o.id}
              href={`/library/packages?outlet=${o.id}`}
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

      <PackageLibraryClient outletId={outletId} packages={packages} menuItems={menuItems} />
    </main>
  );
}
