import { NextResponse } from "next/server";
import { loginWithPhonePin } from "@/lib/auth-service";
import { setSession } from "@/lib/session";

function nextFromForm(form: FormData, req: Request) {  const next = String(form.get("next") ?? "");
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return new URL(next, req.url);
  }
  return new URL("/dashboard", req.url);
}

export async function POST(req: Request) {
  const form = await req.formData();
  const phone = String(form.get("phone") ?? "");
  const pin = String(form.get("pin") ?? "");
  const user = await loginWithPhonePin(phone, pin);
  if (!user) {
    return NextResponse.redirect(new URL("/login?error=1&mode=phone", req.url), 303);
  }
  setSession({
    sub: user.id,
    role: user.role,
    name: user.name,
    outletId: user.outletId,
    phone: user.phone,
    email: user.email,
    isSuperAdmin: user.isSuperAdmin,
    capabilities: user.capabilities
  });
  return NextResponse.redirect(nextFromForm(form, req), 303);
}
