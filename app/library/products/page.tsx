import Link from "next/link";
import { redirect } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { getSession } from "@/lib/session";
import { OUTLETS } from "@/lib/mock-data";
import { POS_OUTLET_IDS } from "@/lib/pos-seed";
import { resolveLibraryOutletId } from "@/lib/portal-outlet-scope";
import { ensureMenuLibraryReady, listMenuCategories, listMenuItems } from "@/lib/menu-service";
import { listStations, ensureStationsReady } from "@/lib/station-service";
import { listModifiers, getModifierIdsForItem } from "@/lib/modifier-service";
import { listVariantsForItem } from "@/lib/variant-service";
import { getMenuCatalogMeta } from "@/lib/catalog-meta";
import { LibraryCatalogBanner } from "@/components/library/LibraryCatalogBanner";
import { PageHeader } from "@/components/PageHeader";
import { ProductLibraryClient } from "@/components/library/ProductLibraryClient";
import { ProductQuickAdd } from "@/components/library/ProductQuickAdd";
import { bootstrapOutletMenuAction } from "../actions";

const LIBRARY_ROLES = ["leader", "admin", "owner"];

export default function LibraryProductsPage({
  searchParams
}: {
  searchParams: { outlet?: string; ok?: string; error?: string; q?: string };
}) {
  const session = getSession();
  if (!session) redirect("/login");
  if (!LIBRARY_ROLES.includes(session.role)) redirect("/dashboard");

  const fnbOutlets = OUTLETS.filter((o) => POS_OUTLET_IDS.has(o.id));
  const outletId = resolveLibraryOutletId(session, searchParams.outlet, fnbOutlets);

  if (!outletId) redirect("/dashboard");

  ensureMenuLibraryReady(outletId);
  ensureStationsReady(outletId);
  const categories = listMenuCategories(outletId, true);
  const items = listMenuItems(outletId, true);
  const modifiers = listModifiers(outletId, true);
  const itemModifierMap = Object.fromEntries(
    items.map((i) => [i.id, getModifierIdsForItem(i.id)])
  );
  const itemVariantMap = Object.fromEntries(
    items.map((i) => [i.id, listVariantsForItem(i.id, true)])
  );
  const catalogMeta = getMenuCatalogMeta(outletId);
  const stations = listStations(outletId).map((s) => ({ id: s.id, name: s.name }));
  const outlet = OUTLETS.find((o) => o.id === outletId)!;
  const canPickOutlet = session.role === "owner" || session.role === "admin";

  const activeCategories = categories.filter((c) => c.active);
  const needsBootstrap = categories.length === 0;

  const messages: Record<string, string> = {
    saved: "Produk disimpan — data sudah ke disk & cloud. Refresh halaman POS kasir.",
    added: "Produk baru ditambahkan — langsung tampil di POS.",
    bootstrapped: "Kategori dasar dibuat (Kopi, Minuman, Makanan, Snack). Silakan isi produk.",
    activated: "Produk diaktifkan kembali.",
    deactivated: "Produk dinonaktifkan — tidak tampil di POS.",
    invalid: "Isi nama dan harga dengan benar.",
    duplicate: "Nama produk sudah ada di outlet ini — pakai nama lain.",
    "invalid-outlet": "Outlet tidak valid.",
    "not-found": "Produk tidak ditemukan.",
    save: "Gagal menyimpan. Coba lagi.",
    soldout: "Produk ditandai habis — tidak bisa dipesan di POS.",
    instock: "Produk kembali tersedia di POS.",
    synced: "Menu disinkronkan — minta kasir refresh halaman POS."
  };

  return (
    <main>
      <PageHeader
        title="Daftar Produk"
        subtitle="Kelola menu jualan POS — foto, nama, harga, kategori. Mirip Library Moka Backoffice."
        backHref="/dashboard"
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        {canPickOutlet ? (
          <div className="flex flex-wrap gap-2">
            {fnbOutlets.map((o) => (
              <Link
                key={o.id}
                href={`/library/products?outlet=${o.id}`}
                className={`rounded-full px-4 py-2 text-xs font-bold ${
                  o.id === outletId ? "bg-navy-800 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {o.name}
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm font-semibold text-slate-600">{outlet.name}</p>
        )}
        <p className="ml-auto flex items-center gap-1 text-xs text-slate-400">
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          Perubahan langsung ke POS setelah refresh halaman kasir
        </p>
      </div>

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

      {needsBootstrap ? (
        <div className="panel p-8 text-center">
          <p className="text-sm text-slate-600">
            Outlet <strong>{outlet.name}</strong> belum punya kategori menu.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Klik tombol di bawah untuk buat kategori dasar (seperti setup awal Moka).
          </p>
          <form action={bootstrapOutletMenuAction} className="mt-4">
            <input type="hidden" name="outletId" value={outletId} />
            <button type="submit" className="btn-primary px-6 py-3">
              Buat Kategori Dasar
            </button>
          </form>
        </div>
      ) : (
        <>
          <LibraryCatalogBanner outletId={outletId} meta={catalogMeta} />
          <ProductQuickAdd outletId={outletId} categories={activeCategories} />
          <ProductLibraryClient
            outletId={outletId}
            categories={categories}
            items={items}
            modifiers={modifiers}
            itemModifierMap={itemModifierMap}
            itemVariantMap={itemVariantMap}
            stations={stations}
            initialSearch={searchParams.q ?? ""}
          />
        </>
      )}
    </main>
  );
}
