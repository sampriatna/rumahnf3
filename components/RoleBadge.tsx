import type { Role } from "@/lib/types";

const STYLES: Record<Role, string> = {
  staff: "bg-emerald-100 text-emerald-800",
  leader: "bg-blue-100 text-blue-800",
  admin: "bg-amber-100 text-amber-800",
  owner: "bg-navy-100 text-navy-800"
};

const LABELS: Record<Role, string> = {
  staff: "Staf",
  leader: "Leader",
  admin: "Admin / Keuangan",
  owner: "Owner"
};

export function RoleBadge({
  role,
  isSuperAdmin
}: {
  role: Role;
  isSuperAdmin?: boolean;
}) {
  const label =
    isSuperAdmin && role === "owner"
      ? "Super Admin · Owner"
      : isSuperAdmin
        ? `Super Admin · ${LABELS[role]}`
        : LABELS[role];

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${STYLES[role]}`}>
      {label}
    </span>
  );
}
