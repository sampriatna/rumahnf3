import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Home } from "lucide-react";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { getSession } from "@/lib/session";
import { USERS } from "@/lib/mock-data";
import { getSubdomainKind, portalAppUrl, posAppUrl, staffAppUrl } from "@/lib/subdomains";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage({
  searchParams
}: {
  searchParams: { error?: string; mode?: string; next?: string };
}) {
  if (getSession()) {
    const dest =
      searchParams.next?.startsWith("/") && !searchParams.next.startsWith("//")
        ? searchParams.next
        : "/dashboard";
    redirect(dest);
  }
  const isDev = process.env.NODE_ENV !== "production";
  const personalDemoUsers = USERS.filter(
    (u) => u.role !== "staff" || !u.capabilities?.length || u.capabilities.includes("forms")
  );

  const isStaffHost = getSubdomainKind(headers().get("host")) === "staff";
  const title = isStaffHost ? "Portal Staf NF3" : APP_NAME;
  const tagline = isStaffHost
    ? "Slip gaji, SOP, form kerja — akun pribadimu."
    : APP_TAGLINE;

  return (
    <main
      className={`mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-5 py-12 ${
        isStaffHost ? "staff-app" : ""
      }`}
    >
      {isStaffHost && (
        <div className="staff-app-glow pointer-events-none fixed inset-x-0 top-0 z-0 h-48" aria-hidden />
      )}
      <div className={isStaffHost ? "relative z-[1]" : undefined}>
      <header className="mb-8 text-center">
        <span
          className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-gold-400 ${
            isStaffHost ? "staff-hero shadow-lg" : "bg-navy-800"
          }`}
        >
          <Home className="h-7 w-7" aria-hidden />
        </span>
        <h1 className="text-2xl font-black text-navy-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-600">{tagline}</p>
      </header>

      <div className={isStaffHost ? "staff-card p-5 shadow-md" : undefined}>
      <LoginForm
        errorCode={searchParams.error}
        errorMode={searchParams.mode}
        isDev={isDev}
        demoUsers={personalDemoUsers.map((u) => ({ phone: u.phone, name: u.name, role: u.role }))}
        nextPath={
          searchParams.next?.startsWith("/") && !searchParams.next.startsWith("//")
            ? searchParams.next
            : undefined
        }
      />
      </div>
      <p className="mt-6 text-center text-xs text-slate-500">
        {isStaffHost ? (
          <>
            Leader / admin?{" "}
            <a href={portalAppUrl("/login")} className="font-bold text-navy-700 underline">
              Command Center (rumah.nf3.company)
            </a>
          </>
        ) : (
          <>
            Staf outlet?{" "}
            <a href={staffAppUrl("/login")} className="font-bold text-navy-700 underline">
              Portal Staf (staff.nf3.company)
            </a>
            {" · "}
            Tablet kasir?{" "}
            <a href={posAppUrl("/pos/login")} className="font-bold text-navy-700 underline">
              POS Kasir
            </a>
          </>
        )}
      </p>
      </div>
    </main>
  );
}
