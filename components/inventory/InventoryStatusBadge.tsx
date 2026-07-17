import type { StatusStok } from "@/types/inventory";

const META: Record<StatusStok, { label: string; className: string }> = {
  BELI: { label: "Beli", className: "bg-[#883224] text-white" },
  WASPADA: { label: "Waspada", className: "bg-[#D9A441] text-[#1F1F1F]" },
  AMAN: { label: "Aman", className: "bg-[#6F7F3A] text-white" }
};

export function InventoryStatusBadge({
  status,
  size = "sm"
}: {
  status: StatusStok;
  size?: "sm" | "xs";
}) {
  const meta = META[status];
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full font-bold ${meta.className} ${
        size === "xs" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-xs"
      }`}
    >
      {meta.label}
    </span>
  );
}

export function inventoryStatusFilterClass(status: StatusStok | "ALL", active: boolean) {
  if (!active) {
    return "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50";
  }
  switch (status) {
    case "BELI":
      return "border-[#883224] bg-[#883224] text-white shadow-sm";
    case "WASPADA":
      return "border-[#D9A441] bg-[#D9A441] text-[#1F1F1F] shadow-sm";
    case "AMAN":
      return "border-[#6F7F3A] bg-[#6F7F3A] text-white shadow-sm";
    default:
      return "border-navy-800 bg-navy-900 text-white shadow-sm";
  }
}
