-- ============================================================================
-- Rumah NF3 — Transfer Request gudang → outlet
-- Jalankan di Supabase SQL Editor (sekali). Idempotent — aman diulang.
--
-- Alur: leader ajukan → gudang kirim → outlet terima (tanpa approval owner)
-- ============================================================================

create schema if not exists nf3;

create table if not exists nf3.stock_transfer_requests (
  id                  text primary key,
  request_number      text not null,
  from_location_id    text not null default 'warehouse',
  from_location_label text not null,
  to_outlet_id        text not null,
  to_outlet_name      text,
  status              text not null,
  items               jsonb not null default '[]',
  requested_by_id     text not null,
  requested_by_name   text not null,
  note                text,
  approved_by_id      text,
  approved_by_name    text,
  approved_at         text,
  sent_by_id          text,
  sent_by_name        text,
  sent_at             text,
  received_by_id      text,
  received_by_name    text,
  received_at         text,
  rejection_note      text,
  created_at          text not null,
  updated_at          text not null
);
create index if not exists idx_transfer_requests_outlet on nf3.stock_transfer_requests(to_outlet_id, status);
create index if not exists idx_transfer_requests_status on nf3.stock_transfer_requests(status, created_at desc);

-- ---- Hak akses --------------------------------------------------------------
grant usage on schema nf3 to anon, authenticated, service_role;
grant all on all tables in schema nf3 to anon, authenticated, service_role;
alter default privileges in schema nf3
  grant all on tables to anon, authenticated, service_role;

-- ---- RLS (butuh helper nf3.can_access_outlet dari rls-policies.sql) ---------
alter table nf3.stock_transfer_requests enable row level security;
drop policy if exists stock_transfer_requests_access on nf3.stock_transfer_requests;
create policy stock_transfer_requests_access on nf3.stock_transfer_requests
  for all to authenticated
  using (nf3.is_global_access() or nf3.can_access_outlet(to_outlet_id))
  with check (nf3.is_global_access() or nf3.can_access_outlet(to_outlet_id));
