import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getForm } from "@/lib/forms";
import { OUTLETS } from "@/lib/mock-data";
import { PageHeader } from "@/components/PageHeader";
import { StaffPage } from "@/components/staff/StaffPage";
import { StaffHeader } from "@/components/staff/StaffHeader";
import { FormRenderer } from "@/components/FormRenderer";

export default function FormPage({
  params,
  searchParams
}: {
  params: { type: string };
  searchParams: Record<string, string | undefined>;
}) {
  const session = getSession();
  if (!session) redirect("/login");

  const def = getForm(params.type);
  if (!def) redirect("/staff/form");

  const prefill: Record<string, string> = {};
  for (const field of def.fields) {
    const v = searchParams[field.name];
    if (typeof v === "string") prefill[field.name] = v;
  }

  const outletId = searchParams.outlet || session.outletId;
  const outlet = outletId ? OUTLETS.find((o) => o.id === outletId) : undefined;
  const isStaff = session.role === "staff";
  const subtitle = outlet ? `Outlet: ${outlet.name}` : "Isi sebentar, lalu kirim.";

  const content = (
    <>
      {isStaff ? (
        <StaffHeader title={def.label} subtitle={subtitle} backHref="/staff/form" />
      ) : (
        <PageHeader title={def.label} subtitle={subtitle} backHref="/staff/form" />
      )}
      <FormRenderer def={def} prefill={prefill} outletId={outletId} />
    </>
  );

  if (isStaff) {
    return <StaffPage>{content}</StaffPage>;
  }

  return <main className="mx-auto max-w-lg px-5 py-8">{content}</main>;
}
