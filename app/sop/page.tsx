import { redirect } from "next/navigation";
import { BookOpen, CheckCircle2 } from "lucide-react";
import { getSession } from "@/lib/session";
import { SOPS } from "@/lib/sop";
import { hasReadSop } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { StaffPage } from "@/components/staff/StaffPage";
import { StaffHeader } from "@/components/staff/StaffHeader";
import { StaffListLink } from "@/components/staff/StaffListLink";

export default function SopListPage() {
  const session = getSession();
  if (!session) redirect("/login");

  const isStaff = session.role === "staff";

  const list = (
    <div className="grid gap-3">
      {SOPS.map((sop) => {
        const read = hasReadSop(sop.id, session.sub);
        return (
          <StaffListLink
            key={sop.id}
            href={`/sop/${sop.id}`}
            title={sop.title}
            description={`${read ? "Sudah dibaca · " : ""}${sop.category} · ${sop.outletScope} · v${sop.version}`}
            icon={BookOpen}
          />
        );
      })}
    </div>
  );

  if (isStaff) {
    return (
      <StaffPage>
        <StaffHeader title="SOP & Cara Kerja" subtitle="Panduan kerja & product knowledge." />
        {list}
      </StaffPage>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <PageHeader title="SOP & Cara Kerja" subtitle="Panduan kerja & product knowledge." />
      <div className="grid gap-3">
        {SOPS.map((sop) => {
          const read = hasReadSop(sop.id, session.sub);
          return (
            <StaffListLink
              key={sop.id}
              href={`/sop/${sop.id}`}
              title={sop.title}
              description={`${sop.category} · ${sop.outletScope} · ${sop.roleScope} · v${sop.version}`}
              icon={BookOpen}
            />
          );
        })}
      </div>
      {SOPS.some((s) => hasReadSop(s.id, session.sub)) && (
        <p className="mt-4 flex items-center gap-1 text-xs text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
          Centang hijau = sudah dibaca
        </p>
      )}
    </main>
  );
}
