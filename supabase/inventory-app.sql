-- ============================================================================
-- Rumah NF3 — Fase D2b (lanjutan): Tabel relasional Inventory + Purchasing
-- Jalankan di Supabase SQL Editor (sekali). Idempotent — aman diulang.
--
-- Catatan desain:
--   • ID = teks (mis. 'it-ayam', 'sup-1') agar cocok dgn aplikasi sekarang.
--   • Stok per lokasi: PK gabungan (item_id, location_id) — key app "item:loc".
--   • PO line items disimpan JSONB di purchase_orders (camelCase verbatim).
--   • Timestamp disimpan sebagai TEXT (ISO verbatim).
-- ============================================================================

create schema if not exists nf3;

create table if not exists nf3.suppliers (
  id     text primary key,
  name   text not null,
  phone  text,
  active boolean not null default true
);

create table if not exists nf3.inventory_items (
  id                  text primary key,
  item_name           text not null,
  category            text not null,
  unit                text not null,
  min_stock           numeric(14,2) not null default 0,
  last_purchase_price numeric(14,2) not null default 0,
  supplier_id         text references nf3.suppliers(id) on delete set null,
  active              boolean not null default true
);

create table if not exists nf3.stock_levels (
  item_id     text not null references nf3.inventory_items(id) on delete cascade,
  location_id text not null,
  qty         numeric(14,2) not null default 0,
  primary key (item_id, location_id)
);
create index if not exists idx_stock_levels_location on nf3.stock_levels(location_id);

create table if not exists nf3.stock_movements (
  id               text primary key,
  item_id          text not null references nf3.inventory_items(id) on delete cascade,
  item_name        text not null,
  location_id      text not null,
  location_label   text not null,
  movement_type    text not null,
  qty              numeric(14,2) not null,
  unit             text not null,
  source_doc_type  text,
  source_doc_id    text,
  note             text,
  created_by       text not null,
  created_at       text not null
);
create index if not exists idx_stock_movements_item on nf3.stock_movements(item_id, created_at desc);

create table if not exists nf3.purchase_requests (
  id             text primary key,
  submission_id  text not null,
  item_name      text not null,
  qty            numeric(14,2) not null,
  unit           text not null,
  outlet_id      text,
  outlet_name    text,
  urgency        text not null,
  requested_by   text not null,
  status         text not null,
  created_at     text not null
);

create table if not exists nf3.purchase_orders (
  id                   text primary key,
  supplier_id          text not null references nf3.suppliers(id) on delete restrict,
  supplier_name        text not null,
  purchase_request_id  text,
  requested_by         text not null,
  outlet_id            text,
  outlet_name          text,
  items                jsonb not null default '[]',
  total_estimated      numeric(14,2) not null default 0,
  total_actual         numeric(14,2),
  payment_method       text,
  payment_status       text not null,
  status               text not null,
  note                 text,
  created_at           text not null,
  updated_at           text not null
);

-- ---- Hak akses (schema baru perlu grant) -----------------------------------
grant usage on schema nf3 to anon, authenticated, service_role;
grant all on all tables in schema nf3 to anon, authenticated, service_role;
alter default privileges in schema nf3
  grant all on tables to anon, authenticated, service_role;
