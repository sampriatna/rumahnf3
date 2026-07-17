import { LogOut } from "lucide-react";
import { RoleBadge } from "@/components/RoleBadge";
import type { Role } from "@/lib/types";
import { logoutAction } from "@/app/actions";
import { workUnitForIdentity } from "@/lib/finance-access";

export function StaffWelcome({
  name,
  role,
  outletName,
  email,
  phone,
  tagline
}: {
  name: string;
  role: Role;
  outletName?: string;
  email?: string;
  phone?: string;
  tagline: string;
}) {
  const areaUnit = workUnitForIdentity({ name, email, phone });
  return (
    <section className="staff-hero mb-6 overflow-hidden rounded-2xl p-5 text-white shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gold-400/90">Portal Staf</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight">Halo, {name.split(" ")[0]}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <RoleBadge role={role} />
            {areaUnit && (
              <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-blue-100 ring-1 ring-blue-200/40">
                {areaUnit}
              </span>
            )}
            {outletName && (
              <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold text-white/90 ring-1 ring-white/20">
                {outletName}
              </span>
            )}
          </div>
          <p className="mt-3 max-w-[32ch] text-sm leading-relaxed text-white/75">{tagline}</p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/20 transition hover:bg-white/20"
            aria-label="Keluar"
          >
            <LogOut className="h-4 w-4" aria-hidden />
          </button>
        </form>
      </div>
    </section>
  );
}
