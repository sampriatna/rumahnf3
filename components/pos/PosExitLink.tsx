import Link from "next/link";
import { getSession } from "@/lib/session";
import { isPosOnlyStaff } from "@/lib/pos-auth";
import { posLogoutAction } from "@/app/pos-actions";
import { portalAppUrl } from "@/lib/subdomains";
export function PosExitLink({ className }: { className?: string }) {
  const session = getSession();
  const cls = className ?? "text-sm font-bold text-navy-700";

  if (session && isPosOnlyStaff(session)) {
    return (
      <form action={posLogoutAction} className="inline">
        <button type="submit" className={cls}>
          Keluar
        </button>
      </form>
    );
  }

  return (
    <Link href={portalAppUrl("/dashboard")} className={cls}>
      ← Dashboard
    </Link>
  );
}
