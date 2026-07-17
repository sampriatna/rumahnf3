import { StaffNav } from "./StaffNav";

/** Shell portal staf — latar tenang, nav bawah tetap. */
export function StaffShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="staff-app min-h-[100dvh]">
      <div className="staff-app-glow pointer-events-none fixed inset-x-0 top-0 z-0 h-56" aria-hidden />
      <div className="relative z-[1]">{children}</div>
      <StaffNav />
    </div>
  );
}
