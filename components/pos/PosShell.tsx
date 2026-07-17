import type { ReactNode } from "react";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { ProductGrid } from "./ProductGrid";
import { PosToolbar } from "./PosToolbar";
import { PosDrawerLayout } from "./PosDrawerLayout";
import { PosAlerts } from "./PosAlerts";
import { ActiveOrderStrip } from "./ActiveOrderStrip";
import { PosShiftOrdersList } from "./PosOrderStrip";
import { CartPanel, OpenBillsPanel } from "./CartPanel";
import { PosCartSheet } from "./PosCartSheet";
import { formatRp } from "@/lib/finance";
import type { PosOrder, PosShift } from "@/lib/pos-kds-roadmap";
import type { PosCartLine } from "@/lib/store";
import type { SalesChannel } from "@/lib/channel-service";
import type { PosOutletConfig } from "@/lib/pos-outlet-config";
import type { PosRegister } from "@/lib/pos-kds-roadmap";
import type { MenuPriceSchedule } from "@/lib/price-schedule-service";
import type { FloorTable } from "@/lib/pos-floor";
import type { PosWaiterOption } from "@/lib/pos-waiter-service";
import type { PosDrawerContext } from "@/lib/pos-drawer-context";

type MenuLayout = Parameters<typeof ProductGrid>[0]["menuLayout"];
type PackageRow = NonNullable<Parameters<typeof ProductGrid>[0]["packages"]>[number];

export function PosShell({
  outletId,
  outletName,
  shift,
  sessionRole,
  searchParams,
  register,
  posCfg,
  channels,
  cart,
  cartTotal,
  orders,
  openBills,
  heldBills,
  shiftTotal,
  onlinePending,
  hasFloor,
  canConfigure,
  activePriceSchedules,
  categories,
  items,
  modifierMap,
  variantMap,
  packages,
  menuLayout,
  floorTables,
  defaultTable,
  menuEmpty,
  waiters = [],
  focusItemId,
  drawerCtx
}: {
  outletId: string;
  outletName: string;
  shift: PosShift;
  sessionRole: string;
  searchParams: {
    ok?: string;
    error?: string;
    order?: string;
    table?: string;
  };
  register: PosRegister | null | undefined;
  posCfg: PosOutletConfig;
  channels: SalesChannel[];
  cart: PosCartLine[];
  cartTotal: number;
  orders: PosOrder[];
  openBills: PosOrder[];
  heldBills: PosOrder[];
  shiftTotal: number;
  onlinePending: number;
  hasFloor: boolean;
  canConfigure: boolean;
  activePriceSchedules: MenuPriceSchedule[];
  categories: Parameters<typeof ProductGrid>[0]["categories"];
  items: Parameters<typeof ProductGrid>[0]["items"];
  modifierMap: Parameters<typeof ProductGrid>[0]["modifierMap"];
  variantMap: Parameters<typeof ProductGrid>[0]["variantMap"];
  packages: PackageRow[];
  menuLayout: MenuLayout;
  floorTables: FloorTable[];
  defaultTable?: string;
  menuEmpty?: boolean;
  waiters?: PosWaiterOption[];
  focusItemId?: string;
  drawerCtx?: PosDrawerContext;
}) {
  const itemCount = cart.reduce((s, l) => s + l.qty, 0);

  const sidePanel: ReactNode = (
    <>
      <CartPanel
        outletId={outletId}
        shiftId={shift.id}
        cart={cart}
        cartTotal={cartTotal}
        channels={channels}
        posCfg={posCfg}
        floorTables={floorTables}
        defaultTable={defaultTable}
        waiters={waiters}
      />
      <OpenBillsPanel
        outletId={outletId}
        openBills={openBills}
        heldBills={heldBills}
        posCfg={posCfg}
        billsInStrip={posCfg.openBillMode}
      />
      <PosShiftOrdersList outletId={outletId} orders={orders} sessionRole={sessionRole} />
    </>
  );

  const mainContent = (
    <>
      {!drawerCtx && (
        <PosToolbar
          outletId={outletId}
          outletName={outletName}
          shift={shift}
          orderCount={orders.length}
          shiftTotal={shiftTotal}
          hasFloor={hasFloor}
          onlinePending={onlinePending}
          canConfigure={canConfigure}
        />
      )}

      {activePriceSchedules.length > 0 && (
        <div className="shrink-0 px-4 pt-3">
          <AlertBanner tone="info">
            Harga spesial aktif: {activePriceSchedules.map((s) => s.name).join(" · ")}
          </AlertBanner>
        </div>
      )}

      <PosAlerts searchParams={searchParams} outletId={outletId} register={register} />

      <div className="shrink-0 md:hidden">
        <AlertBanner tone="warning">
          Layar kecil terdeteksi — gunakan tablet landscape (≥768px) untuk pengalaman kasir optimal.
        </AlertBanner>
      </div>

      <ActiveOrderStrip outletId={outletId} openBills={openBills} openBillMode={posCfg.openBillMode} />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <section className="min-h-0 flex-1 overflow-y-auto px-4 py-4 lg:px-5">
          {menuEmpty ? (
            <AlertBanner tone="warning">
              Gagal memuat menu atau tidak ada produk aktif untuk outlet ini.
            </AlertBanner>
          ) : (
            <ProductGrid
              outletId={outletId}
              shiftId={shift.id}
              categories={categories}
              items={items}
              modifierMap={modifierMap}
              variantMap={variantMap}
              packages={packages}
              menuLayout={menuLayout}
              variant="v2"
              focusItemId={focusItemId}
            />
          )}
        </section>

        <aside className="hidden w-[24rem] shrink-0 flex-col gap-3 overflow-y-auto border-l border-slate-200 bg-white/80 p-4 lg:flex">
          {sidePanel}
        </aside>
      </div>

      <PosCartSheet itemCount={itemCount} cartTotalLabel={formatRp(cartTotal)}>
        <div className="space-y-3">{sidePanel}</div>
      </PosCartSheet>
    </>
  );

  if (drawerCtx) {
    return (
      <PosDrawerLayout ctx={drawerCtx} orderCount={orders.length} shiftTotal={shiftTotal}>
        <div className="flex min-h-0 flex-1 flex-col">{mainContent}</div>
      </PosDrawerLayout>
    );
  }

  return (
    <div className="pos-shell flex min-h-screen flex-col bg-surface">
      {mainContent}
    </div>
  );
}
