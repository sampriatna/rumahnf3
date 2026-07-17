import { LogOut } from "lucide-react";
import type { SessionPayload } from "@/lib/session";
import { RoleBadge } from "@/components/RoleBadge";
import { logoutAction } from "@/app/actions";

export function UserMenu({ session }: { session: SessionPayload }) {
  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <p className="text-sm font-bold text-navy-900">{session.name}</p>
        <RoleBadge role={session.role} isSuperAdmin={session.isSuperAdmin} />
      </div>
      <form action={logoutAction}>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-gold-400 hover:text-navy-800"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </form>
    </div>
  );
}
