-- ============================================================================
-- Rumah NF3 — Station KDS + Notes Category (master data POS/KDS)
-- Jalankan setelah pos-app.sql. Idempotent.
-- ============================================================================

create schema if not exists nf3;

alter table nf3.pos_kds_stations
  add column if not exists sort_order int not null default 0;

alter table nf3.pos_kds_stations
  add column if not exists active boolean not null default true;

create table if not exists nf3.pos_notes_categories (
  id         text primary key,
  outlet_id  text not null,
  name       text not null,
  grp        text,
  sort_order int not null default 0,
  active     boolean not null default true,
  unique (outlet_id, name)
);

create index if not exists idx_pos_notes_categories_outlet on nf3.pos_notes_categories(outlet_id);

grant all on nf3.pos_notes_categories to anon, authenticated, service_role;
