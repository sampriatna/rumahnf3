import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { OUTLETS } from "@/lib/mock-data";
import { PageHeader } from "@/components/PageHeader";
import { isPosOutlet, POS_OUTLET_IDS } from "@/lib/pos-seed";
import { getRegisters } from "@/lib/pos-service";
import { updateRegisterSettingsAction } from "./actions";

const VIEW_ROLES = ["owner", "admin", "leader"];

function RegisterSettingsForm({
  outletId,
  register,
  returnTo
}: {
  outletId: string;
  register: ReturnType<typeof getRegisters>[number];
  returnTo: "settings" | "pos";
}) {
  const s = register.settings!;

  return (
    <form action={updateRegisterSettingsAction} className="panel mb-6 space-y-4 p-5">
      <input type="hidden" name="outletId" value={outletId} />
      <input type="hidden" name="registerId" value={register.id} />
      <input type="hidden" name="returnTo" value={returnTo} />

      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-bold text-navy-900">{register.code}</h3>
          <p className="text-xs text-slate-500">ID: {register.id}</p>
        </div>
        <Link
          href={`/pos/receipt/preview?registerId=${register.id}&outlet=${outletId}`}
          target="_blank"
          className="btn-secondary px-3 py-2 text-xs"
        >
          Test Cetak Struk
        </Link>
      </div>

      <div>
        <label className="text-xs font-bold text-slate-500">Nama kasir / counter</label>
        <input
          name="name"
          defaultValue={register.name}
          required
          className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-bold text-slate-500">Mode printer struk</label>
          <select
            name="receiptPrinterMode"
            defaultValue={s.receiptPrinterMode}
            className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="browser">Browser / tablet — cetak lewat dialog OS</option>
            <option value="none">Tanpa cetak otomatis</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500">Lebar kertas</label>
          <select
            name="paperWidthMm"
            defaultValue={String(s.paperWidthMm)}
            className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="58">58 mm (kecil)</option>
            <option value="80">80 mm (standar)</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-bold text-slate-500">Nama printer (Windows/OS)</label>
          <input
            name="printerName"
            defaultValue={s.printerName ?? ""}
            placeholder="EPSON TM-T82 Receipt"
            className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500">IP / host printer (opsional)</label>
          <input
            name="printerHost"
            defaultValue={s.printerHost ?? ""}
            placeholder="192.168.1.100"
            className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-bold text-slate-500">Jumlah copy struk</label>
          <select
            name="receiptCopies"
            defaultValue={String(s.receiptCopies)}
            className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="1">1 copy</option>
            <option value="2">2 copy</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500">Modal awal default (Rp)</label>
          <input
            name="defaultOpeningFloat"
            type="number"
            min={0}
            step={10000}
            defaultValue={s.defaultOpeningFloat}
            className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="autoPrintReceipt" defaultChecked={s.autoPrintReceipt} />
          Auto-cetak struk setelah bayar
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="showQuickCash" defaultChecked={s.showQuickCash} />
          Tampilkan Quick Cash di checkout
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="autoPrintKitchen" defaultChecked={s.autoPrintKitchen} />
          Auto-cetak KOT (browser) — eksperimental
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" name="openDrawerOnCash" defaultChecked={s.openDrawerOnCash} />
          Buka laci saat terima cash (perlu printer thermal)
        </label>
      </div>

      <div>
        <label className="text-xs font-bold text-slate-500">Header struk (baris tambahan)</label>
        <input
          name="receiptHeader"
          defaultValue={s.receiptHeader ?? ""}
          placeholder="Jl. Contoh No. 1 · 0812-xxx"
          className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-xs font-bold text-slate-500">Footer struk</label>
        <input
          name="receiptFooter"
          defaultValue={s.receiptFooter ?? ""}
          placeholder="Terima kasih · IG @outlet"
          className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>

      <button type="submit" className="btn-primary w-full py-3 sm:w-auto">
        Simpan Pengaturan
      </button>
    </form>
  );
}

export default function PosRegisterSettingsPage({
  searchParams
}: {
  searchParams: { outlet?: string; ok?: string; error?: string; from?: string };
}) {
  const session = getSession();
  if (!session) redirect("/login");
  if (!VIEW_ROLES.includes(session.role)) redirect("/dashboard");

  const outletId =
    searchParams.outlet && (session.role === "owner" || session.role === "admin")
      ? searchParams.outlet
      : session.outletId ?? searchParams.outlet;

  const posOutlets = OUTLETS.filter((o) => POS_OUTLET_IDS.has(o.id));
  const activeOutletId = outletId && isPosOutlet(outletId) ? outletId : posOutlets[0]?.id;

  if (!activeOutletId) redirect("/dashboard");

  if (session.role === "leader" && session.outletId && activeOutletId !== session.outletId) {
    redirect(`/settings/pos?outlet=${session.outletId}`);
  }

  const registers = getRegisters(activeOutletId);
  const outlet = OUTLETS.find((o) => o.id === activeOutletId)!;
  const returnTo = searchParams.from === "pos" ? "pos" : "settings";
  const backHref =
    searchParams.from === "pos" ? `/pos?outlet=${activeOutletId}` : "/dashboard";
  const posQuery = searchParams.from ? "&from=pos" : "";

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <PageHeader
        title="Pengaturan Kasir"
        subtitle="Printer struk, auto-print, header/footer, modal awal — per counter/register."
        backHref={backHref}
        breadcrumbs={
          searchParams.from === "pos"
            ? [
                { label: "Dashboard", href: "/dashboard" },
                { label: "POS", href: `/pos?outlet=${activeOutletId}` },
                { label: "Pengaturan Kasir" }
              ]
            : [
                { label: "Dashboard", href: "/dashboard" },
                { label: "Pengaturan" },
                { label: "Kasir" }
              ]
        }
      />

      {(session.role === "owner" || session.role === "admin") && posOutlets.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-1">
          {posOutlets.map((o) => (
            <Link
              key={o.id}
              href={`/settings/pos?outlet=${o.id}${posQuery}`}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                o.id === activeOutletId
                  ? "bg-navy-800 text-white"
                  : "bg-slate-100 text-navy-800 hover:bg-slate-200"
              }`}
            >
              {o.name}
            </Link>
          ))}
        </div>
      )}

      {searchParams.ok === "saved" && (
        <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
          Pengaturan kasir disimpan.
        </p>
      )}
      {searchParams.error && (
        <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
          {decodeURIComponent(searchParams.error)}
        </p>
      )}

      <p className="mb-4 text-sm text-slate-600">
        Outlet: <strong>{outlet.name}</strong> · Tablet kasir pakai mode{" "}
        <strong>Browser / tablet</strong> — pilih printer thermal di dialog cetak OS. Nama/IP printer
        disimpan sebagai referensi untuk konfigurasi lanjutan.
      </p>

      {registers.length === 0 ? (
        <p className="panel p-4 text-sm text-slate-500">Belum ada register kasir untuk outlet ini.</p>
      ) : (
        registers.map((reg) => (
          <RegisterSettingsForm
            key={reg.id}
            outletId={activeOutletId}
            register={reg}
            returnTo={returnTo}
          />
        ))
      )}

      <p className="text-[11px] text-slate-400">
        PIN kasir login: <Link href="/settings/pins" className="underline">Pengaturan PIN</Link>
      </p>
    </main>
  );
}
