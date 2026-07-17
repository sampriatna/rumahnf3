import Link from "next/link";
import { redirect } from "next/navigation";
import { OUTLETS } from "@/lib/mock-data";
import { formatRp } from "@/lib/finance";
import { getOrder, getOrderBalance, countOrderPendingItems, getRegisterForShift } from "@/lib/pos-service";
import { POINT_MIN_REDEEM, POINT_REDEEM_VALUE } from "@/lib/loyalty";
import {
  addPaymentAction,
  payFullAction,
  completeZeroOrderAction,
  sendToKitchenAction,
  holdOrderAction,
  applyManualDiscountAction,
  applyPromotionAction,
  applyCashierVoucherAction,
  voidOrderItemAction,
  moveOrderTableAction
} from "../../../pos-actions";
import {
  getCustomer,
  searchCustomers,
  listActiveVouchers,
  getTier,
  tierDiscountFor
} from "@/lib/loyalty-service";
import {
  attachMemberAction,
  removeMemberAction,
  quickRegisterAction,
  applyVoucherAction,
  redeemPointsAction,
  applyTierDiscountAction
} from "../../../loyalty-actions";
import { QuickCashPanel } from "@/components/pos/quick-cash";
import { SplitEqualPanel } from "@/components/pos/split-equal";
import { requirePosSession } from "@/lib/pos-auth";
import { listActivePromotions } from "@/lib/promotion-service";
import { listCancelReasons, ensureCancelReasonsReady } from "@/lib/cancel-reason-service";
import { ensurePaymentMethodsReady, listPosPaymentMethods, paymentMethodDisplayName } from "@/lib/payment-method-service";
import { PosCancelReasonFields } from "@/components/pos/PosCancelReasonFields";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { UI_FLAGS } from "@/lib/ui-flags";
import { PosCheckoutShell } from "@/components/pos/PosCheckoutShell";
import { PaymentSummary } from "@/components/pos/PaymentSummary";

