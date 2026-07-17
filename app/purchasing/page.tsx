import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { listPurchaseOrders, listPurchaseRequests } from "@/lib/inventory-service";
import { OWNER_PURCHASE_THRESHOLD } from "@/lib/approval";
import { PageHeader } from "@/components/PageHeader";
import { markPurchasedAction, receivePoAction } from "../inventory-actions";
import { canAccessPurchasingFeature, financeAccessForSession } from "@/lib/finance-access";

function formatRp(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { dateStyle: "medium" });
}

export default function PurchasingPage() {
  const session = getSession();
  if (!session) redirect("/login");
  if (!canAccessPurchasingFeature(session)) redirect("/dashboard");
  const financeAccess = financeAccessForSession(session);

  const orders = listPurchaseOrders();
  const requests = listPurchaseRequests().filter((r) => r.status !== "fulfilled");
  const scopeByUnit = financeAccess.areaUnit?.toLowerCase() ?? "";
  const scopedOrders = scopeByUnit
    ? orders.filter((o) => (o.areaUnit ?? "").toLowerCase() === scopeByUnit)
    : orders;
  const scopedRequests = scopeByUnit
    ? requests.filter((r) => (r.areaUnit ?? "").toLowerCase() === scopeByUnit)
    : requests;

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <PageHeader
        title="Purchasing"
        subtitle="Purchase order, request bahan, status belanja & penerimaan."
      />

      <div className="mb-4 space-y-3">
        <Link href="/inventory" className="btn-secondary text-sm">
          Lihat Stok
        </Link>
        <p className="text-xs text-slate-500">
          PO estimasi ≥ {formatRp(OWNER_PURCHASE_THRESHOLD)} wajib approval{" "}
          <strong>Owner</strong> di halaman Approval. PO di bawah threshold admin bisa proses langsung.
        </p>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
          Purchase Order ({scopedOrders.length})
        </h2>
        {scopedOrders.length === 0 ? (
          <div className="panel p-6 text-center text-sm text-slate-500">
            Belum ada PO. PO otomatis dibuat saat request bahan disetujui & stok gudang kurang.
          </div>
        ) : (
          <div className="grid gap-4">
            {scopedOrders.map((po) => (
              <div key={po.id} className="panel p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-navy-900">{po.id}</p>
                    <p className="text-xs text-slate-400">
                      {po.supplierName} · {po.outletName ?? "Gudang"} · {formatTime(po.createdAt)}
                      {po.areaUnit ? ` · ${po.areaUnit}` : ""}
                    </p>
                  </div>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-bold ${
                      po.status === "Waiting Approval"
                        ? "bg-amber-100 text-amber-900"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {po.status}
                  </span>
                </div>
                {po.status === "Waiting Approval" && (
                  <p className="mt-2 text-xs font-semibold text-amber-800">
                    Menunggu keputusan Owner —{" "}
                    <Link href="/approvals" className="underline">
                      buka Approval
                    </Link>
                  </p>
                )}
                <ul className="mt-2 text-sm text-slate-700">
                  {po.items.map((it, i) => (
                    <li key={i}>
                      {it.itemName} — {it.qty} {it.unit}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-sm font-semibold">
                  Estimasi: {formatRp(po.totalEstimated)}
                  {po.totalActual != null && ` · Aktual: ${formatRp(po.totalActual)}`}
                </p>

                {(session.role === "owner" || session.role === "admin") && po.status !== "Received" && (
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                    {po.status === "Approved" && (
                      <form action={markPurchasedAction}>
                        <input type="hidden" name="id" value={po.id} />
                        <button type="submit" className="btn-secondary px-3 py-2 text-xs">
                          Tandai Sudah Belanja
                        </button>
                      </form>
                    )}
                    {(po.status === "Approved" || po.status === "Purchased") && (
                      <form action={receivePoAction} className="flex items-end gap-2">
                        <input type="hidden" name="id" value={po.id} />
                        <input type="hidden" name="areaUnit" value={po.areaUnit ?? ""} />
                        <div>
                          <label className="text-[10px] font-bold text-slate-500">Harga aktual (Rp)</label>
                          <input
                            name="actual"
                            type="number"
                            defaultValue={po.totalEstimated}
                            className="block w-32 rounded border border-slate-200 px-2 py-1 text-sm"
                          />
                        </div>
                        <button type="submit" className="btn-primary px-3 py-2 text-xs">
                          Barang Diterima + Stok Masuk
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {scopedRequests.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
            Request Bahan (Purchasing)
          </h2>
          <div className="grid gap-2">
            {scopedRequests.map((r) => (
              <div key={r.id} className="panel p-3 text-sm">
                <span className="font-semibold">{r.itemName}</span> — {r.qty} {r.unit} ·{" "}
                {r.outletName} · <span className="text-slate-500">{r.status}</span>
                {r.areaUnit ? ` · ${r.areaUnit}` : ""}
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
