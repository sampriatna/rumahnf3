import { NextResponse } from "next/server";
import { loginWithEmail } from "@/lib/auth-service";
import { setSession } from "@/lib/session";

function nextFromForm(form: FormData, req: Request) {
  const next = String(form.get("next") ?? "");
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return new URL(next, req.url);
  }
  return new URL("/dashboard", req.url);
}

export async function POST(req: Request) {
  const form = await req.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const result = await loginWithEmail(email, password);
  if (!result.ok) {
    const url = new URL("/login", req.url);
    url.searchParams.set("mode", "email");
    url.searchParams.set("error", result.reason);
    const next = String(form.get("next") ?? "");
    if (next && next.startsWith("/") && !next.startsWith("//")) {
      url.searchParams.set("next", next);
    }
    return NextResponse.redirect(url, 303);
  }
  const user = result.user;
  setSession({
    sub: user.id,
    role: user.role,
    name: user.name,
    outletId: user.outletId,
    phone: user.phone,
    email: user.email,
    isSuperAdmin: user.isSuperAdmin
  });
  return NextResponse.redirect(nextFromForm(form, req), 303);
}
