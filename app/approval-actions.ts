"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import {
  canDecideApproval,
  approvalToRequestStatus,
  APPROVAL_STATUS_META,
  type ApprovalStatus
} from "@/lib/approval";
import {
  getApproval,
  getSubmission,
  addNotificationLog
} from "@/lib/store";
import {
  formatApprovalDecidedWa,
  sendWaNotification
} from "@/lib/wa";
import { applyOpnameCorrection, fulfillRequestBahan, getPurchaseOrder } from "@/lib/inventory-service";
import { recordSetoranKasir } from "@/lib/finance-service";
import { workUnitForIdentity } from "@/lib/finance-access";
import { recordAuditEvent } from "@/lib/audit-log";
import { requireAuthz } from "@/lib/auth-guard";
import { PHASE0_FLAGS } from "@/lib/phase0-flags";
import type { Role } from "@/lib/types";

const HANDLER_ROLES: Role[] = ["leader", "owner", "admin"];

function approvalHandlerSession(outletId?: string | null) {
  if (PHASE0_FLAGS.authorizationPipeline) {
    return requireAuthz({
      roles: HANDLER_ROLES,
      outletId,
      redirectTo: "/approvals"
    });
  }
  const session = getSession();
  if (!session) redirect("/login");
  if (!HANDLER_ROLES.includes(session.role)) redirect("/dashboard");
  return session;
}

export async function decideApproval(formData: FormData) {
  const session = approvalHandlerSession();

  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "") as ApprovalStatus;
  const note = String(formData.get("note") ?? "").trim();

  if (!["approved", "rejected", "need_revision", "partially_approved"].includes(decision)) {
    redirect("/approvals");
  }

  const approval = getApproval(id);
  if (!approval) redirect("/approvals");

  if (PHASE0_FLAGS.authorizationPipeline) {
    approvalHandlerSession(approval.outletId);
  }

  if (!canDecideApproval(session.role, approval, session.outletId)) {
    redirect("/approvals?error=unauthorized");
  }

  const sub = getSubmission(approval.requestId);
  const now = new Date().toISOString();

  approval.status = decision;
  approval.approvedById = session.sub;
  approval.approvedByName = session.name;
  approval.approvalNote = note || undefined;
  approval.updatedAt = now;

  if (approval.requestType === "purchase_order") {
    const po = getPurchaseOrder(approval.requestId);
    if (po) {
      if (decision === "approved" || decision === "partially_approved") {
        po.status = "Approved";
      } else if (decision === "rejected") {
        po.status = "Cancelled";
      }
      po.updatedAt = now;
    }
  }

  if (sub) {
    const requestStatus = approvalToRequestStatus(decision);
    sub.status = requestStatus;
    sub.history.push({
      status: requestStatus,
      note: note || APPROVAL_STATUS_META[decision].label,
      at: now,
      byName: session.name
    });

    if (decision === "approved" || decision === "partially_approved") {
      if (sub.formType === "stock_opname") {
        const loc = sub.payload.lokasi ?? "";
        const useWarehouse = loc === "Gudang Pusat";
        applyOpnameCorrection({
          itemName: sub.payload.nama_bahan,
          stokFisik: Number(sub.payload.stok_fisik) || 0,
          outletId: useWarehouse ? undefined : sub.outletId,
          outletName: useWarehouse ? undefined : sub.outletName,
          sourceDocId: sub.id,
          createdBy: session.name
        });
        sub.history.push({
          status: "selesai",
          note: "Stok dikoreksi dari opname.",
          at: now,
          byName: "Sistem"
        });
        sub.status = "selesai";
      }
      if (sub.formType === "request_bahan") {
        const result = fulfillRequestBahan({
          submissionId: sub.id,
          itemName: sub.payload.nama_bahan,
          qty: Number(sub.payload.jumlah) || 0,
          unit: sub.payload.satuan,
          outletId: sub.outletId,
          outletName: sub.outletName,
          requestedBy: sub.submittedByName,
          urgency: sub.payload.urgensi ?? "—",
          areaUnit: workUnitForIdentity({ name: sub.submittedByName })
        });
        sub.history.push({
          status: result.action === "transfer" ? "dikirim" : "diproses",
          note:
            result.action === "transfer"
              ? "Stok ditransfer dari gudang ke outlet."
              : "Stok gudang kurang — masuk purchasing.",
          at: now,
          byName: "Sistem"
        });
      }
      if (sub.formType === "setoran_kasir") {
        const fromPos = sub.payload.source === "pos_shift";
        if (fromPos) {
          sub.history.push({
            status: "selesai",
            note:
              "Setoran POS diverifikasi — kas sudah tercatat per order di ledger (tidak double-count).",
            at: now,
            byName: "Sistem"
          });
        } else {
          recordSetoranKasir({
            outletId: sub.outletId,
            outletName: sub.outletName,
            cash: Number(sub.payload.cash) || 0,
            qris: Number(sub.payload.qris) || 0,
            online: Number(sub.payload.online) || 0,
            sourceDocId: sub.id,
            createdBy: session.name
          });
          sub.history.push({
            status: "selesai",
            note: "Setoran tercatat ke buku kas (cash/QRIS/online).",
            at: now,
            byName: "Sistem"
          });
        }
        sub.status = "selesai";
      }
    }
  }

  const waLog = await sendWaNotification({
    event: "approval_decided",
    target: "staff",
    outletId: approval.outletId,
    staffUserId: approval.requestedById,
    message: formatApprovalDecidedWa(
      approval,
      APPROVAL_STATUS_META[decision].label,
      session.name
    )
  });
  addNotificationLog(waLog);

  recordAuditEvent({
    action: "approval.decision",
    actorId: session.sub,
    actorName: session.name,
    outletId: approval.outletId,
    entityType: "approval",
    entityId: approval.id,
    reason: note || undefined,
    meta: {
      decision,
      requestType: approval.requestType,
      requestId: approval.requestId
    }
  });

  revalidatePath("/approvals");
  revalidatePath("/inbox");
  revalidatePath("/staff/status");
  revalidatePath("/dashboard");
  revalidatePath("/inventory");
  revalidatePath("/purchasing");
  revalidatePath("/finance");
  revalidatePath("/finance/ledger");
}
