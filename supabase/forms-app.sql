-- ============================================================================
-- Rumah NF3 — Fase D2b (lanjutan): Tabel relasional Forms / Approval / Notifikasi
-- Jalankan di Supabase SQL Editor (sekali). Idempotent — aman diulang.
--
-- Catatan desain:
--   • ID = teks (mis. 'SUB-0001', 'APR-0002') agar cocok dgn aplikasi.
--   • payload form & riwayat status disimpan JSONB (camelCase verbatim).
--   • Timestamp disimpan sebagai TEXT (ISO verbatim).
-- ============================================================================

create schema if not exists nf3;

create table if not exists nf3.form_submissions (
  id                text primary key,
  form_type         text not null,
  form_label        text not null,
  outlet_id         text,
  outlet_name       text,
  area              text,
  submitted_by_id   text not null,
  submitted_by_name text not null,
  payload           jsonb not null default '{}',
  photo_name        text,
  status            text not null,
  history           jsonb not null default '[]',
  creates_task      boolean not null default false,
  needs_approval    boolean not null default false,
  approval_id       text,
  created_at        text not null
);
create index if not exists idx_form_submissions_outlet on nf3.form_submissions(outlet_id, created_at desc);
create index if not exists idx_form_submissions_type on nf3.form_submissions(form_type, created_at desc);

create table if not exists nf3.approvals (
  id                 text primary key,
  request_type       text not null,
  request_label      text not null,
  request_id         text not null,
  requested_by_id    text not null,
  requested_by_name  text not null,
  outlet_id          text,
  outlet_name        text,
  amount             numeric(14,2),
  reason             text,
  status             text not null,
  approver_level     text not null,
  approved_by_id     text,
  approved_by_name   text,
  approval_note      text,
  created_at         text not null,
  updated_at         text not null
);
create index if not exists idx_approvals_status on nf3.approvals(status, created_at desc);
create index if not exists idx_approvals_request on nf3.approvals(request_id);

create table if not exists nf3.notification_logs (
  id         text primary key,
  event      text not null,
  target     text not null,
  phone      text,
  message    text not null,
  status     text not null,
  created_at text not null
);
create index if not exists idx_notification_logs_created on nf3.notification_logs(created_at desc);

-- ---- Hak akses (schema baru perlu grant) -----------------------------------
grant usage on schema nf3 to anon, authenticated, service_role;
grant all on all tables in schema nf3 to anon, authenticated, service_role;
alter default privileges in schema nf3
  grant all on tables to anon, authenticated, service_role;
