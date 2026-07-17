import { redirect } from "next/navigation";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { getSession } from "@/lib/session";
import { QR_SHORTCUTS } from "@/lib/qr";
import { PageHeader } from "@/components/PageHeader";

const PRINT_ROLES = ["leader", "owner", "admin"];

function baseUrl() {
  const h = headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  return `${proto}://${host}`;
}

export default async function QrPosterPage() {
  const session = getSession();
  if (!session) redirect("/login");
  if (!PRINT_ROLES.includes(session.role)) redirect("/dashboard");

  const origin = baseUrl();

  const cards = await Promise.all(
    QR_SHORTCUTS.map(async (s) => {
      const url = `${origin}/q/${s.code}`;
      const dataUrl = await QRCode.toDataURL(url, { width: 220, margin: 1 });
      return { ...s, url, dataUrl };
    })
  );

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <PageHeader
        title="QR Shortcut"
        subtitle="Cetak dan tempel di area kerja. Staf scan → form langsung terbuka."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <div key={c.code} className="panel flex flex-col items-center gap-3 p-5 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.dataUrl} alt={`QR ${c.label}`} width={180} height={180} />
            <div>
              <h3 className="font-bold text-navy-900">{c.label}</h3>
              <p className="text-xs text-slate-500">
                {c.outletCode} · {c.area}
              </p>
              <p className="mt-1 break-all font-mono text-[10px] text-slate-400">{c.url}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
