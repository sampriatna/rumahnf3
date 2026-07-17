import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { getSession } from "@/lib/session";
import { getSop } from "@/lib/sop";
import { hasReadSop } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { StaffPage } from "@/components/staff/StaffPage";
import { StaffHeader } from "@/components/staff/StaffHeader";
import { acknowledgeSop } from "../../form-actions";

export default function SopDetailPage({ params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) redirect("/login");

  const sop = getSop(params.id);
  if (!sop) redirect("/sop");

  const read = hasReadSop(sop.id, session.sub);
  const isStaff = session.role === "staff";
  const subtitle = `${sop.category} · ${sop.outletScope} · v${sop.version} · diperbarui ${sop.updatedAt}`;

  const body = (
    <>
      {isStaff ? (
        <StaffHeader title={sop.title} subtitle={subtitle} backHref="/sop" />
      ) : (
        <PageHeader title={sop.title} subtitle={subtitle} backHref="/sop" />
      )}

      <article className="staff-card whitespace-pre-line p-6 text-sm leading-relaxed text-slate-700">
        {sop.content}
      </article>

      <div className="mt-5">
        {read ? (
          <p className="staff-callout-info border-emerald-200/80 bg-emerald-50/90 font-semibold text-emerald-800">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
            Kamu sudah menandai SOP ini sudah dibaca.
          </p>
        ) : (
          <form action={acknowledgeSop}>
            <input type="hidden" name="sopId" value={sop.id} />
            <button type="submit" className="btn-primary w-full sm:w-auto">
              Saya Sudah Baca
            </button>
          </form>
        )}
      </div>
    </>
  );

  if (isStaff) {
    return <StaffPage>{body}</StaffPage>;
  }

  return <main className="mx-auto max-w-2xl px-5 py-8">{body}</main>;
}
