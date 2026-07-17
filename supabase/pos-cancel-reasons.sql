-- ============================================================================
-- Rumah NF3 — Cancel / Void Reason (master data POS)
-- Jalankan setelah pos-app.sql. Idempotent.
-- ============================================================================

create schema if not exists nf3;

create table if not exists nf3.pos_cancel_reasons (
  id            text primary key,
  outlet_id     text not null,
  name          text not null,
  scope         text not null default 'all',
  requires_note boolean not null default false,
  sort_order    int not null default 0,
  active        boolean not null default true,
  unique (outlet_id, name)
);

create index if not exists idx_pos_cancel_reasons_outlet on nf3.pos_cancel_reasons(outlet_id);

grant all on nf3.pos_cancel_reasons to anon, authenticated, service_role;