export default function PosCheckoutPage({
  params,
  searchParams
}: {
  params: { orderId: string };
  searchParams: { outlet?: string; error?: string; q?: string; ok?: string };
}) {
  const session = requirePosSession();

  const order = getOrder(params.orderId);
  if (!order) redirect("/pos");

  const outletId = searchParams.outlet ?? order.outletId ?? session.outletId;
  const outlet = OUTLETS.find((o) => o.id === outletId);
  const balance = getOrderBalance(order);
  const paid = order.payments
    .filter((p) => p.status === "captured")
    .reduce((s, p) => s + p.amount, 0);

  if (order.status === "completed") {
    redirect(`/pos?outlet=${outletId}&ok=paid&order=${order.id}`);
  }
  if (order.status === "held") {
    redirect(`/pos?outlet=${outletId}&error=${encodeURIComponent("Bill sedang hold - lanjutkan dulu dari POS.")}`);
  }

  const member = order.customerId ? getCustomer(order.customerId) : undefined;
  const memberTier = member ? getTier(member.tierId) : undefined;
  const tierDisc = member ? tierDiscountFor(member.id, order.subtotal) : { amount: 0 };
  const tierApplied = order.loyaltyProgramApplied?.startsWith("Tier");
  const memberVouchers = member ? listActiveVouchers(member.id, outletId) : [];
  const searchResults = searchParams.q ? searchCustomers(searchParams.q) : [];
  const maxRedeemPoints = member
    ? Math.min(member.totalPoints, Math.floor((order.total + POINT_REDEEM_VALUE) / POINT_REDEEM_VALUE))
    : 0;
  const canRedeemPoints = member && member.totalPoints >= POINT_MIN_REDEEM && order.total > 0;
  const pendingKitchen = countOrderPendingItems(order);
  const register = order.shiftId ? getRegisterForShift(order.shiftId) : undefined;
  const showQuickCash = register?.settings?.showQuickCash !== false;
  const activeItems = order.items.filter((it) => it.status !== "void");
  const canVoidItem =
    order.status === "open" && order.paymentStatus !== "partial" && activeItems.length > 1;
  const activePromos = listActivePromotions(outletId ?? order.outletId);
  if (outletId) ensureCancelReasonsReady(outletId);
  const itemVoidReasons = outletId ? listCancelReasons(outletId, "item") : [];
  const payOutletId = outletId ?? order.outletId;
  if (payOutletId) ensurePaymentMethodsReady(payOutletId);
  const paymentMethods = payOutletId
    ? listPosPaymentMethods(payOutletId).map((m) => ({ value: m.id, label: m.name }))
    : [{ value: "cash", label: "Tunai" }];
  const posCheckoutV2 = UI_FLAGS.posLayoutV2;

  const alerts = (
    <>
      {searchParams.error && (
        <AlertBanner tone="warning" className={posCheckoutV2 ? "" : "mt-4"}>
          {searchParams.error === "payment-method"
            ? "Metode bayar tidak aktif - atur di Library → Metode Bayar."
            : searchParams.error === "payment"
              ? "Pembayaran gagal - cek jumlah atau status order."
              : searchParams.error}
        </AlertBanner>
      )}
      {searchParams.ok === "promo-applied" && (
        <AlertBanner tone="success" className="mt-4">
          Promosi diterapkan.
          {order.appliedPromotionName && ` (${order.appliedPromotionName})`}
        </AlertBanner>
      )}
      {searchParams.ok === "voucher-applied" && (
        <AlertBanner tone="success" className="mt-4">
          Voucher kasir diterapkan.
          {order.appliedCashierVoucherCode && ` (${order.appliedCashierVoucherCode})`}
        </AlertBanner>
      )}
      {searchParams.ok === "discount" && (
        <AlertBanner tone="success" className="mt-4">
          Diskon manual diterapkan.
        </AlertBanner>
      )}
      {searchParams.ok === "kitchen-sent" && (
        <AlertBanner tone="info" className="mt-4">
          Item dikirim ke dapur.
        </AlertBanner>
      )}
      {searchParams.ok === "item-voided" && (
        <AlertBanner tone="warning" className="mt-4">
          Item di-void dari bill.
        </AlertBanner>
      )}
      {searchParams.ok === "online-order" && (
        <AlertBanner tone="info" className={posCheckoutV2 ? "" : "mt-4"}>
          Order online diterima - lanjut bayar saat rider pickup.
        </AlertBanner>
      )}
    </>
  );

  const memberPanel = (
      <div className={`${posCheckoutV2 ? "pos-panel" : "panel"} ${posCheckoutV2 ? "" : "mt-4"} p-5`}>
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Member</h2>
        {!member ? (
          <>
            <form method="get" className="mt-3 flex gap-2">
              <input type="hidden" name="outlet" value={outletId} />
              <input
                name="q"
                defaultValue={searchParams.q ?? ""}
                placeholder="Cari HP / nama / kode member"
                  className="nf3-input flex-1"
              />
              <button type="submit" className="btn-secondary px-4 text-sm">
                Cari
              </button>
            </form>

            {searchParams.q && (
              <ul className="mt-3 space-y-2">
                {searchResults.length === 0 && (
                  <li className="text-sm text-slate-500">Tidak ada member cocok.</li>
                )}
                {searchResults.map((c) => (
                  <li key={c.id}>
                    <form action={attachMemberAction} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 px-3 py-2">
                      <input type="hidden" name="orderId" value={order.id} />
                      <input type="hidden" name="outletId" value={outletId} />
                      <input type="hidden" name="customerId" value={c.id} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-navy-900">{c.fullName}</p>
                        <p className="text-xs text-slate-500">
                          {c.phone} · {c.memberCode} · {c.totalPoints} poin
                        </p>
                      </div>
                      <button type="submit" className="btn-primary px-3 py-2 text-xs">
                        Pilih
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}

            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-semibold text-navy-700">
                + Daftar member baru
              </summary>
              <form action={quickRegisterAction} className="mt-3 grid gap-2">
                <input type="hidden" name="orderId" value={order.id} />
                <input type="hidden" name="outletId" value={outletId} />
                <input
                  name="fullName"
                  required
                  placeholder="Nama lengkap"
                    className="nf3-input"
                />
                <input
                  name="phone"
                  required
                  placeholder="Nomor HP (unik)"
                    className="nf3-input"
                />
                <button type="submit" className="btn-secondary py-2.5 text-sm">
                  Daftar & Pilih
                </button>
              </form>
            </details>
          </>
        ) : (
          <div className="mt-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-black text-navy-900">
                  {member.fullName}
                  {memberTier && (
                    <span className="ml-2 rounded-full bg-navy-800 px-2 py-0.5 text-[10px] font-bold uppercase text-gold-300">
                      {memberTier.name}
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-500">
                  {member.phone} · {member.memberCode}
                </p>
              </div>
              <form action={removeMemberAction}>
                <input type="hidden" name="orderId" value={order.id} />
                <input type="hidden" name="outletId" value={outletId} />
                <button type="submit" className="text-xs font-bold text-rose-600">
                  Lepas
                </button>
              </form>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-center text-sm">
              <div className="rounded-lg bg-gold-50 p-2">
                <p className="text-xs text-slate-500">Poin</p>
                <p className="font-black text-gold-700">{member.totalPoints}</p>
              </div>
              <div className="rounded-lg bg-navy-50 p-2">
                <p className="text-xs text-slate-500">Stamp Kopi</p>
                <p className="font-black text-navy-800">{member.stamps["prog-stamp-kopi"] ?? 0}/10</p>
              </div>
            </div>

            {/* Voucher aktif */}
            {memberVouchers.length > 0 && (
              <div className="mt-3">
                <p className="mb-1 text-xs font-bold uppercase text-slate-500">Voucher Aktif</p>
                <ul className="space-y-2">
                  {memberVouchers.map((v) => (
                    <li key={v.id}>
                      <form action={applyVoucherAction} className="flex items-center justify-between gap-2 rounded-xl border border-emerald-100 bg-emerald-50/50 px-3 py-2">
                        <input type="hidden" name="orderId" value={order.id} />
                        <input type="hidden" name="outletId" value={outletId} />
                        <input type="hidden" name="voucherId" value={v.id} />
                        <span className="text-sm font-semibold text-emerald-800">
                          {v.type === "free_item"
                            ? `Gratis ${v.rewardMenuName ?? "item"}`
                            : `Diskon ${formatRp(v.discountAmount ?? 0)}`}
                          <span className="ml-1 text-xs font-normal text-slate-500">{v.code}</span>
                        </span>
                        <button type="submit" className="btn-primary px-3 py-1.5 text-xs">
                          Pakai
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Diskon tier */}
            {tierDisc.amount > 0 && !tierApplied && order.total > 0 && (
              <form action={applyTierDiscountAction} className="mt-3">
                <input type="hidden" name="orderId" value={order.id} />
                <input type="hidden" name="outletId" value={outletId} />
                <button type="submit" className="btn-secondary w-full py-2.5 text-sm">
                  Pakai Diskon {memberTier?.name} ({memberTier?.discountPercent}%) ·{" "}
                  {formatRp(tierDisc.amount)}
                </button>
              </form>
            )}

            {/* Tukar poin */}
            {canRedeemPoints && (
              <form action={redeemPointsAction} className="mt-3 flex items-end gap-2">
                <input type="hidden" name="orderId" value={order.id} />
                <input type="hidden" name="outletId" value={outletId} />
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-500">
                    Tukar poin (1 poin = {formatRp(POINT_REDEEM_VALUE)})
                  </label>
                  <input
                    name="points"
                    type="number"
                    min={POINT_MIN_REDEEM}
                    max={maxRedeemPoints}
                    step={POINT_MIN_REDEEM}
                    defaultValue={POINT_MIN_REDEEM}
                    className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
                  />
                </div>
                <button type="submit" className="btn-secondary px-4 py-2.5 text-sm">
                  Tukar
                </button>
              </form>
            )}
          </div>
        )}
      </div>
  );

  const legacyPaymentPanel = !posCheckoutV2 ? (
    <>
      <form action={holdOrderAction} className="mb-4 flex gap-2">
        <input type="hidden" name="outletId" value={outletId} />
        <input type="hidden" name="orderId" value={order.id} />
        <input type="hidden" name="returnTo" value="checkout" />
        <input
          name="reason"
          type="text"
          placeholder="Alasan hold (opsional)"
          className="nf3-input flex-1"
        />
        <button type="submit" className="btn-secondary px-4 py-2 text-sm whitespace-nowrap">
          Hold Bill
        </button>
      </form>

      <div className="mb-4 grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Total</p>
          <p className="font-black text-navy-900">{formatRp(order.total)}</p>
        </div>
        <div className="rounded-lg bg-emerald-50 p-3">
          <p className="text-xs text-slate-500">Sudah Bayar</p>
          <p className="font-black text-emerald-800">{formatRp(paid)}</p>
        </div>
        <div className="rounded-lg bg-amber-50 p-3">
          <p className="text-xs text-slate-500">Sisa</p>
          <p className="font-black text-amber-900">{formatRp(balance)}</p>
        </div>
      </div>

      {order.payments.length > 0 && (
        <div className="mb-4">
          <p className="mb-1 text-xs font-bold uppercase text-slate-500">Pembayaran</p>
          <ul className="space-y-1 text-sm">
            {order.payments.map((p) => (
              <li key={p.id} className="flex justify-between text-slate-700">
                <span className="uppercase">
                  {payOutletId ? paymentMethodDisplayName(payOutletId, p.method) : p.method}
                </span>
                <span>{formatRp(p.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {pendingKitchen > 0 && (
        <form action={sendToKitchenAction} className="mb-4">
          <input type="hidden" name="outletId" value={outletId} />
          <input type="hidden" name="orderId" value={order.id} />
          <input type="hidden" name="returnTo" value="checkout" />
          <button type="submit" className="btn-secondary w-full py-3 text-sm">
            Kirim Dapur ({pendingKitchen} item baru)
          </button>
        </form>
      )}

      {balance > 0 ? (
        <>
          {showQuickCash && (
            <QuickCashPanel
              balance={balance}
              outletId={outletId ?? order.outletId}
              orderId={order.id}
              payAction={payFullAction}
            />
          )}

          <p className="mb-2 text-sm font-bold text-navy-900">
            {showQuickCash ? "Bayar penuh (metode lain)" : "Bayar penuh (1 metode)"}
          </p>
          <div className="mb-6 grid grid-cols-2 gap-2">
            {paymentMethods
              .filter((m) => (showQuickCash ? m.value !== "cash" : true))
              .slice(0, 6)
              .map((m) => (
                <form key={m.value} action={payFullAction}>
                  <input type="hidden" name="outletId" value={outletId} />
                  <input type="hidden" name="orderId" value={order.id} />
                  <input type="hidden" name="method" value={m.value} />
                  <button type="submit" className="btn-primary w-full py-3 text-sm">
                    {m.label} {formatRp(balance)}
                  </button>
                </form>
              ))}
          </div>

          <p className="mb-2 text-sm font-bold text-navy-900">Split payment (sebagian)</p>
          <form action={addPaymentAction} className="grid gap-3">
            <input type="hidden" name="outletId" value={outletId} />
            <input type="hidden" name="orderId" value={order.id} />
            <select name="method" className="nf3-select px-4 py-3 text-base">
              {paymentMethods.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <input
              name="amount"
              type="number"
              required
              min={1}
              max={balance}
              defaultValue={balance}
              className="nf3-input px-4 py-3 text-base"
            />
            <input
              name="reference"
              type="text"
              placeholder="No. referensi (opsional)"
              className="nf3-input px-4 py-3"
            />
            <button type="submit" className="btn-secondary w-full py-3 text-base">
              Tambah Pembayaran
            </button>
          </form>
        </>
      ) : (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          Order bernilai Rp0 (100% reward). Selesaikan untuk catat stok & loyalty.
          <form action={completeZeroOrderAction} className="mt-2">
            <input type="hidden" name="outletId" value={outletId} />
            <input type="hidden" name="orderId" value={order.id} />
            <button type="submit" className="btn-primary w-full py-3 text-sm">
              Selesaikan Order
            </button>
          </form>
        </div>
      )}
    </>
  ) : null;

  const orderDetailsPanel = (
      <div className={`${posCheckoutV2 ? "pos-panel" : "panel"} ${posCheckoutV2 ? "" : "mt-4"} p-6`}>
        <h1 className={`${posCheckoutV2 ? "text-lg" : "text-xl"} font-black text-navy-900`}>
          {posCheckoutV2 ? "Detail Pesanan" : "Bayar Order"}
        </h1>
        <p className="text-sm text-slate-600">
          {order.orderNumber} · {outlet?.name}
          {order.tableLabel && ` · Meja ${order.tableLabel}`}
          {order.externalOrderId && ` · ${order.externalPlatform?.toUpperCase()} ${order.externalOrderId}`}
        </p>
        {order.status === "open" && order.tableLabel && order.paymentStatus !== "partial" && (
          <form action={moveOrderTableAction} className="mt-3 flex flex-wrap items-end gap-2">
            <input type="hidden" name="outletId" value={outletId} />
            <input type="hidden" name="orderId" value={order.id} />
            <input
              name="newTableLabel"
              placeholder="Pindah ke meja…"
                className="nf3-input"
            />
            <button type="submit" className="btn-secondary px-3 py-2 text-xs">
              Pindah Meja
            </button>
          </form>
        )}
        {!posCheckoutV2 && order.status === "open" && order.items.length >= 2 && order.paymentStatus !== "partial" && (
          <Link
            href={`/pos/split/${order.id}?outlet=${outletId}`}
            className="mt-2 inline-block text-xs font-bold text-navy-700 underline"
          >
            Split bill →
          </Link>
        )}

        <ul className="my-4 space-y-3 border-y border-slate-100 py-4 text-sm">
          {order.items.map((it) => (
            <li key={it.id} className={it.status === "void" ? "opacity-50" : ""}>
              <div className="flex justify-between gap-2">
                <span>
                  {it.qty}× {it.nameSnapshot}
                  {it.status === "void" && (
                    <span className="ml-1 text-xs font-bold text-red-600">VOID</span>
                  )}
                  {it.modifiersSnapshot.length > 0 && (
                    <span className="block text-xs text-slate-500">
                      {it.modifiersSnapshot.map((m) => m.name).join(", ")}
                    </span>
                  )}
                </span>
                {it.isRewardItem ? (
                  <span className="text-xs font-bold text-emerald-700">
                    GRATIS{" "}
                    <span className="font-normal text-slate-400 line-through">
                      {formatRp(it.normalPrice ?? 0)}
                    </span>
                  </span>
                ) : (
                  <span className="font-semibold">{formatRp(it.lineTotal)}</span>
                )}
              </div>
              {canVoidItem && it.status !== "void" && !it.isRewardItem && (
                <details className="mt-1">
                  <summary className="cursor-pointer text-xs font-bold text-red-700">Void item</summary>
                  <form action={voidOrderItemAction} className="mt-2 grid gap-2 rounded-lg bg-red-50 p-3">
                    <input type="hidden" name="outletId" value={outletId} />
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="itemId" value={it.id} />
                    <PosCancelReasonFields reasons={itemVoidReasons} notePlaceholder="Catatan (opsional)" />
                    <input
                      name="pin"
                      type="password"
                      inputMode="numeric"
                      required
                      placeholder="PIN leader"
                      className="rounded-lg border border-red-200 px-3 py-2 text-xs"
                    />
                    <button type="submit" className="rounded-lg bg-red-700 px-3 py-2 text-xs font-bold text-white">
                      Konfirmasi Void
                    </button>
                  </form>
                </details>
              )}
            </li>
          ))}
        </ul>

        {!posCheckoutV2 && balance > 0 && activeItems.length >= 2 && (
          <SplitEqualPanel total={balance} />
        )}

        {(order.discountAmount ?? 0) > 0 && (
          <div className="mb-3 space-y-1 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatRp(order.subtotal)}</span>
            </div>
            {(order.totalManualDiscount ?? 0) > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Diskon manual</span>
                <span>− {formatRp(order.totalManualDiscount ?? 0)}</span>
              </div>
            )}
            {((order.totalLoyaltyDiscount ?? 0) + (order.totalVoucherDiscount ?? 0)) > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Diskon member</span>
                <span>
                  − {formatRp((order.totalLoyaltyDiscount ?? 0) + (order.totalVoucherDiscount ?? 0))}
                </span>
              </div>
            )}
            {(order.totalCashierVoucherDiscount ?? 0) > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>
                  Voucher kasir
                  {order.appliedCashierVoucherCode && (
                    <span className="ml-1 font-mono text-xs text-slate-500">
                      ({order.appliedCashierVoucherCode})
                    </span>
                  )}
                </span>
                <span>− {formatRp(order.totalCashierVoucherDiscount ?? 0)}</span>
              </div>
            )}
          </div>
        )}

        <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="mb-2 text-xs font-bold uppercase text-slate-500">Voucher kasir (kode)</p>
          {order.appliedCashierVoucherId ? (
            <p className="text-sm font-semibold text-emerald-800">
              Sudah dipakai: {order.appliedCashierVoucherName}{" "}
              <span className="font-mono text-xs text-slate-500">({order.appliedCashierVoucherCode})</span>
            </p>
          ) : (
            <form action={applyCashierVoucherAction} className="flex gap-2">
              <input type="hidden" name="outletId" value={outletId} />
              <input type="hidden" name="orderId" value={order.id} />
              <input
                name="code"
                required
                placeholder="KBU10K, KSM5K, …"
                className="nf3-input min-w-0 flex-1 font-mono uppercase"
              />
              <button type="submit" className="btn-primary shrink-0 px-4 py-2 text-sm">
                Pakai
              </button>
            </form>
          )}
          <p className="mt-2 text-xs text-slate-500">
            Non-member - kelola master di Library → Voucher Kasir.
          </p>
        </div>

        <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="mb-2 text-xs font-bold uppercase text-slate-500">Promosi master</p>
          {order.appliedPromotionId ? (
            <p className="text-sm font-semibold text-emerald-800">
              Sudah dipakai: {order.appliedPromotionName}
            </p>
          ) : activePromos.length === 0 ? (
            <p className="text-sm text-slate-500">Tidak ada promosi aktif - kelola di Library → Promosi.</p>
          ) : (
            <ul className="space-y-2">
              {activePromos.map((promo) => (
                <li key={promo.id}>
                  <form action={applyPromotionAction} className="flex items-center justify-between gap-2">
                    <input type="hidden" name="outletId" value={outletId} />
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="promoId" value={promo.id} />
                    <span className="text-sm font-semibold text-navy-900">
                      {promo.name}
                      {promo.code && <span className="ml-1 font-mono text-xs text-slate-500">({promo.code})</span>}
                    </span>
                    <button type="submit" className="btn-secondary px-3 py-1.5 text-xs">
                      Pakai
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="mb-2 text-xs font-bold uppercase text-slate-500">Diskon manual (PIN leader)</p>
          <form action={applyManualDiscountAction} className="grid gap-2">
            <input type="hidden" name="outletId" value={outletId} />
            <input type="hidden" name="orderId" value={order.id} />
            <div className="grid grid-cols-2 gap-2">
              <input
                name="amount"
                type="number"
                min={0}
                placeholder="Nominal (Rp)"
                className="nf3-input"
              />
              <input
                name="percent"
                type="number"
                min={0}
                max={100}
                placeholder="% diskon"
                className="nf3-input"
              />
            </div>
            <input
              name="note"
              type="text"
              placeholder="Catatan (opsional)"
              className="nf3-input"
            />
            <input
              name="pin"
              type="password"
              inputMode="numeric"
              required
              placeholder="PIN leader"
              className="nf3-input"
            />
            <button type="submit" className="btn-secondary py-2 text-sm">
              Terapkan Diskon
            </button>
          </form>
        </div>

        {legacyPaymentPanel}
      </div>
  );

  if (posCheckoutV2) {
    return (
      <PosCheckoutShell
        outletId={outletId!}
        outletName={outlet?.name ?? ""}
        order={order}
      >
        <div className="mx-auto max-w-6xl space-y-4">
          {alerts}
          <div className="grid gap-4 lg:grid-cols-5">
            <div className="space-y-4 lg:col-span-3">
              {memberPanel}
              {orderDetailsPanel}
            </div>
            <div className="lg:col-span-2 lg:sticky lg:top-4 lg:self-start">
              <PaymentSummary
                order={order}
                outletId={outletId!}
                balance={balance}
                paid={paid}
                paymentMethods={paymentMethods}
                showQuickCash={showQuickCash}
                payOutletId={payOutletId!}
                pendingKitchen={pendingKitchen}
                activeItemCount={activeItems.length}
              />
            </div>
          </div>
        </div>
      </PosCheckoutShell>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-5 py-8">
      <Link href={`/pos?outlet=${outletId}`} className="text-sm font-bold text-navy-700">
        ← Kembali ke POS
      </Link>
      {alerts}
      {memberPanel}
      {orderDetailsPanel}
    </main>
  );
}
