import { redirect } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Package,
  Users,
  ArrowDownToLine,
  Truck,
  Utensils,
  Trash2,
  ClipboardList,
  Database
} from "lucide-react";
import { getSession } from "@/lib/session";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  pullMasterLokasi,
  pullMasterBahan,
  pullMasterSupplier,
  pullBarangMasuk,
  pullTransferStok,
  pullPemakaianOutlet,
  pullWasteSelisih,
  pullOpnameAwal
} from "@/lib/inventory-crud";
import { InventoryDataNav } from "@/components/inventory/InventoryDataNav";
import { InventoryPageHeader } from "@/components/inventory/InventoryPageHeader";

const ROLES = ["owner", "admin"];

const TABLE_GROUPS = [
  {
    title: "Master",
    tables: [
      {
        key: "lokasi",
        href: "/inventory/data/lokasi",
        label: "Lokasi",
        desc: "GDG, KBU, KSM, SMT",
        icon: MapPin,
        tone: "bg-navy-50 text-navy-800"
      },
      {
        key: "bahan",
        href: "/inventory/data/bahan",
        label: "Bahan",
        desc: "Kode, harga, stok min/aman",
        icon: Package,
        tone: "bg-[#FBF8F0] text-[#883224]"
      },
      {
        key: "supplier",
        href: "/inventory/data/supplier",
        label: "Supplier",
        desc: "Lotte Mart, pasar, dll.",
        icon: Users,
        tone: "bg-violet-50 text-violet-800"
      }
    ]
  },
  {
    title: "Mutasi",
    tables: [
      {
        key: "barang-masuk",
        href: "/inventory/data/barang-masuk",
        label: "Barang Masuk",
        desc: "Penerimaan ke lokasi",
        icon: ArrowDownToLine,
        tone: "bg-emerald-50 text-emerald-800"
      },
      {
        key: "transfer",
        href: "/inventory/data/transfer",
        label: "Transfer (Ledger)",
        desc: "Koreksi manual",
        icon: Truck,
        tone: "bg-amber-50 text-amber-900"
      },
      {
        key: "pemakaian",
        href: "/inventory/data/pemakaian",
        label: "Pemakaian",
        desc: "Pemakaian real / BOM",
        icon: Utensils,
        tone: "bg-sky-50 text-sky-800"
      },
      {
        key: "waste",
        href: "/inventory/data/waste",
        label: "Waste",
        desc: "Rusak, expired, selisih",
        icon: Trash2,
        tone: "bg-rose-50 text-rose-800"
      }
    ]
  },
  {
    title: "Saldo Awal",
    tables: [
      {
        key: "opname",
        href: "/inventory/data/opname",
        label: "Opname",
        desc: "Baseline saldo per lokasi",
        icon: ClipboardList,
        tone: "bg-slate-100 text-slate-700"
      }
    ]
  }
] as const;

export default async function InventoryDataHubPage() {
  const session = getSession();
  if (!session) redirect("/login");
  if (!ROLES.includes(session.role)) redirect("/inventory");

  if (!isSupabaseConfigured()) {
    return (
      <div className="max-w-3xl">
        <InventoryPageHeader title="Kelola Data" subtitle="Supabase belum dikonfigurasi." />
        <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
          Set <code>INVENTORY_SOURCE=supabase</code> dan env Supabase, lalu jalankan{" "}
          <code>supabase/inventory-sheets.sql</code>.
        </p>
      </div>
    );
  }

  const [lokasi, bahan, supplier, masuk, transfer, pemakaian, waste, opname] = await Promise.all([
    pullMasterLokasi(),
    pullMasterBahan(),
    pullMasterSupplier(),
    pullBarangMasuk(),
    pullTransferStok(),
    pullPemakaianOutlet(),
    pullWasteSelisih(),
    pullOpnameAwal()
  ]);

  const counts: Record<string, number> = {
    lokasi: lokasi.length,
    bahan: bahan.length,
    supplier: supplier.length,
    "barang-masuk": masuk.length,
    transfer: transfer.length,
    pemakaian: pemakaian.length,
    waste: waste.length,
    opname: opname.length
  };

  return (
    <div className="max-w-4xl">
      <InventoryPageHeader
        title="Kelola Data"
        subtitle="Master data & mutasi mentah — langsung ke Supabase."
      />
      <InventoryDataNav active="hub" />

      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white px-4 py-3 shadow-sm">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
          <Database className="h-4 w-4" aria-hidden />
        </span>
        <div className="text-sm">
          <p className="font-bold text-emerald-900">Sumber aktif: Supabase</p>
          <p className="text-emerald-800/90">Import CSV: npm run condition:inventory</p>
        </div>
      </div>

      {TABLE_GROUPS.map((group) => (
        <section key={group.title} className="mb-8">
          <h2 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {group.title}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {group.tables.map((t) => {
              const Icon = t.icon;
              return (
                <Link
                  key={t.key}
                  href={t.href}
                  className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-gold-400 hover:shadow-md"
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${t.tone}`}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-navy-900 group-hover:text-navy-700">{t.label}</h3>
                      <span className="shrink-0 rounded-full bg-navy-900 px-2.5 py-0.5 text-xs font-bold text-white">
                        {counts[t.key]}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{t.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
