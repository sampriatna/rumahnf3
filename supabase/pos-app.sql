-- ============================================================================
-- Rumah NF3 — Fase D2b (lanjutan): Tabel relasional POS / KDS (ID teks, sesuai app)
-- Jalankan di Supabase SQL Editor (sekali). Idempotent — aman diulang.
--
-- Catatan desain:
--   • ID = teks (mis. 'ORD-0003', 'mi-latte') agar cocok dgn aplikasi sekarang.
--   • Timestamp disimpan sebagai TEXT (ISO verbatim) supaya round-trip persis.
--   • Order item & payment disimpan JSONB di pos_orders (sering berubah saat open).
--   • kds_stations PK gabungan (id, outlet_id) karena id 'bar'/'dapur' dipakai
--     lintas outlet.
-- ============================================================================

create schema if not exists nf3;

create table if not exists nf3.pos_registers (
  id        text primary key,
  outlet_id text not null,
  area_id   text,
  code      text not null,
  name      text not null,
  active    boolean not null default true
);

create table if not exists nf3.menu_categories (
  id         text primary key,
  outlet_id  text not null,
  name       text not null,
  sort_order int not null default 0,
  active     boolean not null default true
);

create table if not exists nf3.menu_items (
  id                text primary key,
  outlet_id         text not null,
  category_id       text,
  sku               text,
  name              text not null,
  description       text,
  image_url         text,
  base_price        numeric(14,2) not null default 0,
  tax_included      boolean not null default true,
  default_area_id   text,
  prep_time_minutes int,
  cost_price        numeric(14,2),
  sold_out          boolean not null default false,
  active            boolean not null default true
);

create table if not exists nf3.menu_item_variants (
  id           text primary key,
  menu_item_id text not null,
  outlet_id    text not null,
  name         text not null,
  sku          text,
  price        numeric(14,2) not null default 0,
  cost_price   numeric(14,2),
  sort_order   int not null default 0,
  active       boolean not null default true
);

create table if not exists nf3.menu_catalog_meta (
  outlet_id  text primary key,
  version    int not null default 1,
  updated_at text not null
);

create table if not exists nf3.menu_modifiers (
  id          text primary key,
  outlet_id   text not null,
  name        text not null,
  price_delta numeric(14,2) not null default 0,
  active      boolean not null default true
);

create table if not exists nf3.menu_item_modifiers (
  menu_item_id text not null,
  modifier_id  text not null,
  primary key (menu_item_id, modifier_id)
);

create table if not exists nf3.pos_recipes (
  menu_item_id text primary key,
  name         text not null,
  lines        jsonb not null default '[]'
);

create table if not exists nf3.pos_shifts (
  id                    text primary key,
  outlet_id             text not null,
  register_id           text not null,
  shift_label           text not null,
  opened_by             text,
  closed_by             text,
  opening_float         numeric(14,2) not null default 0,
  status                text not null,
  opened_at             text,
  closed_at             text,
  system_cash_total     numeric(14,2),
  system_qris_total     numeric(14,2),
  system_online_total   numeric(14,2),
  system_grand_total    numeric(14,2),
  order_count           int,
  setoran_submission_id text
);

create table if not exists nf3.pos_orders (
  id                     text primary key,
  outlet_id              text not null,
  shift_id               text,
  order_number           text not null,
  channel                text not null,
  table_label            text,
  customer_name          text,
  status                 text not null,
  payment_status         text not null,
  subtotal               numeric(14,2) not null default 0,
  discount_amount        numeric(14,2) not null default 0,
  tax_amount             numeric(14,2) not null default 0,
  service_charge_amount  numeric(14,2) not null default 0,
  total                  numeric(14,2) not null default 0,
  external_platform      text,
  external_order_id      text,
  created_by             text,
  created_at             text,
  paid_at                text,
  completed_at           text,
  items                  jsonb not null default '[]',
  payments               jsonb not null default '[]',
  integrated_at          text,
  inventory_integrated   boolean,
  customer_id            text,
  member_code            text,
  loyalty_program_applied text,
  total_gross            numeric(14,2),
  total_discount         numeric(14,2),
  total_loyalty_discount numeric(14,2),
  total_voucher_discount numeric(14,2),
  total_net              numeric(14,2),
  points_earned          int,
  points_redeemed        int,
  stamps_earned          int,
  reward_redeemed_status text,
  loyalty_earned         boolean,
  void_reason            text,
  voided_at              text,
  voided_by              text,
  loyalty_reversed       boolean
);
create index if not exists idx_pos_orders_outlet on nf3.pos_orders(outlet_id, created_at);
create index if not exists idx_pos_orders_shift on nf3.pos_orders(shift_id);

create table if not exists nf3.pos_kds_stations (
  id        text not null,
  outlet_id text not null,
  name      text not null,
  primary key (id, outlet_id)
);

create table if not exists nf3.kds_tickets (
  id            text primary key,
  order_id      text not null,
  order_item_id text not null,
  outlet_id     text not null,
  area_id       text not null,
  ticket_number int,
  status        text not null,
  priority      int not null default 0,
  fired_at      text,
  ready_at      text,
  served_at     text,
  item_name     text not null,
  qty           numeric(10,2) not null default 1,
  note          text,
  table_label   text,
  channel       text not null,
  order_number  text,
  cooking_at    text,
  bumped_at     text,
  bump_reason   text
);
create index if not exists idx_kds_tickets_station on nf3.kds_tickets(outlet_id, area_id, status);

-- ---- Hak akses (schema baru perlu grant) -----------------------------------
grant usage on schema nf3 to anon, authenticated, service_role;
grant all on all tables in schema nf3 to anon, authenticated, service_role;
alter default privileges in schema nf3
  grant all on tables to anon, authenticated, service_role;
