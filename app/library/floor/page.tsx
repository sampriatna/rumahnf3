import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { OUTLETS } from "@/lib/mock-data";
import { POS_OUTLET_IDS } from "@/lib/pos-seed";
import { resolveLibraryOutletId } from "@/lib/portal-outlet-scope";
import { ensureFloorReady, listTableSections, listFloorTables } from "@/lib/floor-service";
import { PageHeader } from "@/components/PageHeader";
import { FloorLibraryClient } from "@/components/library/FloorLibraryClient";

const LIBRARY_ROLES = ["leader", "admin", "owner"];

export default function LibraryFloorPage({
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

  ensureFloorReady(outletId);
  const sections = listTableSections(outletId, true);
  const tables = listFloorTables(outletId, true);
  const canPickOutlet = session.role === "owner" || session.role === "admin";

  const messages: Record<string, string> = {
    "section-saved": "Area meja disimpan.",
    "section-on": "Area diaktifkan.",
    "section-off": "Area dinonaktifkan.",
    "table-saved": "Meja disimpan.",
    "table-on": "Meja diaktifkan.",
    "table-off": "Meja dinonaktifkan.",
    bootstrapped: "Denah diisi dari template default outlet.",
    duplicate: "Nama/label sudah dipakai di outlet ini.",
    invalid: "Data tidak valid — cek lagi.",
    "not-found": "Data tidak ditemukan.",
    "section-in-use": "Area masih punya meja — pindahkan/hapus meja dulu."
  };

  return (
    <main>
      <PageHeader
        title="Meja & Area"
        subtitle="Table Section + Table Management — seperti master data ESB Core."
        backHref="/dashboard"
      />

      {canPickOutlet && (
        <div className="mb-4 flex flex-wrap gap-2">
          {fnbOutlets.map((o) => (
            <Link
              key={o.id}
              href={`/library/floor?outlet=${o.id}`}
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

      <FloorLibraryClient outletId={outletId} sections={sections} tables={tables} />
    </main>
  );
}
