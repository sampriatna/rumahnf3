import { NextResponse } from "next/server";
import { loginWithOutletCashierPin } from "@/lib/auth-service";
import { setSession } from "@/lib/session";
import { posLandingPath } from "@/lib/pos-auth";

function errorRedirect(req: Request, code: string) {
  return NextResponse.redirect(new URL(`/pos/login?error=${code}`, req.url), 303);
}

export async function POST(req: Request) {
  const form = await req.formData();
  const outletId = String(form.get("outletId") ?? "").trim();
  const pin = String(form.get("pin") ?? "");
  const next = String(form.get("next") ?? "");

  if (!outletId) return errorRedirect(req, "missing-outlet");

  const cashier = await loginWithOutletCashierPin(outletId, pin);
  if (!cashier) return errorRedirect(req, "invalid");

  setSession({
    sub: cashier.id,
    role: "staff",
    name: cashier.label,
    outletId: cashier.outletId,
    phone: undefined,
    capabilities: ["pos"]
  });

  const dest = posLandingPath(
    {
      sub: cashier.id,
      role: "staff",
      name: cashier.label,
      outletId: cashier.outletId,
      capabilities: ["pos"],
      exp: 0
    },
    next
  );

  return NextResponse.redirect(new URL(dest, req.url), 303);
}
