import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";

type AlertTone = "success" | "info" | "warning" | "danger";

const toneMap: Record<
  AlertTone,
  {
    className: string;
    Icon: typeof CheckCircle2;
  }
> = {
  success: {
    className: "nf3-alert-success",
    Icon: CheckCircle2
  },
  info: {
    className: "nf3-alert-info",
    Icon: Info
  },
  warning: {
    className: "nf3-alert-warning",
    Icon: AlertTriangle
  },
  danger: {
    className: "nf3-alert-danger",
    Icon: XCircle
  }
};

export function AlertBanner({
  tone,
  children,
  className
}: {
  tone: AlertTone;
  children: ReactNode;
  className?: string;
}) {
  const { className: toneClass, Icon } = toneMap[tone];
  return (
    <p className={`nf3-alert ${toneClass} ${className ?? ""}`.trim()}>
      <Icon className="mt-0.5 h-4.5 w-4.5 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}
