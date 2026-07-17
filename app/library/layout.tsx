import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, LayoutGrid, Tags, SlidersHorizontal, ChefHat, Copy, Grid3x3, Monitor, Package, Percent, Store, GitBranch, Ban, Ticket, Clock, PanelTop, Landmark, CreditCard } from "lucide-react";
import { getSession } from "@/lib/session";

const LIBRARY_ROLES = ["leader", "admin", "owner"];

const NAV = [
  { href: "/library/products", label: "Daftar Produk", icon: LayoutGrid },
  { href: "/library/branch-menu", label: "Branch Menu", icon: GitBranch },
  { href: "/library/categories", label: "Kategori", icon: Tags },
  { href: "/library/modifiers", label: "Add-on", icon: SlidersHorizontal },
  { href: "/library/floor", label: "Meja & Area", icon: Grid3x3 },
  { href: "/library/kds", label: "Station & Catatan", icon: Monitor },
  { href: "/library/channels", label: "Sales Channel", icon: Store },
  { href: "/library/packages", label: "Paket Menu", icon: Package },
  { href: "/library/promotions", label: "Promosi", icon: Percent },
  { href: "/library/price-schedules", label: "Scheduler Harga", icon: Clock },
  { href: "/library/pos-menu-layout", label: "Layout POS", icon: PanelTop },
  { href: "/library/payment-methods", label: "Metode Bayar", icon: CreditCard },
  { href: "/library/chart-of-accounts", label: "Bagan Akun", icon: Landmark },
  { href: "/library/cancel-reasons", label: "Alasan Void", icon: Ban },
  { href: "/library/cashier-vouchers", label: "Voucher Kasir", icon: Ticket },
  { href: "/library/recipes", label: "Resep/BOM", icon: ChefHat },
  { href: "/library/copy", label: "Salin Menu", icon: Copy, adminOnly: true }
];

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  const session = getSession();
  if (!session) redirect("/login");
  if (!LIBRARY_ROLES.includes(session.role)) redirect("/dashboard");

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl gap-0 px-4 py-6 lg:gap-8">
      <aside className="hidden w-52 shrink-0 lg:block">
        <div className="sticky top-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-800 text-gold-400">
              <BookOpen className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-black text-navy-900">Library</p>
              <p className="text-[10px] text-slate-500">Menu & Produk POS</p>
            </div>
          </div>
          <nav className="grid gap-1">
            {NAV.filter((n) => !n.adminOnly || session.role === "owner" || session.role === "admin").map(
              ({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-white hover:text-navy-900"
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {label}
                </Link>
              )
            )}
          </nav>
          <Link href="/dashboard" className="mt-6 block text-xs font-bold text-navy-700 hover:underline">
            ← Dashboard
          </Link>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <nav className="mb-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin] lg:hidden">
          {NAV.filter((n) => !n.adminOnly || session.role === "owner" || session.role === "admin").map(
            ({ href, label }) => (
              <Link key={href} href={href} className="btn-secondary shrink-0 px-3 py-2 text-xs">
                {label}
              </Link>
            )
          )}
        </nav>
        {children}
      </div>
    </div>
  );
}
