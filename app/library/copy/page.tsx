import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { OUTLETS } from "@/lib/mock-data";
import { POS_OUTLET_IDS } from "@/lib/pos-seed";
import { resolveLibraryOutletId } from "@/lib/portal-outlet-scope";
import { PageHeader } from "@/components/PageHeader";
import { CopyMenuClient } from "@/components/library/CopyMenuClient";

const LIBRARY_ROLES = ["leader", "admin", "owner"];

export default function LibraryCopyPage({
  searchParams
}: {
  searchParams: { source?: string; target?: string; ok?: string; error?: string };
}) {
  const session = getSession();
  if (!session) redirect("/login");
  if (!LIBRARY_ROLES.includes(session.role)) redirect("/dashboard");
  if (session.role !== "owner" && session.role !== "admin") redirect("/library/products");

  const fnbOutlets = OUTLETS.filter((o) => POS_OUTLET_IDS.has(o.id));
  const sourceOutletId =
    resolveLibraryOutletId(session, searchParams.source, fnbOutlets) ?? "kbu";
  const targetOutletId =
    searchParams.target && POS_OUTLET_IDS.has(searchParams.target) && searchParams.target !== sourceOutletId
      ? searchParams.target
      : fnbOutlets.find((o) => o.id !== sourceOutletId)?.id ?? "kisamen";

  return (
    <main>
      <PageHeader
        title="Salin Menu Antar Outlet"
        subtitle="Duplikat katalog KBU ke Kisamen/Samtaro — produk, kategori, add-on, varian, resep."
        backHref="/dashboard"
      />

      {searchParams.ok === "copied" && (
        <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          Menu berhasil disalin. Cek Library Produk outlet tujuan lalu sinkronkan POS.
        </p>
      )}
      {searchParams.error === "forbidden" && (
        <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          Hanya admin/owner yang bisa salin menu antar outlet.
        </p>
      )}
      {searchParams.error === "invalid" && (
        <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          Pilih outlet sumber dan tujuan yang berbeda.
        </p>
      )}

      <CopyMenuClient
        outlets={fnbOutlets}
        sourceOutletId={sourceOutletId}
        targetOutletId={targetOutletId}
      />
    </main>
  );
}
