import type { Approval } from "./approval";
import type { Submission } from "./store";
import { requestTypeLabel } from "./approval";
import { USERS } from "./mock-data";

export type NotificationEvent =
  | "approval_pending"
  | "approval_decided"
  | "request_bahan_new"
  | "task_urgent"
  | "quiet_hour"
  | "menu_promo";

export type NotificationLog = {
  id: string;
  event: NotificationEvent;
  target: "leader" | "owner" | "staff" | "admin";
  phone?: string;
  message: string;
  status: "logged" | "sent" | "failed";
  providerError?: string;
  createdAt: string;
};

function formatRp(n?: number) {
  if (n == null) return "—";
  return `Rp ${n.toLocaleString("id-ID")}`;
}

/** Normalisasi nomor Indonesia ke format internasional (628xx). */
export function normalizeWaPhone(phone?: string): string | undefined {
  if (!phone) return undefined;
  let digits = phone.replace(/\D/g, "");
  if (!digits) return undefined;
  if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
  else if (digits.startsWith("8")) digits = `62${digits}`;
  return digits;
}

function resolveTargetPhone(input: {
  target: NotificationLog["target"];
  phone?: string;
  outletId?: string;
  staffUserId?: string;
}): string | undefined {
  if (input.phone) return normalizeWaPhone(input.phone);
  if (input.target === "owner") {
    return normalizeWaPhone(USERS.find((u) => u.role === "owner")?.phone);
  }
  if (input.target === "leader") {
    const leader = input.outletId
      ? USERS.find((u) => u.role === "leader" && u.outletId === input.outletId)
      : USERS.find((u) => u.role === "leader");
    return normalizeWaPhone(leader?.phone ?? USERS.find((u) => u.role === "owner")?.phone);
  }
  if (input.staffUserId) {
    return normalizeWaPhone(USERS.find((u) => u.id === input.staffUserId)?.phone);
  }
  if (input.target === "admin") {
    return normalizeWaPhone(USERS.find((u) => u.role === "admin")?.phone);
  }
  return undefined;
}

async function dispatchToProvider(
  phone: string,
  message: string
): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.WA_PROVIDER_TOKEN;
  const url = process.env.WA_PROVIDER_URL;
  if (!token || !url) {
    return { ok: false, error: "WA provider belum dikonfigurasi (WA_PROVIDER_URL / WA_PROVIDER_TOKEN)." };
  }

  const provider = (process.env.WA_PROVIDER ?? "generic").toLowerCase();

  try {
    if (provider === "fonnte") {
      const res = await fetch(url || "https://api.fonnte.com/send", {
        method: "POST",
        headers: {
          Authorization: token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ target: phone, message, countryCode: "62" })
      });
      const body = await res.text();
      if (!res.ok) return { ok: false, error: body || res.statusText };
      return { ok: true };
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ phone, target: phone, message, text: message })
    });
    const body = await res.text();
    if (!res.ok) return { ok: false, error: body || res.statusText };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export function formatApprovalPendingWa(approval: Approval, sub: Submission) {
  const lines = [
    `[${requestTypeLabel(approval.requestType).toUpperCase()} BARU]`,
    `Outlet: ${approval.outletName ?? "—"}`,
    approval.amount != null ? `Nominal: ${formatRp(approval.amount)}` : null,
    sub.area ? `Area: ${sub.area}` : null,
    sub.payload.nama_bahan ? `Bahan: ${sub.payload.nama_bahan}` : null,
    sub.payload.jumlah ? `Jumlah: ${sub.payload.jumlah} ${sub.payload.satuan ?? ""}`.trim() : null,
    sub.payload.urgensi ? `Urgensi: ${sub.payload.urgensi}` : null,
    sub.payload.jenis ? `Jenis: ${sub.payload.jenis}` : null,
    sub.payload.selisih ? `Selisih Opname: ${sub.payload.selisih}` : null,
    sub.payload.selisih_vs_sistem
      ? `Selisih Setoran: ${formatRp(Number(sub.payload.selisih_vs_sistem))}`
      : null,
    `Requester: ${approval.requestedByName}`,
    `Status: Menunggu Approval`,
    approval.approverLevel === "owner" ? `⚠️ Butuh keputusan Owner` : `Menunggu Leader`
  ].filter(Boolean);

  return lines.join("\n");
}

export function formatApprovalDecidedWa(
  approval: Approval,
  decision: string,
  deciderName: string
) {
  return [
    `[UPDATE ${requestTypeLabel(approval.requestType).toUpperCase()}]`,
    `Outlet: ${approval.outletName ?? "—"}`,
    `Keputusan: ${decision}`,
    `Oleh: ${deciderName}`,
    approval.approvalNote ? `Catatan: ${approval.approvalNote}` : null
  ]
    .filter(Boolean)
    .join("\n");
}

/** Kirim WA ke provider (Fonnte / generic JSON POST) bila env terisi; selalu log ke store. */
export async function sendWaNotification(input: {
  event: NotificationEvent;
  target: NotificationLog["target"];
  phone?: string;
  outletId?: string;
  staffUserId?: string;
  message: string;
}): Promise<NotificationLog> {
  const resolvedPhone = resolveTargetPhone(input);
  const log: NotificationLog = {
    id: `WA-${Date.now()}`,
    event: input.event,
    target: input.target,
    phone: resolvedPhone,
    message: input.message,
    status: "logged",
    createdAt: new Date().toISOString()
  };

  const hasProvider = Boolean(process.env.WA_PROVIDER_URL && process.env.WA_PROVIDER_TOKEN);

  if (hasProvider && resolvedPhone) {
    const result = await dispatchToProvider(resolvedPhone, input.message);
    if (result.ok) {
      log.status = "sent";
    } else {
      log.status = "failed";
      log.providerError = result.error;
    }
  } else if (hasProvider && !resolvedPhone) {
    log.status = "failed";
    log.providerError = "Nomor tujuan tidak ditemukan.";
  }

  if (process.env.NODE_ENV !== "production") {
    console.info("[WA NOTIF]", log.status, log.target, log.phone ?? "(no phone)", "\n", log.message);
    if (log.providerError) console.warn("[WA ERROR]", log.providerError);
  }

  return log;
}
