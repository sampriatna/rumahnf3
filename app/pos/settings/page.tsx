import { redirect } from "next/navigation";

/** Shortcut dari layar POS → pengaturan kasir outlet aktif. */
export default function PosSettingsShortcut({
  searchParams
}: {
  searchParams: { outlet?: string; ok?: string; error?: string };
}) {
  const q = new URLSearchParams({ from: "pos" });
  if (searchParams.outlet) q.set("outlet", searchParams.outlet);
  if (searchParams.ok) q.set("ok", searchParams.ok);
  if (searchParams.error) q.set("error", searchParams.error);
  redirect(`/settings/pos?${q.toString()}`);
}
