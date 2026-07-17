import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { OUTLETS } from "@/lib/mock-data";
import { POS_OUTLET_IDS } from "@/lib/pos-seed";
import { resolveLibraryOutletId } from "@/lib/portal-outlet-scope";
import { ensureChannelsReady, listSalesChannels } from "@/lib/channel-service";
import { PageHeader } from "@/components/PageHeader";
import { ChannelLibraryClient } from "@/components/library/ChannelLibraryClient";

const LIBRARY_ROLES = ["leader", "admin", "owner"];

export default function LibraryChannelsPage({
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

  ensureChannelsReady(outletId);
  const channels = listSalesChannels(outletId, true);
  const canPickOutlet = session.role === "owner" || session.role === "admin";

  const messages: Record<string, string> = {
    "channel-saved": "Channel penjualan disimpan.",
    "channel-on": "Channel diaktifkan.",
    "channel-off": "Channel dinonaktifkan.",
    "default-set": "Channel default diperbarui.",
    bootstrapped: "Channel diisi dari template default.",
    duplicate: "Nama sudah dipakai di outlet ini.",
    invalid: "Data tidak valid — cek lagi.",
    "not-found": "Data tidak ditemukan."
  };

  return (
    <main>
      <PageHeader
        title="Sales Mode / Channel"
        subtitle="Master channel penjualan per outlet — seperti ESB Core."
        backHref="/dashboard"
      />

      {canPickOutlet && (
        <div className="mb-4 flex flex-wrap gap-2">
          {fnbOutlets.map((o) => (
            <Link
              key={o.id}
              href={`/library/channels?outlet=${o.id}`}
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

      <ChannelLibraryClient outletId={outletId} channels={channels} />
    </main>
  );
}
