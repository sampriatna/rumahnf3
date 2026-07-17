import Link from "next/link";
import {
  LayoutGrid,
  MapPin,
  Package,
  Truck,
  Utensils,
  Trash2,
  ClipboardList,
  Users,
  ArrowDownToLine
} from "lucide-react";

const SECTIONS = [
  {
    title: "Ringkasan",
    links: [{ href: "/inventory/data", label: "Overview", key: "hub" as const, icon: LayoutGrid }]
  },
  {
    title: "Master",
    links: [
      { href: "/inventory/data/lokasi", label: "Lokasi", key: "lokasi" as const, icon: MapPin },
      { href: "/inventory/data/bahan", label: "Bahan", key: "bahan" as const, icon: Package },
      { href: "/inventory/data/supplier", label: "Supplier", key: "supplier" as const, icon: Users }
    ]
  },
  {
    title: "Mutasi",
    links: [
      {
        href: "/inventory/data/barang-masuk",
        label: "Barang Masuk",
        key: "barang-masuk" as const,
        icon: ArrowDownToLine
      },
      { href: "/inventory/data/transfer", label: "Transfer", key: "transfer" as const, icon: Truck },
      { href: "/inventory/data/pemakaian", label: "Pemakaian", key: "pemakaian" as const, icon: Utensils },
      { href: "/inventory/data/waste", label: "Waste", key: "waste" as const, icon: Trash2 }
    ]
  },
  {
    title: "Saldo Awal",
    links: [{ href: "/inventory/data/opname", label: "Opname", key: "opname" as const, icon: ClipboardList }]
  }
] as const;

export type InventoryDataNavKey =
  | (typeof SECTIONS)[number]["links"][number]["key"];

export function InventoryDataNav({ active }: { active: InventoryDataNavKey }) {
  return (
    <nav
      className="mb-6 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
      aria-label="Navigasi kelola data"
    >
      <p className="mb-3 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        Koreksi data mentah · bukan workflow transfer
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="mb-1.5 px-1 text-[10px] font-semibold text-slate-400">{section.title}</p>
            <div className="grid gap-1">
              {section.links.map((l) => {
                const Icon = l.icon;
                const isActive = active === l.key;
                return (
                  <Link
                    key={l.key}
                    href={l.href}
                    className={`flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-bold transition ${
                      isActive
                        ? "bg-navy-900 text-white shadow-sm"
                        : "text-slate-600 hover:bg-[#FBF8F0] hover:text-navy-900"
                    }`}
                  >
                    <Icon
                      className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-gold-400" : "text-slate-400"}`}
                      aria-hidden
                    />
                    {l.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}

export const fieldClass =
  "mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/20";
export const labelClass = "text-[10px] font-bold uppercase tracking-wide text-slate-500";

export function FlashMessage({ saved, error }: { saved?: string; error?: string }) {
  return (
    <>
      {saved && (
        <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200">
          Data berhasil disimpan.
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800 ring-1 ring-rose-200">
          {decodeURIComponent(error)}
        </p>
      )}
    </>
  );
}
