import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { PageHeader } from "@/components/PageHeader";
import { listClosingOpnameRules } from "@/lib/inventory-sheet-store";
import { getActiveInventorySource } from "@/lib/sources";
import { OUTLETS } from "@/lib/mock-data";
import { toggleClosingOpnameWajibAction } from "../inventory-closing-actions";

const VIEW_ROLES = ["owner", "admin"];

const KATEGORI_LABEL: Record<string, string> = {
  "ready-to-sale": "Ready to sale (marinasi/prep)",
  "bahan-mentah": "Bahan mentah",
  lainnya: "Lainnya"
};

export default async function InventoryClosingSettingsPage({
  searchParams
}: {
  searchParams: { saved?: string; error?: string };
}) {
  const session = getSession();
  if (!session) redirect("/login");
  if (!VIEW_ROLES.includes(session.role)) redirect("/dashboard");

  const rules = listClosingOpnameRules();
  const bahanList = await getActiveInventorySource().getMasterBahan();

  const byOutlet = OUTLETS.filter((o) => ["kbu", "kisamen", "samtaro"].includes(o.id)).map(
    (outlet) => ({
      outlet,
      rules: rules.filter((r) => r.outletId === outlet.id)
    })
  );

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <PageHeader
        title="Opname Closing KDS"
        subtitle="Atur produk mana yang wajib dihitung staf saat closing malam — dari HP, tanpa kertas."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Pengaturan" },
          { label: "Opname Closing" }
        ]}
      />

      {searchParams.saved && (
        <p className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          Pengaturan disimpan. KDS akan menampilkan checklist terbaru.
        </p>
      )}

      <section className="panel mb-6 p-5">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">
          Cara kerja
        </h2>
        <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
          <li>Staf closing buka KDS → panel <strong>Closing Malam</strong></li>
          <li>Opname wajib: hitung sisa fisik (marinasi, prep, dll.) — sistem isi saldo otomatis</li>
          <li>Waste: catat sisa tidak layak / rusak terpisah</li>
          <li>Malam habis → gudang refill berdasarkan saldo akurat</li>
        </ul>
      </section>

      {byOutlet.map(({ outlet, rules: outletRules }) => (
        <section key={outlet.id} className="panel mb-6 overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
            <h2 className="font-bold text-navy-900">{outlet.name}</h2>
            <p className="text-xs text-slate-500">Kode outlet: {outlet.id}</p>
          </div>

          {outletRules.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-500">Belum ada aturan untuk outlet ini.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {outletRules.map((rule) => {
                const bahan = bahanList.find((b) => b.kodeBahan === rule.kodeBahan);
                return (
                  <li key={rule.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-navy-900">{rule.label}</p>
                      <p className="text-xs text-slate-500">
                        {bahan?.namaBaku ?? rule.kodeBahan} · {rule.kodeBahan} · lokasi{" "}
                        {rule.lokasiStok}
                        {rule.stationId && ` · station ${rule.stationId}`}
                      </p>
                      <p className="mt-1 text-[11px] font-semibold uppercase text-slate-400">
                        {KATEGORI_LABEL[rule.kategori] ?? rule.kategori}
                      </p>
                    </div>
                    <form action={toggleClosingOpnameWajibAction} className="shrink-0">
                      <input type="hidden" name="id" value={rule.id} />
                      <input type="hidden" name="wajib" value={rule.wajibOpname ? "0" : "1"} />
                      <button
                        type="submit"
                        className={`rounded-full px-4 py-2 text-xs font-bold ${
                          rule.wajibOpname
                            ? "bg-amber-100 text-amber-900 hover:bg-amber-200"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {rule.wajibOpname ? "Wajib opname ✓" : "Opsional"}
                      </button>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ))}

      <p className="text-xs text-slate-500">
        Menambah produk baru ke daftar (mis. marinasi baru) — hubungi dev atau edit{" "}
        <code className="rounded bg-slate-100 px-1">lib/closing-opname-defaults.ts</code> sementara.
        Nanti bisa dari UI Library/Resep.
      </p>
    </main>
  );
}
