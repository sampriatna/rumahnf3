import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { radius, shadow } from "@/lib/design-tokens";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("border border-slate-200 bg-white", radius.md, shadow.card, className)}
      {...props}
    />
  );
}
