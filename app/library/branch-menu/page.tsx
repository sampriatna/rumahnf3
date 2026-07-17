import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { OUTLETS } from "@/lib/mock-data";
import { POS_OUTLET_IDS } from "@/lib/pos-seed";
import { resolveLibraryOutletId } from "@/lib/portal-outlet-scope";
import {
  ensureBranchMenuReady,
  getDefaultCatalogOutlet,
  listBranchMenuRows
} from "@/lib/branch-menu-service";
import { PageHeader } from "@/components/PageHeader";
import { BranchMenuLibraryClient } from "@/components/library/BranchMenuLibraryClient";

const LIBRARY_ROLES = ["leader", "admin", "owner"];

export default function LibraryBranchMenuPage({
  searchParams
}: {
  searchParams: { branch?: string; catalog?: string; ok?: string; error?: string };
}) {
  const session = getSession();
  if (!session) redirect("/login");
  if (!LIBRARY_ROLES.includes(session.role)) redirect("/dashboard");

  const fnbOutlets = OUTLETS.filter((o) => POS_OUTLET_IDS.has(o.id));
  const catalogOutletId =
    resolveLibraryOutletId(session, searchParams.catalog, fnbOutlets) ?? getDefaultCatalogOutlet();
  const branchOutletId =
    searchParams.branch && POS_OUTLET_IDS.has(searchParams.branch) && searchParams.branch !== catalogOutletId
      ? searchParams.branch
      : fnbOutlets.find((o) => o.id !== catalogOutletId)?.id ?? "kisamen";

  ensureBranchMenuReady();
  const rows = listBranchMenuRows(catalogOutletId, branchOutletId);
  const catalogOutlet = OUTLETS.find((o) => o.id === catalogOutletId)!;
  const branchOutlet = OUTLETS.find((o) => o.id === branchOutletId)!;
  const canPick = session.role === "owner" || session.role === "admin";

  const messages: Record<string, string> = {
    saved: "Pengaturan cabang disimpan.",
    on: "Item diaktifkan di cabang.",
    off: "Item dinonaktifkan di cabang.",
    "enabled-all": "Semua item katalog diaktifkan di cabang.",
    bootstrapped: "Branch menu diisi dari template default.",
    invalid: "Data tidak valid — cek outlet katalog & cabang.",
    "not-found": "Item tidak ditemukan."
  };

  return (
    <main>
      <PageHeader
        title="Branch Menu"
        subtitle="Harga & aktif/nonaktif menu per cabang — seperti ESB Core."
        backHref="/dashboard"
      />

      {canPick && (
        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-bold uppercase text-slate-500">Katalog sumber</p>
            <div className="flex flex-wrap gap-2">
              {fnbOutlets.map((o) => (
                <Link
                  key={o.id}
                  href={`/library/branch-menu?catalog=${o.id}&branch=${branchOutletId}`}
                  className={`rounded-full px-4 py-2 text-xs font-bold ${
                    o.id === catalogOutletId ? "bg-navy-800 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {o.name}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase text-slate-500">Cabang</p>
            <div className="flex flex-wrap gap-2">
              {fnbOutlets
                .filter((o) => o.id !== catalogOutletId)
                .map((o) => (
                  <Link
                    key={o.id}
                    href={`/library/branch-menu?catalog=${catalogOutletId}&branch=${o.id}`}
                    className={`rounded-full px-4 py-2 text-xs font-bold ${
                      o.id === branchOutletId ? "bg-gold-500 text-navy-900" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {o.name}
                  </Link>
                ))}
            </div>
          </div>
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

      <BranchMenuLibraryClient
        catalogOutletId={catalogOutletId}
        branchOutletId={branchOutletId}
        catalogOutletName={catalogOutlet.name}
        branchOutletName={branchOutlet.name}
        rows={rows}
      />
    </main>
  );
}
