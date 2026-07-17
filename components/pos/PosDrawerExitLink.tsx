"use client";

import Link from "next/link";
import { posLogoutAction } from "@/app/pos-actions";
import { portalAppUrl } from "@/lib/subdomains";

export function PosDrawerExitLink({
  posOnlyStaff,
  className
}: {
  posOnlyStaff: boolean;
  className?: string;
}) {
  const cls = className ?? "text-sm font-bold text-navy-700";

  if (posOnlyStaff) {
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
