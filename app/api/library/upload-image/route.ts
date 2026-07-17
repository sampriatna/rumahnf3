import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";
import { isPosOutlet } from "@/lib/pos-seed";
import { requireApiAuthz } from "@/lib/api-auth";
import { PHASE0_FLAGS } from "@/lib/phase0-flags";
import { toOutletSlug } from "@/lib/outlet-identity";
import type { Role } from "@/lib/types";

const LIBRARY_ROLES: Role[] = ["leader", "admin", "owner"];
const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(req: Request) {
  const form = await req.formData();
  const outletId = toOutletSlug(String(form.get("outletId") ?? "")) ?? String(form.get("outletId") ?? "");

  if (PHASE0_FLAGS.authorizationPipeline) {
    const authz = requireApiAuthz({
      roles: LIBRARY_ROLES,
      outletId
    });
    if (!authz.ok) return authz.response;
  } else {
    const session = getSession();
    if (!session || !LIBRARY_ROLES.includes(session.role)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "no_supabase" }, { status: 503 });
  }

  const file = form.get("file");
  const itemId = String(form.get("itemId") ?? "new");

  if (!isPosOutlet(outletId)) {
    return NextResponse.json({ error: "invalid_outlet" }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "no_file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "too_large" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "bad_type" }, { status: 400 });
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : file.type === "image/gif" ? "gif" : "jpg";
  const path = `${outletId}/${itemId}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const db = supabaseAdmin();
  const { error } = await db.storage.from("menu-images").upload(path, buffer, {
    contentType: file.type,
    upsert: true
  });

  if (error) {
    return NextResponse.json({ error: "upload_failed", detail: error.message }, { status: 500 });
  }

  const { data } = db.storage.from("menu-images").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl, path });
}
