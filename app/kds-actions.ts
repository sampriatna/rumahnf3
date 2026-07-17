"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { isPosOutlet } from "@/lib/pos-seed";
import { advanceTicket, bumpTicket } from "@/lib/kds-service";
import {
  prosesTicket,
  siapTicket,
  problemTicket,
  injectDemoTicket
} from "@/lib/kds-board-service";
import type { KdsProblemReason, KdsStationId } from "@/types/kds";
import { toggleMenuItemSoldOut } from "@/lib/menu-service";
import {
  computeClosingOpnameRows,
  loadInventoryBundleForClosing,
  persistClosingOpnameAsync,
  persistClosingWasteAsync
} from "@/lib/kds-closing-service";
import { listClosingOpnameRules } from "@/lib/inventory-sheet-store";
import { getActiveInventorySource } from "@/lib/sources";
import { requireAuthz } from "@/lib/auth-guard";
import { PHASE0_FLAGS } from "@/lib/phase0-flags";

const KDS_ROLES = ["staff", "leader", "admin", "owner"];

function assertLegacyKdsWriterAllowed(outletId: string, station: string) {
  if (!PHASE0_FLAGS.kdsCanonicalBoardWriter) return;
  redirect(
    `/kds?outlet=${outletId}&station=${station}&error=${encodeURIComponent("Legacy KDS writer dinonaktifkan — gunakan board KDS.")}`
  );
}

function kdsGuard(session: ReturnType<typeof getSession>, outletId?: string | null) {
  if (PHASE0_FLAGS.authorizationPipeline) {
    const s = requireAuthz({
      capability: "kds",
      outletId,
      redirectTo: "/dashboard"
    });
    if (!KDS_ROLES.includes(s.role)) redirect("/dashboard");
    const oid =
      outletId && (s.role === "owner" || s.role === "admin")
        ? outletId
        : s.outletId ?? outletId;
    if (!oid || !isPosOutlet(oid)) redirect("/dashboard");
    return { session: s, outletId: oid };
  }
  if (!session || !KDS_ROLES.includes(session.role)) redirect("/dashboard");
  const oid =
    outletId && (session.role === "owner" || session.role === "admin")
      ? outletId
      : session.outletId ?? outletId;
  if (!oid || !isPosOutlet(oid)) redirect("/dashboard");
  return { session, outletId: oid };
}

export async function kdsBoardProsesAction(formData: FormData) {
  const session = getSession();
  const outletId = String(formData.get("outletId") ?? "");
  const station = String(formData.get("station") ?? "") as KdsStationId;
  kdsGuard(session, outletId);

  prosesTicket(String(formData.get("ticketId") ?? ""), station, session!.name);
  revalidatePath("/kds");
  redirect(`/kds?outlet=${outletId}&station=${station}`);
}

export async function kdsBoardSiapAction(formData: FormData) {
  const session = getSession();
  const outletId = String(formData.get("outletId") ?? "");
  const station = String(formData.get("station") ?? "") as KdsStationId;
  kdsGuard(session, outletId);

  siapTicket(String(formData.get("ticketId") ?? ""), station, session!.name);
  revalidatePath("/kds");
  redirect(`/kds?outlet=${outletId}&station=${station}`);
}

export async function kdsBoardProblemAction(formData: FormData) {
  const session = getSession();
  const outletId = String(formData.get("outletId") ?? "");
  const station = String(formData.get("station") ?? "") as KdsStationId;
  kdsGuard(session, outletId);

  const reason = String(formData.get("reason") ?? "lainnya") as KdsProblemReason;
  const note = String(formData.get("note") ?? "").trim();
  problemTicket(String(formData.get("ticketId") ?? ""), station, reason, note, session!.name);

  revalidatePath("/kds");
  redirect(`/kds?outlet=${outletId}&station=${station}`);
}

export async function kdsInjectDemoAction(formData: FormData) {
  const session = getSession();
  const outletId = String(formData.get("outletId") ?? "");
  const station = String(formData.get("station") ?? "");
  kdsGuard(session, outletId);

  injectDemoTicket(outletId);
  revalidatePath("/kds");
  redirect(`/kds?outlet=${outletId}&station=${station}`);
}

export async function advanceKdsAction(formData: FormData) {
  const session = getSession();
  const outletId = String(formData.get("outletId") ?? "");
  const station = String(formData.get("station") ?? "");
  kdsGuard(session, outletId);
  assertLegacyKdsWriterAllowed(outletId, station);

  const ticketId = String(formData.get("ticketId") ?? "");
  advanceTicket(ticketId, session!.name);

  revalidatePath("/kds");
  redirect(`/kds?outlet=${outletId}&station=${station}`);
}

