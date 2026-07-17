import Link from "next/link";
import { redirect } from "next/navigation";
import { ShoppingCart, Banknote } from "lucide-react";
import { OUTLETS } from "@/lib/mock-data";
import { formatRp } from "@/lib/finance";
import { isPosOutlet, POS_OUTLET_IDS } from "@/lib/pos-seed";
import { getPosOutletConfig } from "@/lib/pos-outlet-config";
import { listSalesChannels, ensureChannelsReady } from "@/lib/channel-service";
import { ensurePaymentMethodsReady } from "@/lib/payment-method-service";
import { listActivePriceSchedulesNow } from "@/lib/price-schedule-service";
import {
  ensurePosMenuLayoutsReady,
  getActivePosMenuLayout,
  applyPosMenuLayout
} from "@/lib/pos-menu-layout-service";
import { UI_FLAGS } from "@/lib/ui-flags";
import { buildPosDrawerContext } from "@/lib/pos-drawer-context";
import { getStoreDayState, isStoreClosedForDay } from "@/lib/pos-store-day";
import { getFloorTables, hasFloorPlan } from "@/lib/pos-floor";
import {
  getOpenShift,
  getCart,
  getMenuForOutlet,
  getRegisters,
  getRegisterForShift,
  listShiftOrders,
  listOpenBills,
  listHeldBills,
  countOrderPendingItems,
  getShiftSummary,
  listPackagesForOutlet,
  getModifiersForItem,
  getVariantsForItem,
  listOnlinePendingOrders
} from "@/lib/pos-service";
import { packageComponentSummary } from "@/lib/package-service";
import { PosMenuGrid } from "@/components/pos/PosMenuGrid";
import { PosShell } from "@/components/pos/PosShell";
import { PosOpenShiftScreen } from "@/components/pos/PosOpenShiftScreen";
import { PosStoreClosedScreen } from "@/components/pos/PosStoreClosedScreen";
import { PosOutletPicker } from "@/components/pos/PosOutletPicker";
import { PosPaidEffects } from "@/components/pos/pos-paid-effects";
import { PosExitLink } from "@/components/pos/PosExitLink";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { requirePosSession } from "@/lib/pos-auth";
import { listPosWaiters } from "@/lib/pos-waiter-service";
import {
  openShiftAction,
  updateCartQtyAction,
  clearCartAction,
  createOrderAction,
  addToOpenBillAction,
  sendToKitchenAction,
  holdOrderAction,
  resumeOrderAction
} from "../pos-actions";

