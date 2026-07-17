import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, Truck } from "lucide-react";
import { getSession } from "@/lib/session";
import { getInventoryStockOverview } from "@/lib/inventory-overview";
import { InventoryOwnerDashboard } from "@/components/inventory/InventoryOwnerDashboard";
import { InventoryLocationGuide } from "@/components/inventory/InventoryLocationGuide";
import { InventorySaldoTable } from "@/components/inventory/InventorySaldoTable";
import { InventoryPageHeader } from "@/components/inventory/InventoryPageHeader";
import { UI_FLAGS } from "@/lib/ui-flags";
import { resolvePortalOutletScope } from "@/lib/portal-outlet-scope";
import { inventorySourceLabel } from "@/lib/inventory-ui";
import {
  StockAlertCard,
  InventoryDataSourceBanner,
  InventoryMovementNotice
} from "@/components/inventory/StockAlertCard";

const VIEW_ROLES = ["leader", "owner", "admin"];

export default async function InventoryPage() {
  const session = getSession();
  if (!session) redirect("/login");
  if (!VIEW_ROLES.includes(session.role)) redirect("/dashboard");

  const scope =
    session.role === "leader"
      ? session.outletId
      : resolvePortalOutletScope(session) ?? undefined;
  const { rows, critical, metrics, sourceEmpty, ownerDashboard, lokasiList, lokasiColumns } =
    await getInventoryStockOverview(scope);
  const canManageData = session.role === "owner" || session.role === "admin";
  const showOwnerDashboard = !scope && ownerDashboard;
  const invUi = UI_FLAGS.inventoryUiV1;

  return (
    <>
      <InventoryPageHeader
        title="Stok & Saldo"
        subtitle={
          scope
            ? "Gudang pusat dan outlet kamu — update otomatis dari setiap mutasi."
            : "Pantau qty dan nilai stok di semua lokasi secara real-time."
        }
        action={
          <Link
            href="/inventory/transfers"
            className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-navy-800"
          >
            <Truck className="h-4 w-4" aria-hidden />
            Transfer
          </Link>
        }
      />

      {invUi && <InventoryDataSourceBanner sourceLabel={inventorySourceLabel()} />}
      {invUi && <InventoryMovementNotice />}

      {!sourceEmpty && <InventoryLocationGuide lokasiList={lokasiList} />}

      {sourceEmpty ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-sm text-slate-600">Belum ada master bahan di sumber inventory aktif.</p>
          {canManageData && (
            <Link
              href="/inventory/data/bahan"
              className="mt-4 inline-flex rounded-xl bg-navy-900 px-4 py-2 text-sm font-bold text-white"
            >
              Tambah master bahan
            </Link>
          )}
        </div>
      ) : (
        <>
          {showOwnerDashboard && ownerDashboard && (
            <div className="mb-6">
              <InventoryOwnerDashboard dashboard={ownerDashboard} canManageData={canManageData} />
            </div>
          )}

          {!showOwnerDashboard && critical.length > 0 && invUi && (
            <StockAlertCard
              beliCount={metrics.kritisBeli}
              waspadaCount={metrics.kritisWaspada}
              items={critical.map((item) => ({
                kodeBahan: item.kodeBahan,
                namaBaku: item.namaBaku,
                status: item.status
              }))}
            />
          )}

          {!showOwnerDashboard && critical.length > 0 && !invUi && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-4 shadow-sm">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <AlertTriangle className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-amber-950">
                  {metrics.kritisBeli} perlu beli · {metrics.kritisWaspada} waspada
                </p>
                <p className="mt-1 text-sm text-amber-900/90">
                  {critical
                    .slice(0, 5)
                    .map((item) => item.namaBaku)
                    .join(" · ")}
                  {critical.length > 5 ? " …" : ""}
                </p>
                <Link
                  href="/inventory/transfers"
                  className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-amber-900 hover:underline"
                >
                  <Truck className="h-4 w-4" aria-hidden />
                  Ajukan transfer dari gudang
                </Link>
              </div>
            </div>
          )}

          <InventorySaldoTable rows={rows} lokasiColumns={lokasiColumns} />
        </>
      )}
    </>
  );
}
