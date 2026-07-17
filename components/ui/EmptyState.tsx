import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/cn";
import { Card } from "./Card";

export function EmptyState({
  title = "Belum ada data",
  description,
  icon,
  action,
  className
}: {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "flex flex-col items-center justify-center border-dashed px-6 py-12 text-center",
        className
      )}
    >
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
        {icon ?? <Inbox className="h-6 w-6" aria-hidden />}
      </span>
      <p className="text-sm font-bold text-navy-900">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </Card>
  );
}
