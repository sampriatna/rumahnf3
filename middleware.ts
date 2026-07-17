import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  getSubdomainKind,
  externalPosUrl,
  externalKdsUrl,
  portalAppUrl,
  staffAppUrl
} from "@/lib/subdomains";
import { decodeSessionTokenEdge } from "@/lib/session-token-edge";

const PUBLIC_PREFIXES = [
  "/login",
  "/pos/login",
  "/api/auth/",
  "/api/cloud-status",
  "/api/health",
  "/api/inventory-health",
  "/api/cron/"
];
const PUBLIC_EXACT = ["/"];

/** Rute khusus portal staf (staff.nf3.company). */
const STAFF_SUBDOMAIN_PREFIXES = ["/dashboard", "/staff", "/sop", "/q"];

/** Rute command center — tidak untuk subdomain staf. */
const PORTAL_ONLY_PREFIXES = [
  "/approvals",
  "/finance",
  "/inventory",
  "/settings",
  "/library",
  "/reports",
  "/ai",
  "/pos",
  "/kds",
  "/members",
  "/purchasing",
  "/inbox",
  "/qr",
  "/segera",
  "/orders",
  "/checker"
];

function isStaffSubdomainPath(pathname: string): boolean {
  if (PUBLIC_EXACT.includes(pathname)) return true;
  return STAFF_SUBDOMAIN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

function isAssetPath(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icon") ||
    pathname.endsWith(".json") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".webp")
  );
}

function nextWithPathname(request: NextRequest): NextResponse {
  const headers = new Headers(request.headers);
  headers.set("x-pathname", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

/** Redirect ke login bila belum ada cookie session + routing subdomain POS/KDS. */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const search = request.nextUrl.search;
  const host = request.headers.get("host");
  const kind = getSubdomainKind(host);

  if (isAssetPath(pathname)) {
    return nextWithPathname(request);
  }

  // --- Portal: arahkan /pos dan /kds ke subdomain masing-masing ---
  if (kind === "portal") {
    const posExternal = externalPosUrl(pathname, search);
    if (posExternal) {
      return NextResponse.redirect(posExternal, 308);
    }
    const kdsExternal = externalKdsUrl(pathname, search);
    if (kdsExternal) {
      return NextResponse.redirect(kdsExternal, 308);
    }
  }

  // --- POS subdomain (pos.nf3.company) ---
  if (kind === "pos") {
    if (pathname === "/" || pathname === "/login") {
      const url = request.nextUrl.clone();
      url.pathname = "/pos/login";
      return NextResponse.redirect(url);
    }

    if (
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/staff") ||
      pathname.startsWith("/settings") ||
      pathname.startsWith("/finance") ||
      pathname.startsWith("/approvals") ||
      pathname.startsWith("/members") ||
      pathname.startsWith("/reports") ||
      pathname.startsWith("/inventory") ||
      pathname.startsWith("/kds")
    ) {
      return NextResponse.redirect(portalAppUrl("/dashboard"));
    }

    if (isPublicPath(pathname)) {
      return nextWithPathname(request);
    }

    const session = request.cookies.get("nf3_session")?.value;
    if (!session) {
      const login = new URL("/pos/login", request.url);
      login.searchParams.set("next", pathname + search);
      return NextResponse.redirect(login);
    }

    return nextWithPathname(request);
  }

  // --- KDS subdomain (kds.nf3.company) ---
  if (kind === "kds") {
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/kds";
      return NextResponse.rewrite(url);
    }

    if (
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/staff") ||
      pathname.startsWith("/pos") ||
      pathname.startsWith("/settings") ||
      pathname.startsWith("/finance") ||
      pathname.startsWith("/members")
    ) {
      return NextResponse.redirect(portalAppUrl("/dashboard"));
    }

    if (pathname === "/login" || pathname.startsWith("/kds") || isPublicPath(pathname)) {
      return nextWithPathname(request);
    }

    const session = request.cookies.get("nf3_session")?.value;
    if (!session) {
      const login = new URL("/login", request.url);
      login.searchParams.set("next", pathname === "/" ? "/kds" : pathname + search);
      return NextResponse.redirect(login);
    }

    return nextWithPathname(request);
  }

  // --- Staff subdomain (staff.nf3.company) — portal staf pribadi ---
  if (kind === "staff") {
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    if (PORTAL_ONLY_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
      return NextResponse.redirect(portalAppUrl(pathname + search));
    }

    if (isPublicPath(pathname) || isStaffSubdomainPath(pathname)) {
      if (isPublicPath(pathname)) {
        return nextWithPathname(request);
      }

      const session = request.cookies.get("nf3_session")?.value;
      if (!session) {
        const login = new URL("/login", request.url);
        login.searchParams.set("next", pathname + search);
        return NextResponse.redirect(login);
      }

      const payload = await decodeSessionTokenEdge(session);
      if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
        if (payload && payload.role !== "staff") {
          return NextResponse.redirect(portalAppUrl("/dashboard"), 308);
        }
      }

      return nextWithPathname(request);
    }

    return NextResponse.redirect(portalAppUrl("/dashboard"));
  }

  // --- Portal default ---
  if (isPublicPath(pathname)) {
    return nextWithPathname(request);
  }

  const session = request.cookies.get("nf3_session")?.value;
  if (!session) {
    if (pathname.startsWith("/pos") && pathname !== "/pos/login") {
      const login = new URL("/pos/login", request.url);
      login.searchParams.set("next", pathname + search);
      return NextResponse.redirect(login);
    }
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    const payload = await decodeSessionTokenEdge(session);
    if (payload?.role === "staff") {
      return NextResponse.redirect(staffAppUrl("/dashboard"), 308);
    }
  }

  return nextWithPathname(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"]
};
