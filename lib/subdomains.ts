/** Host & URL helper — aman dipakai di middleware (edge) dan server. */

export type SubdomainKind = "portal" | "pos" | "kds" | "staff";

export function normalizeHost(host: string | null | undefined): string {
  return (host ?? "").split(":")[0].toLowerCase();
}

function hostnameFromEnv(url?: string): string | undefined {
  if (!url?.trim()) return undefined;
  try {
    return new URL(url.trim()).hostname.toLowerCase();
  } catch {
    return undefined;
  }
}

function trimUrl(url?: string): string {
  return url?.replace(/\/$/, "") ?? "";
}

function hostnameFromUrl(url: string): string | undefined {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return undefined;
  }
}

/** Pakai fallback bila env kosong atau hostname tidak cocok (mis. APP_URL salah ke staff). */
function resolvedPublicUrl(envValue: string | undefined, fallback: string, rejectHosts: string[] = []): string {
  const trimmed = trimUrl(envValue);
  if (!trimmed) return fallback;
  const host = hostnameFromUrl(trimmed);
  if (!host) return fallback;
  if (rejectHosts.some((r) => host === r || host.endsWith(`.${r}`))) return fallback;
  return trimmed;
}

export function configuredPortalUrl(): string {
  return resolvedPublicUrl(process.env.NEXT_PUBLIC_APP_URL, "https://rumah.nf3.company", [
    "staff.nf3.company",
    "pos.nf3.company",
    "kds.nf3.company"
  ]);
}

export function configuredPosUrl(): string {
  return resolvedPublicUrl(process.env.NEXT_PUBLIC_POS_URL, "https://pos.nf3.company", [
    "staff.nf3.company",
    "rumah.nf3.company",
    "kds.nf3.company"
  ]);
}

export function configuredKdsUrl(): string {
  return resolvedPublicUrl(process.env.NEXT_PUBLIC_KDS_URL, "https://kds.nf3.company", [
    "staff.nf3.company",
    "rumah.nf3.company",
    "pos.nf3.company"
  ]);
}

export function configuredStaffUrl(): string {
  return resolvedPublicUrl(process.env.NEXT_PUBLIC_STAFF_URL, "https://staff.nf3.company", [
    "rumah.nf3.company",
    "pos.nf3.company",
    "kds.nf3.company"
  ]);
}

/** Deteksi subdomain dari Host header atau env. */
export function getSubdomainKind(host: string | null | undefined): SubdomainKind {
  const h = normalizeHost(host);
  const posHost = hostnameFromEnv(configuredPosUrl());
  const kdsHost = hostnameFromEnv(configuredKdsUrl());
  const staffHost = hostnameFromEnv(configuredStaffUrl());

  if (posHost && h === posHost) return "pos";
  if (kdsHost && h === kdsHost) return "kds";
  if (staffHost && h === staffHost) return "staff";
  if (h.startsWith("pos.")) return "pos";
  if (h.startsWith("kds.")) return "kds";
  if (h.startsWith("staff.")) return "staff";
  return "portal";
}

/** Portal /pos/... → URL penuh di pos.nf3.company (path /pos/... tetap). */
export function externalPosUrl(pathname: string, search = ""): string | null {
  const base = configuredPosUrl();
  if (!base || !pathname.startsWith("/pos")) return null;
  return `${base}${pathname}${search}`;
}

/** Portal /kds → URL penuh di kds.nf3.company. */
export function externalKdsUrl(pathname: string, search = ""): string | null {
  const base = configuredKdsUrl();
  if (!base || !pathname.startsWith("/kds")) return null;
  const subPath = pathname.replace(/^\/kds\/?/, "/") || "/";
  return `${base}${subPath === "/" ? "" : subPath}${search}`;
}

/** Link POS untuk UI — subdomain bila sudah dikonfigurasi. */
export function posAppUrl(path = "/pos/login"): string {
  const base = configuredPosUrl();
  if (!base) return path;
  if (path.startsWith("/pos")) return `${base}${path}`;
  return `${base}/pos${path.startsWith("/") ? path : `/${path}`}`;
}

export function kdsAppUrl(path = "/"): string {
  const base = configuredKdsUrl();
  if (!base) return path.startsWith("/kds") ? path : `/kds${path === "/" ? "" : path}`;
  if (path.startsWith("/kds")) {
    const rest = path.replace(/^\/kds\/?/, "");
    return rest ? `${base}/${rest}` : base;
  }
  return path === "/" ? base : `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function portalAppUrl(path = "/"): string {
  const base = configuredPortalUrl();
  if (!base) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Link portal staf — subdomain staff.nf3.company bila sudah dikonfigurasi. */
export function staffAppUrl(path = "/dashboard"): string {
  const base = configuredStaffUrl();
  if (!base) return path.startsWith("/") ? path : `/${path}`;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function sessionCookieDomain(): string | undefined {
  const explicit = process.env.SESSION_COOKIE_DOMAIN?.trim();
  if (explicit) return explicit;

  const hosts = [
    hostnameFromEnv(configuredPortalUrl()),
    hostnameFromEnv(configuredStaffUrl()),
    hostnameFromEnv(configuredPosUrl()),
    hostnameFromEnv(configuredKdsUrl())
  ];

  if (hosts.some((h) => h?.endsWith(".nf3.company") || h === "nf3.company")) {
    return ".nf3.company";
  }
  return undefined;
}