export async function bumpKdsAction(formData: FormData) {
  const session = getSession();
  const outletId = String(formData.get("outletId") ?? "");
  const station = String(formData.get("station") ?? "");
  kdsGuard(session, outletId);
  assertLegacyKdsWriterAllowed(outletId, station);

  const ticketId = String(formData.get("ticketId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  bumpTicket(ticketId, reason || "Bump dari KDS");

  revalidatePath("/kds");
  redirect(`/kds?outlet=${outletId}&station=${station}`);
}

/** Dapur/bar tandai menu habis — langsung sync ke POS (soldOut). */
export async function kdsToggleSoldOutAction(formData: FormData) {
  const session = getSession();
  const outletId = String(formData.get("outletId") ?? "");
  const station = String(formData.get("station") ?? "");
  kdsGuard(session, outletId);

  const id = String(formData.get("id") ?? "");
  const soldOut = formData.get("soldOut") === "1";
  const item = toggleMenuItemSoldOut(id, soldOut);
  if (!item) {
    redirect(`/kds?outlet=${outletId}&station=${station}&error=not-found`);
  }

  revalidatePath("/kds");
  revalidatePath("/pos");
  revalidatePath("/library/products");
  redirect(
    `/kds?outlet=${outletId}&station=${station}&menu=${soldOut ? "soldout" : "instock"}&item=${encodeURIComponent(item.name)}`
  );
}

export async function kdsSubmitClosingOpnameAction(formData: FormData) {
  const session = getSession();
  const outletId = String(formData.get("outletId") ?? "");
  const station = String(formData.get("station") ?? "");
  kdsGuard(session, outletId);

  const ruleId = String(formData.get("ruleId") ?? "");
  const kodeBahan = String(formData.get("kodeBahan") ?? "");
  const lokasi = String(formData.get("lokasi") ?? "");
  const stokFisik = Number(formData.get("stokFisik"));

  if (!kodeBahan || !lokasi || Number.isNaN(stokFisik) || stokFisik < 0) {
    redirect(
      `/kds?outlet=${outletId}&station=${station}&closing=error&msg=${encodeURIComponent("Stok fisik tidak valid")}`
    );
  }

  const rules = listClosingOpnameRules();
  const rule = rules.find((r) => r.id === ruleId && r.outletId === outletId);
  if (!rule || rule.kodeBahan !== kodeBahan) {
    redirect(
      `/kds?outlet=${outletId}&station=${station}&closing=error&msg=${encodeURIComponent("Aturan opname tidak ditemukan")}`
    );
  }

  const source = getActiveInventorySource();
  const bahanList = await source.getMasterBahan();
  const bahan = bahanList.find((b) => b.kodeBahan === kodeBahan);
  if (!bahan) {
    redirect(
      `/kds?outlet=${outletId}&station=${station}&closing=error&msg=${encodeURIComponent("Bahan tidak ada di master")}`
    );
  }

  const bundle = await loadInventoryBundleForClosing();
  const result = computeClosingOpnameRows({
    kodeBahan,
    lokasi,
    stokFisik,
    pic: session!.name,
    satuanPakai: bahan.satuanPakai,
    bundle
  });
  await persistClosingOpnameAsync(result);

  const deltaNote =
    result.delta > 0
      ? `selisih −${result.delta} ${bahan.satuanPakai} tercatat`
      : result.delta < 0
        ? `koreksi +${-result.delta} ${bahan.satuanPakai}`
        : "cocok dengan sistem";

  revalidatePath("/kds");
  revalidatePath("/dashboard");
  redirect(
    `/kds?outlet=${outletId}&station=${station}&closing=ok&item=${encodeURIComponent(rule.label)}&note=${encodeURIComponent(deltaNote)}`
  );
}

export async function kdsSubmitClosingWasteAction(formData: FormData) {
  const session = getSession();
  const outletId = String(formData.get("outletId") ?? "");
  const station = String(formData.get("station") ?? "");
  kdsGuard(session, outletId);

  const kodeBahan = String(formData.get("kodeBahan") ?? "");
  const lokasi = String(formData.get("lokasi") ?? "");
  const qty = Number(formData.get("qty"));
  const jenis = String(formData.get("jenis") ?? "").trim();
  const alasan = String(formData.get("alasan") ?? "").trim();

  if (!kodeBahan || !lokasi || qty <= 0 || !jenis || !alasan) {
    redirect(
      `/kds?outlet=${outletId}&station=${station}&closing=error&msg=${encodeURIComponent("Data waste belum lengkap")}`
    );
  }

  const source = getActiveInventorySource();
  const bahanList = await source.getMasterBahan();
  if (!bahanList.some((b) => b.kodeBahan === kodeBahan)) {
    redirect(
      `/kds?outlet=${outletId}&station=${station}&closing=error&msg=${encodeURIComponent("Bahan tidak valid")}`
    );
  }

  const now = new Date().toISOString();
  await persistClosingWasteAsync({
    id: `ws-cl-${Date.now()}`,
    tanggal: now,
    kodeBahan,
    lokasi,
    jenis,
    qty,
    alasan: `${alasan} (${session!.name})`
  });

  revalidatePath("/kds");
  revalidatePath("/dashboard");
  redirect(
    `/kds?outlet=${outletId}&station=${station}&closing=waste&item=${encodeURIComponent(kodeBahan)}`
  );
}
