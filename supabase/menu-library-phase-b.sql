-- ============================================================================

-- Rumah NF3 — Fase B Library (COGS, sold out, varian, sync meta)

-- Jalankan di Supabase SQL Editor setelah menu-library-phase-a.sql. Idempotent.

-- ============================================================================



-- 1) Harga modal + status habis di produk

alter table nf3.menu_items

  add column if not exists cost_price numeric(14,2),

  add column if not exists sold_out boolean not null default false;



-- 2) Varian produk (ukuran/rasa — harga & SKU beda, mirip Moka)

create table if not exists nf3.menu_item_variants (

  id           text primary key,

  menu_item_id text not null references nf3.menu_items(id) on delete cascade,

  outlet_id    text not null,

  name         text not null,

  sku          text,

  price        numeric(14,2) not null default 0,

  cost_price   numeric(14,2),

  sort_order   int not null default 0,

  active       boolean not null default true

);



create index if not exists idx_menu_item_variants_item on nf3.menu_item_variants(menu_item_id);

create index if not exists idx_menu_item_variants_outlet on nf3.menu_item_variants(outlet_id);



-- 3) Meta sinkronisasi katalog per outlet (untuk indikator Library → POS)

create table if not exists nf3.menu_catalog_meta (

  outlet_id  text primary key,

  version    int not null default 1,

  updated_at text not null

);



grant all on nf3.menu_item_variants to anon, authenticated, service_role;

grant all on nf3.menu_catalog_meta to anon, authenticated, service_role;

