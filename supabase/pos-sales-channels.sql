-- ============================================================================
-- Rumah NF3 — Sales Mode / Channel (master data POS)
-- Jalankan setelah pos-app.sql. Idempotent.
-- ============================================================================

create schema if not exists nf3;

create table if not exists nf3.pos_sales_channels (
  id              text not null,
  outlet_id       text not null,
  name            text not null,
  kind            text not null default 'other',
  requires_table  boolean not null default false,
  sort_order      int not null default 0,
  is_default      boolean not null default false,
  active          boolean not null default true,
  primary key (id, outlet_id),
  unique (outlet_id, name)
);

create index if not exists idx_pos_sales_channels_outlet on nf3.pos_sales_channels(outlet_id);

grant all on nf3.pos_sales_channels to anon, authenticated, service_role;
