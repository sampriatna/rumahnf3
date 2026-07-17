import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { OUTLETS } from "@/lib/mock-data";
import { POS_OUTLET_IDS } from "@/lib/pos-seed";
import { resolveLibraryOutletId } from "@/lib/portal-outlet-scope";
import { listMenuItems } from "@/lib/menu-service";
import { getRecipeForItem } from "@/lib/recipe-service";
import { getItems } from "@/lib/inventory-service";
import { PageHeader } from "@/components/PageHeader";
import { RecipeLibraryClient } from "@/components/library/RecipeLibraryClient";

const LIBRARY_ROLES = ["leader", "admin", "owner"];

export default function LibraryRecipesPage({
  searchParams
}: {
  searchParams: { outlet?: string; item?: string; ok?: string };
}) {
  const session = getSession();
  if (!session) redirect("/login");
  if (!LIBRARY_ROLES.includes(session.role)) redirect("/dashboard");

  const fnbOutlets = OUTLETS.filter((o) => POS_OUTLET_IDS.has(o.id));
  const outletId = resolveLibraryOutletId(session, searchParams.outlet, fnbOutlets);

  if (!outletId) redirect("/dashboard");

  const items = listMenuItems(outletId, true).filter((i) => i.active);
  const selectedItemId = searchParams.item ?? items[0]?.id;
  const recipe = selectedItemId ? getRecipeForItem(selectedItemId) : undefined;
  const ingredients = getItems();
  const canPickOutlet = session.role === "owner" || session.role === "admin";

  return (
    <main>
      <PageHeader
        title="Resep / BOM"
        subtitle="Hubungkan produk jualan ke bahan inventory — stok otomatis berkurang saat order selesai."
        backHref="/dashboard"
      />

      {canPickOutlet && (
        <div className="mb-4 flex flex-wrap gap-2">
          {fnbOutlets.map((o) => (
            <Link
              key={o.id}
              href={`/library/recipes?outlet=${o.id}`}
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
          Resep disimpan — stok akan terpotong saat order completed.
        </p>
      )}

      <RecipeLibraryClient
        outletId={outletId}
        items={items}
        recipe={recipe}
        ingredients={ingredients}
        selectedItemId={selectedItemId}
      />
    </main>
  );
}
