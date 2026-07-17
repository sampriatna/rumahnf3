import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { StaffShell } from "@/components/staff/StaffShell";

export default function SopLayout({ children }: { children: React.ReactNode }) {
  const session = getSession();
  if (!session) redirect("/login");

  if (session.role === "staff") {
    return <StaffShell>{children}</StaffShell>;
  }

  return children;
}
