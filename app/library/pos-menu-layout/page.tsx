import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { OUTLETS } from "@/lib/mock-data";
import { POS_OUTLET_IDS } from "@/lib/pos-seed";
import { resolveLibraryOutletId } from "@/lib/portal-outlet-scope";
import { listMenuCategories } from "@/lib/menu-service";
import { getMenuForOutlet } from "@/lib/pos-service";
import {
  ensurePosMenuLayoutsReady,
  getActivePosMenuLayout,
  applyPosMenuLayout
} from "@/lib/pos-menu-layout-service";
import { PageHeader } from "@/components/PageHeader";
import { PosMenuLayoutLibraryClient } from "@/components/library/PosMenuLayoutLibraryClient";

const LIBRARY_ROLES = ["leader", "admin", "owner"];

export default function LibraryPosMenuLayoutPage({
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

  ensurePosMenuLayoutsReady(outletId);
  const layout = getActivePosMenuLayout(outletId);
  const catalogCategories = listMenuCategories(outletId, true);
  const { items } = getMenuForOutlet(outletId);
  const applied = applyPosMenuLayout(catalogCategories, items, layout);
  const canPickOutlet = session.role === "owner" || session.role === "admin";

  const messages: Record<string, string> = {
    saved: "Layout POS disimpan.",
    bootstrapped: "Layout diisi dari template default.",
    duplicate: "Nama layout sudah dipakai di outlet ini.",
    invalid: "Data tidak valid — cek lagi.",
    "not-found": "Data tidak ditemukan."
  };

  return (
    <main>
      <PageHeader
        title="Layout POS"
        subtitle="Atur tata letak tombol menu di layar kasir — urutan kategori, favorit, tab vs scroll."
        backHref="/dashboard"
      />

      {canPickOutlet && (
        <div className="mb-4 flex flex-wrap gap-2">
          {fnbOutlets.map((o) => (
            <Link
              key={o.id}
              href={`/library/pos-menu-layout?outlet=${o.id}`}
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

      {layout && (
        <PosMenuLayoutLibraryClient
          outletId={outletId}
          layout={layout}
          categories={catalogCategories}
          items={items}
          previewCategoryOrder={applied.categories.map((c) => c.id)}
        />
      )}
    </main>
  );
}
