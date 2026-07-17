"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { getForm } from "@/lib/forms";
import { getSubmission, addSubmission, markSopRead, nextId, addApproval, addNotificationLog, type Submission } from "@/lib/store";
import type { RequestStatus } from "@/lib/feedback";
import {
  resolveApproverLevel,
  extractAmount,
  extractReason
} from "@/lib/approval";
import type { Approval } from "@/lib/approval";
import { formatApprovalPendingWa, sendWaNotification } from "@/lib/wa";
import { applyWasteFromForm, applyStockInFromForm, applyTransferFromWarehouse } from "@/lib/inventory-service";
import { writeWasteFromForm, writeBarangMasukFromForm, sheetsWriterActive } from "@/lib/inventory-sheets-writer";
import { toOutletSlug, getOutletByIdentity } from "@/lib/outlet-identity";
import { requireAuthz } from "@/lib/auth-guard";
import { PHASE0_FLAGS } from "@/lib/phase0-flags";
import type { Role } from "@/lib/types";

const STAFF_HANDLER_ROLES: Role[] = ["leader", "owner", "admin"];

const TUJUAN_TO_OUTLET: Record<string, { id: string; name: string }> = {
  KBU: { id: "kbu", name: "Kopi Buri Umah" },
  Kisamen: { id: "kisamen", name: "Kisamen" },
  Samtaro: { id: "samtaro", name: "Samtaro Express" },
  "NF Produksi": { id: "nf-prod", name: "Nusa Fishing — Produksi" }
};

function formSubmitSession(outletId?: string) {
  if (PHASE0_FLAGS.authorizationPipeline) {
    return requireAuthz({
      capability: "forms",
      outletId,
      redirectTo: "/staff/form"
    });
  }
  const session = getSession();
  if (!session) redirect("/login");
  return session;
}

function inboxHandlerSession(outletId?: string | null) {
  if (PHASE0_FLAGS.authorizationPipeline) {
    return requireAuthz({
      roles: STAFF_HANDLER_ROLES,
      outletId,
      redirectTo: "/inbox"
    });
  }
  const session = getSession();
  if (!session) redirect("/login");
  if (!STAFF_HANDLER_ROLES.includes(session.role)) redirect("/dashboard");
  return session;
}

