import { supabaseAdmin } from "../supabase";
import type { Submission } from "../store";
import type { Approval } from "../approval";
import type { NotificationLog } from "../wa";

// ============================================================================
// Repository relasional Forms / Approval / Notifikasi (Fase D2b lanjutan).
// payload & history disimpan jsonb verbatim. Pull sekuensial + count: "exact".
// ============================================================================

export type FormsSnapshot = {
  submissions: Submission[];
  approvals: Approval[];
  notificationLogs: NotificationLog[];
};

const n = <T>(v: T | undefined): T | null => (v === undefined ? null : v);
const u = <T>(v: T | null): T | undefined => (v === null ? undefined : v);
const numU = (v: unknown): number | undefined => (v == null ? undefined : Number(v));

// ---- map: app -> row -------------------------------------------------------
const submissionRow = (s: Submission) => ({
  id: s.id,
  form_type: s.formType,
  form_label: s.formLabel,
  outlet_id: n(s.outletId),
  outlet_name: n(s.outletName),
  area: n(s.area),
  submitted_by_id: s.submittedById,
  submitted_by_name: s.submittedByName,
  payload: s.payload ?? {},
  photo_name: n(s.photoName),
  status: s.status,
  history: s.history ?? [],
  creates_task: s.createsTask,
  needs_approval: s.needsApproval,
  approval_id: n(s.approvalId),
  created_at: s.createdAt
});

const approvalRow = (a: Approval) => ({
  id: a.id,
  request_type: a.requestType,
  request_label: a.requestLabel,
  request_id: a.requestId,
  requested_by_id: a.requestedById,
  requested_by_name: a.requestedByName,
  outlet_id: n(a.outletId),
  outlet_name: n(a.outletName),
  amount: n(a.amount),
  reason: n(a.reason),
  status: a.status,
  approver_level: a.approverLevel,
  approved_by_id: n(a.approvedById),
  approved_by_name: n(a.approvedByName),
  approval_note: n(a.approvalNote),
  created_at: a.createdAt,
  updated_at: a.updatedAt
});

const notificationRow = (l: NotificationLog) => ({
  id: l.id,
  event: l.event,
  target: l.target,
  phone: n(l.phone),
  message: l.message,
  status: l.status,
  created_at: l.createdAt
});

// ---- map: row -> app -------------------------------------------------------
const toSubmission = (r: any): Submission => ({
  id: r.id,
  formType: r.form_type,
  formLabel: r.form_label,
  outletId: u(r.outlet_id),
  outletName: u(r.outlet_name),
  area: u(r.area),
  submittedById: r.submitted_by_id,
  submittedByName: r.submitted_by_name,
  payload: (r.payload && typeof r.payload === "object" ? r.payload : {}) as Record<string, string>,
  photoName: u(r.photo_name),
  status: r.status,
  history: Array.isArray(r.history) ? r.history : [],
  createsTask: Boolean(r.creates_task),
  needsApproval: Boolean(r.needs_approval),
  approvalId: u(r.approval_id),
  createdAt: r.created_at
});

const toApproval = (r: any): Approval => ({
  id: r.id,
  requestType: r.request_type,
  requestLabel: r.request_label,
  requestId: r.request_id,
  requestedById: r.requested_by_id,
  requestedByName: r.requested_by_name,
  outletId: u(r.outlet_id),
  outletName: u(r.outlet_name),
  amount: numU(r.amount),
  reason: u(r.reason),
  status: r.status,
  approverLevel: r.approver_level,
  approvedById: u(r.approved_by_id),
  approvedByName: u(r.approved_by_name),
  approvalNote: u(r.approval_note),
  createdAt: r.created_at,
  updatedAt: r.updated_at
});

const toNotification = (r: any): NotificationLog => ({
  id: r.id,
  event: r.event,
  target: r.target,
  phone: u(r.phone),
  message: r.message,
  status: r.status,
  createdAt: r.created_at
});

const COLS = {
  form_submissions:
    "id,form_type,form_label,outlet_id,outlet_name,area,submitted_by_id,submitted_by_name,payload,photo_name,status,history,creates_task,needs_approval,approval_id,created_at",
  approvals:
    "id,request_type,request_label,request_id,requested_by_id,requested_by_name,outlet_id,outlet_name,amount,reason,status,approver_level,approved_by_id,approved_by_name,approval_note,created_at,updated_at",
  notification_logs: "id,event,target,phone,message,status,created_at"
} as const;

/** Tulis seluruh state forms ke tabel relasional (idempotent). */
export async function pushForms(snap: FormsSnapshot): Promise<void> {
  try {
    const db = supabaseAdmin();
    if (snap.submissions.length) {
      await db.from("form_submissions").upsert(snap.submissions.map(submissionRow) as never[], { onConflict: "id" });
    }
    if (snap.approvals.length) {
      await db.from("approvals").upsert(snap.approvals.map(approvalRow) as never[], { onConflict: "id" });
    }
    if (snap.notificationLogs.length) {
      await db.from("notification_logs").upsert(snap.notificationLogs.map(notificationRow) as never[], { onConflict: "id" });
    }
  } catch {
    /* abaikan — relasional opsional */
  }
}

/** Baca seluruh state forms dari relasional. null bila tabel belum ada. */
export async function pullForms(): Promise<FormsSnapshot | null> {
  try {
    const db = supabaseAdmin();
    const { error: probeErr } = await db
      .from("form_submissions")
      .select("id", { count: "exact", head: true });
    if (probeErr) return null;

    const sel = async (t: keyof typeof COLS) => {
      const { data, error } = await db.from(t).select(COLS[t], { count: "exact" });
      if (error) return [] as any[];
      return (data ?? []) as any[];
    };
    const submissions = await sel("form_submissions");
    const approvals = await sel("approvals");
    const notificationLogs = await sel("notification_logs");
    return {
      submissions: submissions.map(toSubmission),
      approvals: approvals.map(toApproval),
      notificationLogs: notificationLogs.map(toNotification)
    };
  } catch {
    return null;
  }
}
