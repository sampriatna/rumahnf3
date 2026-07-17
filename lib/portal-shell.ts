const PORTAL_SHELL_PREFIXES = [
  "/dashboard",
  "/approvals",
  "/inbox",
  "/finance",
  "/inventory",
  "/library",
  "/reports",
  "/settings",
  "/members",
  "/purchasing",
  "/ai",
  "/sop",
  "/qr",
  "/staff",
  "/orders",
  "/checker",
  "/akses-ditolak"
];

const EXCLUDED_PREFIXES = ["/pos", "/kds", "/login", "/api"];

export function shouldUsePortalShell(pathname: string): boolean {
  if (!pathname || pathname === "/") return false;
  if (EXCLUDED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return false;
  }
  return PORTAL_SHELL_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function pageTitleFromPath(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return "Ringkasan";
  const root = segments[0];
  const titles: Record<string, string> = {
    dashboard: "Ringkasan",
    approvals: "Persetujuan",
    inbox: "Kotak Masuk",
    finance: "Keuangan",
    inventory: "Inventori",
    library: "Menu & Produk",
    reports: "Laporan",
    settings: "Pengaturan",
    members: "Pelanggan",
    purchasing: "Pembelian",
    ai: "AI Direktur",
    sop: "SOP",
    qr: "Cetak QR",
    staff: "Portal Staf",
    orders: "Pesanan",
    checker: "Checker",
    "akses-ditolak": "Akses Ditolak"
  };
  return titles[root] ?? root.charAt(0).toUpperCase() + root.slice(1);
}