export default async function PosPage({
  searchParams
}: {
  searchParams: { outlet?: string; ok?: string; error?: string; order?: string; table?: string; item?: string };
}) {
  const session = requirePosSession();

  const outletId =
    searchParams.outlet && (session.role === "owner" || session.role === "admin")
      ? searchParams.outlet
      : session.outletId ?? searchParams.outlet;

  if (!outletId || !isPosOutlet(outletId)) {
    if (session.role === "owner" || session.role === "admin") {
      return UI_FLAGS.posLayoutV2 ? <PosOutletPicker /> : (
        <main className="mx-auto max-w-lg px-5 py-12">
          <h1 className="text-2xl font-black text-navy-900">POS Kasir</h1>
          <p className="mt-2 text-slate-600">Pilih outlet F&B untuk mulai shift.</p>
          <div className="mt-6 grid gap-3">
            {OUTLETS.filter((o) => POS_OUTLET_IDS.has(o.id)).map((o) => (
              <Link key={o.id} href={`/pos?outlet=${o.id}`} className="btn-primary py-4 text-base">
                {o.name}
              </Link>
            ))}
          </div>
        </main>
      );
    }
    redirect("/pos/login?error=no-outlet");
  }

  const outlet = OUTLETS.find((o) => o.id === outletId)!;
  const posCfg = getPosOutletConfig(outletId);
  ensureChannelsReady(outletId);
  ensurePaymentMethodsReady(outletId);
  const channels = listSalesChannels(outletId);
  const shift = getOpenShift(outletId);
  const registers = getRegisters(outletId);

  if (!shift) {
    const defaultRegister = registers[0];
    const defaultFloat = defaultRegister?.settings?.defaultOpeningFloat ?? 500_000;
    const useDrawerNav = UI_FLAGS.posLayoutV2 && UI_FLAGS.posDrawerNavV1;
    const storeDay = getStoreDayState(outletId);
    const canOpenStore = ["leader", "admin", "owner"].includes(session.role);

    if (isStoreClosedForDay(outletId)) {
      const drawerCtx = useDrawerNav
        ? buildPosDrawerContext({
            session,
            outletId,
            outletName: outlet.name,
            shift: null,
            register: defaultRegister,
            hasFloor: hasFloorPlan(outletId)
          })
        : undefined;
      return (
        <PosStoreClosedScreen
          outletId={outletId}
          outletName={outlet.name}
          closedBy={storeDay.closedBy}
          closedAt={storeDay.closedAt}
          canOpenStore={canOpenStore}
          drawerCtx={drawerCtx}
        />
      );
    }

    if (UI_FLAGS.posLayoutV2) {
      const drawerCtx = useDrawerNav
        ? buildPosDrawerContext({
            session,
            outletId,
            outletName: outlet.name,
            shift: null,
            register: defaultRegister,
            hasFloor: hasFloorPlan(outletId)
          })
        : undefined;
      return (
        <PosOpenShiftScreen
          outletId={outletId}
          outletName={outlet.name}
          registerId={defaultRegister?.id ?? ""}
          defaultFloat={defaultFloat}
          drawerCtx={drawerCtx}
        />
      );
    }
    return (
      <main className="mx-auto max-w-md px-5 py-10">
        <PosExitLink className="text-sm font-bold text-navy-700" />
        <div className="mt-6 panel p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-800 text-gold-400">
              <Banknote className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <h1 className="text-xl font-black text-navy-900">Buka Shift</h1>
              <p className="text-sm text-slate-600">{outlet.name}</p>
            </div>
          </div>
          <form action={openShiftAction} className="grid gap-4">
            <input type="hidden" name="outletId" value={outletId} />
            <input type="hidden" name="registerId" value={defaultRegister?.id ?? ""} />
            <div>
              <label className="text-xs font-bold text-slate-500">Shift</label>
              <select
                name="shiftLabel"
                className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-3 text-base font-semibold"
              >
                <option value="Pagi">Pagi</option>
                <option value="Siang">Siang</option>
                <option value="Malam">Malam</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500">Modal Awal Laci (Rp)</label>
              <input
                name="openingFloat"
                type="number"
                defaultValue={defaultFloat}
                min={0}
                className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-3 text-base"
              />
            </div>
            <button type="submit" className="btn-primary py-4 text-base">
              Mulai Shift Kasir
            </button>
          </form>
        </div>
      </main>
    );
  }

  const { categories, items } = getMenuForOutlet(outletId);
  ensurePosMenuLayoutsReady(outletId);
  const menuLayout = applyPosMenuLayout(
    categories,
    items,
    getActivePosMenuLayout(outletId)
  );
  const modifierMap = Object.fromEntries(
    items.map((item) => [item.id, getModifiersForItem(item.id)])
  );
  const variantMap = Object.fromEntries(
    items.map((item) => [item.id, getVariantsForItem(item.id)])
  );
  const packages = listPackagesForOutlet(outletId).map((pkg) => ({
    ...pkg,
    summary: packageComponentSummary(pkg.id)
  }));
  const cart = getCart(shift.id);
  const cartTotal = cart.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const orders = listShiftOrders(shift.id);
  const openBills = listOpenBills(shift.id);
  const heldBills = listHeldBills(shift.id);
  const summary = getShiftSummary(shift.id)!;
  const register = getRegisterForShift(shift.id);
  const canConfigure = ["leader", "admin", "owner"].includes(session.role);
  const onlinePending = listOnlinePendingOrders(shift.id).length;
  const activePriceSchedules = listActivePriceSchedulesNow(outletId);

  const floorTables = getFloorTables(outletId);
  const menuEmpty = categories.length === 0 && items.length === 0;
  const waiters = await listPosWaiters(outletId);
  const useDrawerNav = UI_FLAGS.posLayoutV2 && UI_FLAGS.posDrawerNavV1;
  const drawerCtx = useDrawerNav
    ? buildPosDrawerContext({
        session,
        outletId,
        outletName: outlet.name,
        shift,
        register,
        onlinePending,
        hasFloor: hasFloorPlan(outletId)
      })
    : undefined;

  if (UI_FLAGS.posLayoutV2) {
    return (
      <PosShell
        outletId={outletId}
        outletName={outlet.name}
        shift={shift}
        sessionRole={session.role}
        searchParams={searchParams}
        register={register}
        posCfg={posCfg}
        channels={channels}
        cart={cart}
        cartTotal={cartTotal}
        orders={orders}
        openBills={openBills}
        heldBills={heldBills}
        shiftTotal={summary.shift.systemGrandTotal ?? 0}
        onlinePending={onlinePending}
        hasFloor={hasFloorPlan(outletId)}
        canConfigure={canConfigure}
        activePriceSchedules={activePriceSchedules}
        categories={categories}
        items={items}
        modifierMap={modifierMap}
        variantMap={variantMap}
        packages={packages}
        menuLayout={menuLayout}
        floorTables={floorTables}
        defaultTable={searchParams.table}
        menuEmpty={menuEmpty}
        waiters={waiters}
        focusItemId={searchParams.item}
        drawerCtx={drawerCtx}
      />
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-4 pb-24">
      {activePriceSchedules.length > 0 && (
        <AlertBanner tone="info">
          Harga spesial aktif: {activePriceSchedules.map((s) => s.name).join(" · ")}
        </AlertBanner>
      )}
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <PosExitLink className="text-xs font-bold text-navy-700" />
          <h1 className="text-xl font-black text-navy-900">POS · {outlet.name}</h1>
          <p className="text-sm text-slate-600">
            Shift {shift.shiftLabel} · {orders.length} order · Total{" "}
            {formatRp(summary.shift.systemGrandTotal ?? 0)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasFloorPlan(outletId) && (
            <Link href={`/pos/floor?outlet=${outletId}`} className="btn-secondary px-4 py-2 text-sm">
              Denah Meja
            </Link>
          )}
          <Link href={`/kds?outlet=${outletId}`} className="btn-secondary px-4 py-2 text-sm">
            KDS
          </Link>
          <Link href={`/pos/drawer?outlet=${outletId}&shift=${shift.id}`} className="btn-secondary px-4 py-2 text-sm">
            Laci Kas
          </Link>
          <Link href={`/pos/online?outlet=${outletId}`} className="btn-secondary px-4 py-2 text-sm">
            Online{onlinePending > 0 ? ` (${onlinePending})` : ""}
          </Link>
          <Link href={`/pos/reports?outlet=${outletId}`} className="btn-secondary px-4 py-2 text-sm">
            Laporan
          </Link>
          {canConfigure && (
            <Link
              href={`/pos/settings?outlet=${outletId}`}
              className="btn-secondary px-4 py-2 text-sm"
            >
              Pengaturan
            </Link>
          )}
          <Link href={`/pos/close?outlet=${outletId}&shift=${shift.id}`} className="btn-secondary px-4 py-2 text-sm">
            Tutup Shift
          </Link>
        </div>
      </header>

      {searchParams.ok === "paid" && searchParams.order && (
        <>
          <PosPaidEffects
            orderId={searchParams.order}
            outletId={outletId}
            autoPrint={
              register?.settings?.autoPrintReceipt !== false &&
              register?.settings?.receiptPrinterMode !== "none"
            }
            copies={register?.settings?.receiptCopies}
          />
          <div className="mb-4 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <p className="font-semibold">Pembayaran berhasil - kas dan stok outlet tercatat.</p>
            <Link
              href={`/pos/receipt/${searchParams.order}?outlet=${outletId}`}
              className="mt-2 inline-block font-bold text-navy-800 underline"
            >
              Cetak ulang struk
            </Link>
          </div>
        </>
      )}
      {searchParams.ok === "paid" && !searchParams.order && (
        <AlertBanner tone="success">
          Pembayaran berhasil. Order selesai - kas dan stok outlet tercatat otomatis.
        </AlertBanner>
      )}
      {searchParams.ok === "bill-saved" && (
        <AlertBanner tone="success">
          Item ditambahkan ke bill meja. Tambah lagi atau kirim ke dapur / bayar.
        </AlertBanner>
      )}
      {searchParams.ok === "kitchen-sent" && (
        <AlertBanner tone="info">
          Order dikirim ke KDS - dapur/bar mulai proses.
        </AlertBanner>
      )}
      {searchParams.ok === "held" && (
        <AlertBanner tone="warning">
          Bill ditahan. Lanjutkan dari daftar Hold Bill.
        </AlertBanner>
      )}
      {searchParams.ok === "resumed" && (
        <AlertBanner tone="success">
          Bill dilanjutkan - siap tambah item atau bayar.
        </AlertBanner>
      )}
      {searchParams.ok === "split" && (
        <AlertBanner tone="info">
          Bill di-split - ada 2 bill terpisah siap bayar.
        </AlertBanner>
      )}
      {searchParams.ok === "merged" && (
        <AlertBanner tone="info">
          Bill digabung ke satu meja.
        </AlertBanner>
      )}
      {searchParams.ok === "shift-closed" && (
        <AlertBanner tone="info">
          Shift ditutup. Setoran kasir dikirim ke approval leader.
        </AlertBanner>
      )}
      {searchParams.ok === "voided" && (
        <AlertBanner tone="danger">
          Order di-void. Kas, stok (bila dipilih) & loyalty sudah dikoreksi.
        </AlertBanner>
      )}
      {searchParams.error &&
        !(shift && searchParams.error === "Shift masih terbuka.") && (
        <AlertBanner tone="warning">{searchParams.error}</AlertBanner>
      )}
      {searchParams.error === "empty-cart" && (
        <AlertBanner tone="warning">Keranjang kosong - tambah menu dulu.</AlertBanner>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <PosMenuGrid
            outletId={outletId}
            shiftId={shift.id}
            categories={categories}
            items={items}
            modifierMap={modifierMap}
            variantMap={variantMap}
            packages={packages}
            menuLayout={menuLayout}
          />
        </section>

        <aside className="lg:sticky lg:top-4 lg:self-start">
          <div className="panel p-4">
            <div className="mb-3 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-navy-800" aria-hidden />
              <h2 className="font-bold text-navy-900">Keranjang</h2>
              <span className="ml-auto rounded-full bg-navy-800 px-2 py-0.5 text-xs font-bold text-white">
                {cart.reduce((s, l) => s + l.qty, 0)}
              </span>
            </div>

            {cart.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">Tap menu untuk tambah item</p>
            ) : (
              <>
                <ul className="mb-4 max-h-64 space-y-2 overflow-y-auto">
                  {cart.map((line) => (
                    <li key={line.lineId} className="flex items-center gap-2 border-b border-slate-50 pb-2 text-sm">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-navy-900">{line.name}</p>
                        <p className="text-xs text-slate-500">{formatRp(line.unitPrice)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <form action={updateCartQtyAction}>
                          <input type="hidden" name="outletId" value={outletId} />
                          <input type="hidden" name="shiftId" value={shift.id} />
                          <input type="hidden" name="lineId" value={line.lineId} />
                          <input type="hidden" name="qty" value={line.qty - 1} />
                          <button
                            type="submit"
                            className="pos-touch-btn flex h-10 w-10 items-center justify-center bg-slate-100"
                          >
                            −
                          </button>
                        </form>
                        <span className="w-6 text-center font-bold">{line.qty}</span>
                        <form action={updateCartQtyAction}>
                          <input type="hidden" name="outletId" value={outletId} />
                          <input type="hidden" name="shiftId" value={shift.id} />
                          <input type="hidden" name="lineId" value={line.lineId} />
                          <input type="hidden" name="qty" value={line.qty + 1} />
                          <button
                            type="submit"
                            className="pos-touch-btn flex h-10 w-10 items-center justify-center bg-slate-100"
                          >
                            +
                          </button>
                        </form>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="mb-3 text-right text-lg font-black text-navy-900">{formatRp(cartTotal)}</p>
                <form action={clearCartAction} className="mb-2">
                  <input type="hidden" name="outletId" value={outletId} />
                  <input type="hidden" name="shiftId" value={shift.id} />
                  <button type="submit" className="btn-secondary w-full py-2 text-xs">
                    Kosongkan
                  </button>
                </form>

                {posCfg.openBillMode ? (
                  <form action={addToOpenBillAction} className="grid gap-2 border-t border-slate-100 pt-3">
                    <input type="hidden" name="outletId" value={outletId} />
                    <input type="hidden" name="shiftId" value={shift.id} />
                    <input type="hidden" name="channel" value={posCfg.defaultChannel} />
                    <input
                      name="tableLabel"
                      type="text"
                      required={posCfg.requireTable}
                      defaultValue={searchParams.table ?? ""}
                      placeholder={posCfg.requireTable ? "No. meja (wajib)" : "Meja / catatan"}
                      className="nf3-input font-semibold"
                    />
                    <label className="flex items-center gap-2 text-xs text-slate-600">
                      <input type="checkbox" name="sendKitchen" className="rounded" />
                      Langsung kirim ke dapur
                    </label>
                    <button type="submit" className="btn-primary w-full py-4 text-base">
                      Simpan ke Bill
                    </button>
                  </form>
                ) : (
                  <form action={createOrderAction} className="grid gap-2 border-t border-slate-100 pt-3">
                    <input type="hidden" name="outletId" value={outletId} />
                    <input type="hidden" name="shiftId" value={shift.id} />
                    <select
                      name="channel"
                      defaultValue={posCfg.defaultChannel}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    >
                      {channels.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <input
                      name="tableLabel"
                      type="text"
                      placeholder="Catatan order (opsional)"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                    <button type="submit" className="btn-primary w-full py-4 text-base">
                      Lanjut Bayar
                    </button>
                  </form>
                )}
              </>
            )}
          </div>

          {posCfg.openBillMode && openBills.length > 0 && (
            <div className="panel mt-4 p-4">
              <h3 className="mb-2 text-xs font-bold uppercase text-slate-500">Bill Terbuka</h3>
              <ul className="space-y-2 text-sm">
                {openBills.map((o) => {
                  const pending = countOrderPendingItems(o);
                  return (
                    <li
                      key={o.id}
                      className="rounded-lg border border-slate-100 px-3 py-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-navy-900">
                            Meja {o.tableLabel ?? "Tanpa nomor"} · {o.orderNumber}
                          </p>
                          <p className="text-xs text-slate-500">
                            {o.items.length} item · {formatRp(o.total)}
                            {pending > 0 && (
                              <span className="ml-1 font-semibold text-amber-700">
                                · {pending} belum ke dapur
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {pending > 0 && (
                          <form action={sendToKitchenAction}>
                            <input type="hidden" name="outletId" value={outletId} />
                            <input type="hidden" name="orderId" value={o.id} />
                            <button type="submit" className="btn-secondary px-3 py-1.5 text-xs">
                              Kirim Dapur
                            </button>
                          </form>
                        )}
                        <Link
                          href={`/pos/checkout/${o.id}?outlet=${outletId}`}
                          className="btn-primary px-3 py-1.5 text-xs"
                        >
                          Bayar
                        </Link>
                        <Link
                          href={`/pos/split/${o.id}?outlet=${outletId}`}
                          className="btn-secondary px-3 py-1.5 text-xs"
                        >
                          Split
                        </Link>
                        <form action={holdOrderAction}>
                          <input type="hidden" name="outletId" value={outletId} />
                          <input type="hidden" name="orderId" value={o.id} />
                          <button type="submit" className="btn-secondary px-3 py-1.5 text-xs">
                            Hold
                          </button>
                        </form>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {posCfg.openBillMode && heldBills.length > 0 && (
            <div className="panel mt-4 p-4">
              <h3 className="mb-2 text-xs font-bold uppercase text-slate-500">Hold Bill</h3>
              <ul className="space-y-2 text-sm">
                {heldBills.map((o) => (
                  <li key={o.id} className="rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-2">
                    <p className="font-bold text-navy-900">
                      Meja {o.tableLabel ?? "Tanpa nomor"} · {o.orderNumber}
                    </p>
                    <p className="text-xs text-slate-600">
                      {formatRp(o.total)}
                      {o.holdReason && ` · ${o.holdReason}`}
                    </p>
                    <form action={resumeOrderAction} className="mt-2">
                      <input type="hidden" name="outletId" value={outletId} />
                      <input type="hidden" name="orderId" value={o.id} />
                      <button type="submit" className="btn-primary px-3 py-1.5 text-xs">
                        Lanjutkan
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {orders.length > 0 && (
            <div className="panel mt-4 p-4">
              <h3 className="mb-2 text-xs font-bold uppercase text-slate-500">Order Shift Ini</h3>
              <ul className="space-y-1 text-sm">
                {orders.slice(0, 8).map((o) => {
                  const canVoid =
                    ["leader", "admin", "owner"].includes(session.role) && o.status === "completed";
                  const canReprint = o.status === "completed";
                  return (
                    <li key={o.id} className="flex justify-between gap-2">
                      <span className="font-semibold text-navy-900">{o.orderNumber}</span>
                      <span className="flex items-center gap-2 text-slate-600">
                        {formatRp(o.total)} ·{" "}
                        <span className={o.status === "void" ? "text-rose-600" : o.status === "merged" ? "text-slate-400" : ""}>
                          {o.status}
                        </span>
                        {canReprint && (
                          <Link
                            href={`/pos/receipt/${o.id}?outlet=${outletId}`}
                            className="text-xs font-bold text-navy-700 hover:underline"
                          >
                            Struk
                          </Link>
                        )}
                        {canVoid && (
                          <Link
                            href={`/pos/void/${o.id}?outlet=${outletId}`}
                            className="text-xs font-bold text-rose-600 hover:underline"
                          >
                            Void
                          </Link>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
