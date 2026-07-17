-- ============================================================================
-- Rumah NF3 — Master Meja & Area (Table Section + Floor Table)
-- Jalankan di Supabase SQL Editor setelah pos-app.sql. Idempotent.
-- ============================================================================

create schema if not exists nf3;

create table if not exists nf3.table_sections (
  id         text primary key,
  outlet_id  text not null,
  name       text not null,
  sort_order int not null default 0,
  active     boolean not null default true,
  unique (outlet_id, name)
);

create table if not exists nf3.floor_tables (
  id          text primary key,
  outlet_id   text not null,
  section_id  text not null references nf3.table_sections(id) on delete restrict,
  label       text not null,
  seats       int not null default 2,
  sort_order  int not null default 0,
  active      boolean not null default true,
  unique (outlet_id, label)
);

create index if not exists idx_table_sections_outlet on nf3.table_sections(outlet_id);
create index if not exists idx_floor_tables_outlet on nf3.floor_tables(outlet_id);
create index if not exists idx_floor_tables_section on nf3.floor_tables(section_id);

grant all on nf3.table_sections to anon, authenticated, service_role;
grant all on nf3.floor_tables to anon, authenticated, service_role;
