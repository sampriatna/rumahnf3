import Link from "next/link";

import { MetricLabel } from "@/components/MetricLabel";

export type OwnerWidget = {
  label: string;
  value: string;
  hint: string;
  href?: string;
  footerLink?: string;
  metricHint?: string;
};

function WidgetCard({ w }: { w: OwnerWidget }) {
  const body = (
    <>
      <p className="text-xs font-semibold text-slate-500">
        <MetricLabel label={w.label} hint={w.metricHint} />
      </p>
      <p className="mt-1 text-xl font-black text-navy-900">{w.value}</p>
      {w.hint && <p className="mt-1 line-clamp-1 text-[10px] text-slate-400">{w.hint}</p>}
      {w.footerLink && (
        <p className="mt-2 text-[10px] font-bold text-navy-700">{w.footerLink}</p>
      )}
    </>
  );

  const className =
    "panel block h-full p-4 transition-colors hover:border-gold-400/80 hover:bg-slate-50/50";

  if (w.href) {
    const external = w.href.startsWith("http");
    if (external) {
      return (
        <a href={w.href} target="_blank" rel="noopener noreferrer" className={className}>
          {body}
        </a>
      );
    }
    return (
      <Link href={w.href} className={className}>
        {body}
      </Link>
    );
  }

  return <div className="panel h-full p-4">{body}</div>;
}

export function DashboardOwnerSummary({ widgets }: { widgets: OwnerWidget[] }) {
  const primary = widgets.slice(0, 4);
  const secondary = widgets.slice(4);

  return (
    <section>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {primary.map((w) => (
          <WidgetCard key={w.label} w={w} />
        ))}
      </div>

      {secondary.length > 0 && (
        <>
          <p className="mb-3 mt-6 text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Operasional
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {secondary.map((w) => (
              <WidgetCard key={w.label} w={w} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
