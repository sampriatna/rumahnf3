import { StaffShell } from "@/components/staff/StaffShell";

export default function StaffSectionLayout({ children }: { children: React.ReactNode }) {
  return <StaffShell>{children}</StaffShell>;
}
