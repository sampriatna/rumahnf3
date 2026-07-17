import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { getSession } from "@/lib/session";
import { FORM_LIST, ACTIVE_FORM_TYPES } from "@/lib/forms";
import { FORMS_ROADMAP } from "@/lib/forms-roadmap";
import { OUTLETS } from "@/lib/mock-data";
import { groupStaffForms } from "@/lib/staff-form-groups";
import { PageHeader } from "@/components/PageHeader";
import { StaffPage } from "@/components/staff/StaffPage";
import { StaffHeader } from "@/components/staff/StaffHeader";
import { StaffListLink } from "@/components/staff/StaffListLink";
import { ICONS } from "@/components/icon-map";

const OUTLET_TO_BISNIS: Record<string, "KBU" | "Kisamen" | "Samtaro" | "NF"> = {
  kbu: "KBU",
  kisamen: "Kisamen",
  samtaro: "Samtaro",
  "nf-prod": "NF"
};

export default function FormListPage() {
  const session = getSession();
  if (!session) redirect("/login");

  const isStaff = session.role === "staff";
  const bisnis = session.outletId ? OUTLET_TO_BISNIS[session.outletId] : undefined;
  const outletName = session.outletId ? OUTLETS.find((o) => o.id === session.outletId)?.name : undefined;

  const formVisible = (bisnisFilter?: ("KBU" | "Kisamen" | "Samtaro" | "NF")[]) => {
    if (!bisnisFilter || session.role === "owner" || session.role === "admin") return true;
    if (!bisnis) return true;
    return bisnisFilter.includes(bisnis);
  };

  const activeForms = FORM_LIST.filter((f) => formVisible(f.bisnis));
  const grouped = groupStaffForms(activeForms);

  const upcoming =
    !isStaff &&
    FORMS_ROADMAP.filter((f) => {
      if (ACTIVE_FORM_TYPES.has(f.type as (typeof FORM_LIST)[number]["type"])) return false;
      if (!bisnis || session.role === "owner" || session.role === "admin") return true;
      return f.bisnis.includes("Semua") || f.bisnis.includes(bisnis);
    });

  const subtitle = outletName
    ? `${outletName} — pilih jenis laporan yang mau dikirim.`
    : "Pilih jenis laporan yang mau dikirim.";

  const content = (
    <>
      {isStaff ? (
        <StaffHeader title="Isi Form" subtitle={subtitle} />
      ) : (
        <PageHeader title="Isi Form" subtitle={subtitle} />
      )}

      <Link href="/staff/form/lapor_kendala" className="staff-callout-warn mb-6">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
          <AlertTriangle className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h3 className="font-bold text-navy-900">Ada masalah / kendala?</h3>
          <p className="mt-0.5 text-sm text-slate-600">Tap di sini untuk lapor ke leader — paling sering dipakai.</p>
        </div>
      </Link>

      {grouped.map(({ group, forms }) => (
        <section key={group.id} className="mb-8">
          <h2 className="staff-section-title mb-1">{group.label}</h2>
          {group.hint && <p className="mb-3 text-xs text-slate-400">{group.hint}</p>}
          <div className="grid gap-3">
            {forms.map((def) => {
              const Icon = ICONS[def.icon];
              return (
                <StaffListLink
                  key={def.type}
                  href={`/staff/form/${def.type}`}
                  title={def.label}
                  description={def.desc}
                  icon={Icon}
                />
              );
            })}
          </div>
        </section>
      ))}

      {upcoming && upcoming.length > 0 && (
        <section className="mt-10 border-t border-slate-100 pt-8">
          <h2 className="staff-section-title mb-1">Roadmap (admin)</h2>
          <p className="mb-4 text-xs text-slate-400">Form yang belum diaktifkan — hanya tampil untuk admin/owner.</p>
          <div className="grid gap-3 opacity-75">
            {upcoming.map((f) => {
              const Icon = ICONS[f.icon];
              return (
                <div key={f.type} className="staff-card flex items-start gap-4 p-4" title={f.alur}>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-700">{f.label}</h3>
                    <p className="mt-0.5 text-xs text-slate-500">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </>
  );

  if (isStaff) {
    return <StaffPage>{content}</StaffPage>;
  }

  return <main className="mx-auto max-w-2xl px-5 py-8">{content}</main>;
}