export async function submitForm(formData: FormData) {
  const sessionPreview = getSession();
  if (!sessionPreview) redirect("/login");

  const formType = String(formData.get("__formType") ?? "");
  const def = getForm(formType);
  if (!def) redirect("/staff/form");

  // Kumpulkan field sesuai definisi (hindari menerima field sembarangan).
  const payload: Record<string, string> = {};
  for (const field of def.fields) {
    const raw = formData.get(field.name);
    payload[field.name] = raw == null ? "" : String(raw);
  }

  // Field turunan (hitung otomatis, tidak dari input user).
  if (formType === "stock_opname") {
    const sistem = Number(payload.stok_sistem) || 0;
    const fisik = Number(payload.stok_fisik) || 0;
    payload.selisih = String(fisik - sistem);
  }
  if (formType === "setoran_kasir") {
    const cash = Number(payload.cash) || 0;
    const qris = Number(payload.qris) || 0;
    const online = Number(payload.online) || 0;
    const totalSetoran = cash + qris + online;
    const totalSistem = Number(payload.total_penjualan) || 0;
    payload.total_setoran = String(totalSetoran);
    payload.selisih_vs_sistem = String(totalSetoran - totalSistem);
  }

  // Outlet: prioritas hidden field (dari QR), lalu outlet milik user.
  const outletParam = String(formData.get("__outlet") ?? "").trim();
  const outletId = toOutletSlug(outletParam || sessionPreview.outletId);
  const session = formSubmitSession(outletId);
  const outlet = outletId ? getOutletByIdentity(outletId) : undefined;

  // Foto: fase skeleton hanya catat nama file (upload nyata ke storage di fase berikutnya).
  const photo = formData.get("foto");
  const photoName =
    photo && typeof photo === "object" && "name" in photo && (photo as File).size > 0
      ? (photo as File).name
      : undefined;

  const now = new Date().toISOString();
  const submission: Submission = {
    id: nextId("REQ"),
    formType: def.type,
    formLabel: def.label,
    outletId: outlet?.id,
    outletName: outlet?.name,
    area: payload.area || payload.lokasi || payload.shift || payload.dari_shift,
    submittedById: session.sub,
    submittedByName: session.name,
    payload,
    photoName,
    status: def.initialStatus,
    createsTask: def.createsTask,
    needsApproval: def.needsApproval,
    history: [{ status: def.initialStatus, note: def.routeNote, at: now, byName: "Sistem" }],
    createdAt: now
  };

  addSubmission(submission);

  if (formType === "waste_bahan" || formType === "waste_produksi_nf") {
    const wasteInput = {
      itemName: payload.nama_bahan || payload.produk,
      qty: Number(payload.jumlah) || 0,
      unit: payload.satuan,
      outletId: outlet?.id,
      outletName: outlet?.name,
      sourceDocId: submission.id,
      createdBy: session.name,
      note: payload.alasan || payload.catatan
    };
    if (sheetsWriterActive()) {
      await writeWasteFromForm({
        itemName: wasteInput.itemName,
        qty: wasteInput.qty,
        outletId: wasteInput.outletId,
        sourceDocId: wasteInput.sourceDocId,
        createdBy: wasteInput.createdBy,
        note: wasteInput.note,
        jenis: formType === "waste_produksi_nf" ? "Waste Produksi NF" : "Form Staff"
      });
    } else {
      applyWasteFromForm(wasteInput);
    }
  }

  if (formType === "barang_masuk") {
    const masukInput = {
      itemName: payload.nama_bahan,
      qty: Number(payload.jumlah) || 0,
      unit: payload.satuan,
      outletId: outlet?.id,
      outletName: outlet?.name,
      sourceDocId: submission.id,
      sourceDocType: "form_barang_masuk",
      createdBy: session.name,
      note: payload.sumber + (payload.no_referensi ? ` · ${payload.no_referensi}` : "")
    };
    if (sheetsWriterActive()) {
      await writeBarangMasukFromForm({
        itemName: masukInput.itemName,
        qty: masukInput.qty,
        unit: masukInput.unit,
        outletId: masukInput.outletId,
        sourceDocId: masukInput.sourceDocId,
        createdBy: masukInput.createdBy,
        supplier: payload.sumber,
        note: masukInput.note
      });
    } else {
      applyStockInFromForm(masukInput);
    }
  }

  if (formType === "barang_keluar") {
    const dest = TUJUAN_TO_OUTLET[payload.tujuan];
    if (dest) {
      applyTransferFromWarehouse({
        itemName: payload.nama_bahan,
        qty: Number(payload.jumlah) || 0,
        unit: payload.satuan,
        destOutletId: dest.id,
        destOutletName: dest.name,
        sourceDocId: submission.id,
        createdBy: session.name
      });
    }
  }

  if (formType === "hasil_packing_nf") {
    applyStockInFromForm({
      itemName: payload.produk,
      qty: Number(payload.jumlah_pack) || 0,
      unit: "pack",
      outletId: outlet?.id ?? "nf-prod",
      outletName: outlet?.name ?? "Nusa Fishing — Produksi",
      sourceDocId: submission.id,
      sourceDocType: "form_packing_nf",
      createdBy: session.name,
      note: payload.shift ? `Shift ${payload.shift}` : undefined
    });
  }

  if (formType === "konfirmasi_terima_bahan") {
    const refId = payload.no_request.trim();
    const linked = refId ? getSubmission(refId) : undefined;
    if (linked) {
      linked.status = "diterima";
      linked.history.push({
        status: "diterima",
        note: `Dikonfirmasi diterima: ${payload.kondisi}`,
        at: now,
        byName: session.name
      });
    }
  }

  if (def.needsApproval) {
    const approverLevel = resolveApproverLevel(submission);
    const approvalId = nextId("APR");
    const approval: Approval = {
      id: approvalId,
      requestType: def.type,
      requestLabel: def.label,
      requestId: submission.id,
      requestedById: session.sub,
      requestedByName: session.name,
      outletId: outlet?.id,
      outletName: outlet?.name,
      amount: extractAmount(submission),
      reason: extractReason(submission),
      status: "pending",
      approverLevel,
      createdAt: now,
      updatedAt: now
    };
    submission.approvalId = approvalId;
    addApproval(approval);

    const waLog = await sendWaNotification({
      event: "approval_pending",
      target: approverLevel === "owner" ? "owner" : "leader",
      outletId: outlet?.id,
      message: formatApprovalPendingWa(approval, submission)
    });
    addNotificationLog(waLog);
  }

  revalidatePath("/staff/status");
  revalidatePath("/inbox");
  revalidatePath("/approvals");
  revalidatePath("/dashboard");
  revalidatePath("/inventory");
  revalidatePath("/purchasing");
  revalidatePath("/finance");
  redirect("/staff/status?ok=1");
}

export async function updateStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as RequestStatus;
  const note = String(formData.get("note") ?? "").trim();

  const sub = getSubmission(id);
  if (!sub) redirect("/inbox");

  const session = inboxHandlerSession(sub.outletId);

  // Leader hanya boleh menindak request outletnya (business rule tambahan).
  if (session.role === "leader" && session.outletId && sub.outletId !== session.outletId) {
    redirect("/inbox");
  }

  sub.status = status;
  sub.history.push({
    status,
    note: note || undefined,
    at: new Date().toISOString(),
    byName: session.name
  });

  revalidatePath("/inbox");
  revalidatePath("/staff/status");
}

export async function acknowledgeSop(formData: FormData) {
  const session = PHASE0_FLAGS.authorizationPipeline
    ? requireAuthz({ redirectTo: "/dashboard" })
    : getSession();
  if (!session) redirect("/login");

  const sopId = String(formData.get("sopId") ?? "");
  if (sopId) {
    markSopRead(sopId, session.sub);
    revalidatePath(`/sop/${sopId}`);
  }
}
