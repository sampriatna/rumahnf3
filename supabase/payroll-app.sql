-- ============================================================================
-- Rumah NF3 — Payroll / Slip Gaji (Fase 6, P3)
-- Jalankan di Supabase SQL Editor setelah schema.sql. Idempotent.
-- Akses: service-role di server + verifikasi session.user_id di app layer.
-- ============================================================================

create schema if not exists nf3;

create table if not exists nf3.payroll_payslips (
  id            text primary key,
  user_id       text not null,
  user_name     text not null,
  outlet_id     text,
  outlet_name   text,
  period_label  text not null,
  period_start  date not null,
  period_end    date not null,
  status        text not null default 'published' check (status in ('published', 'draft')),
  published_at  timestamptz,
  note          text,
  created_at    timestamptz not null default now()
);

create index if not exists idx_payroll_payslips_user on nf3.payroll_payslips(user_id, period_start desc);

create table if not exists nf3.payroll_payslip_lines (
  id          text primary key,
  payslip_id  text not null references nf3.payroll_payslips(id) on delete cascade,
  label       text not null,
  amount      numeric(14,2) not null default 0,
  line_type   text not null check (line_type in ('earning', 'deduction')),
  sort_order  int not null default 0
);

create index if not exists idx_payroll_lines_payslip on nf3.payroll_payslip_lines(payslip_id, sort_order);

grant usage on schema nf3 to anon, authenticated, service_role;
grant all on all tables in schema nf3 to anon, authenticated, service_role;
