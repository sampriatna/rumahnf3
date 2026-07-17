-- ============================================================================
-- Rumah NF3 — Inventory model Google Sheets (Master Bahan, movement, dll.)
-- Jalankan di Supabase SQL Editor SETELAH schema.sql (sekali). Idempotent.
--
-- Pemetaan 1:1 dengan types/inventory.ts — siap import CSV dari Sheets.
-- Finance terpisah: harga_per_satuan_pakai = patokan COGS/nilai stok, BUKAN ledger.
-- ============================================================================

create schema if not exists nf3;

-- ---- Master ---------------------------------------------------------------
create table if not exists nf3.master_lokasi (
  kode         text primary key,
  nama_lokasi  text not null,
  jenis        text not null default 'Outlet'
);

create table if not exists nf3.master_bahan (
  kode_bahan              text primary key,
  nama_baku               text not null,
  kategori                text not null default 'Lainnya',
  satuan_beli             text not null,
  satuan_pakai            text not null,
  konversi                numeric(14,4) not null default 1 check (konversi > 0),
  harga_per_satuan_pakai  numeric(14,2) not null default 0 check (harga_per_satuan_pakai >= 0),
  supplier_utama          text not null default '—',
  stok_minimum            numeric(14,4) not null default 0,
  stok_aman               numeric(14,4) not null default 0,
  stok_maksimum           numeric(14,4) not null default 0,
  status_aktif            text not null default 'Aktif'
    check (status_aktif in ('Aktif', 'Nonaktif')),
  metode_stok             text not null default 'Distok'
    check (metode_stok in ('Distok', 'BeliHarian'))
);

create index if not exists idx_master_bahan_aktif on nf3.master_bahan(status_aktif, metode_stok);

-- ---- Movement & saldo baseline --------------------------------------------
create table if not exists nf3.opname_awal (
  id          text primary key,
  tanggal     text not null,
  kode_bahan  text not null references nf3.master_bahan(kode_bahan) on delete restrict,
  lokasi      text not null references nf3.master_lokasi(kode) on delete restrict,
  qty_awal    numeric(14,4) not null default 0 check (qty_awal >= 0)
);
create index if not exists idx_opname_bahan_lok on nf3.opname_awal(kode_bahan, lokasi, tanggal desc);

create table if not exists nf3.barang_masuk (
  id             text primary key,
  tanggal        text not null,
  kode_bahan     text not null references nf3.master_bahan(kode_bahan) on delete restrict,
  qty            numeric(14,4) not null check (qty > 0),
  satuan         text not null,
  total_harga    numeric(14,2) not null default 0,
  supplier       text not null default '—',
  lokasi_tujuan  text not null references nf3.master_lokasi(kode) on delete restrict,
  diterima_oleh  text not null default '—'
);
create index if not exists idx_barang_masuk_tgl on nf3.barang_masuk(tanggal desc);

create table if not exists nf3.transfer_stok (
  id               text primary key,
  tanggal          text not null,
  kode_bahan       text not null references nf3.master_bahan(kode_bahan) on delete restrict,
  qty              numeric(14,4) not null check (qty > 0),
  dari_lokasi      text not null references nf3.master_lokasi(kode) on delete restrict,
  ke_lokasi        text not null references nf3.master_lokasi(kode) on delete restrict,
  dikeluarkan_oleh text not null default '—',
  diterima_oleh    text not null default '—',
  constraint transfer_lokasi_beda check (dari_lokasi <> ke_lokasi)
);
create index if not exists idx_transfer_tgl on nf3.transfer_stok(tanggal desc);

create table if not exists nf3.pemakaian_outlet (
  id               text primary key,
  tanggal          text not null,
  kode_bahan       text not null references nf3.master_bahan(kode_bahan) on delete restrict,
  qty              numeric(14,4) not null check (qty > 0),
  lokasi           text not null references nf3.master_lokasi(kode) on delete restrict,
  jenis_pemakaian  text not null default 'Penjualan Menu',
  pic              text not null default '—'
);
create index if not exists idx_pemakaian_tgl on nf3.pemakaian_outlet(tanggal desc);

create table if not exists nf3.waste_selisih (
  id          text primary key,
  tanggal     text not null,
  kode_bahan  text not null references nf3.master_bahan(kode_bahan) on delete restrict,
  lokasi      text not null references nf3.master_lokasi(kode) on delete restrict,
  jenis       text not null default 'Lainnya',
  qty         numeric(14,4) not null check (qty > 0),
  alasan      text not null default '—'
);
create index if not exists idx_waste_tgl on nf3.waste_selisih(tanggal desc);

-- ---- Master supplier ------------------------------------------------------
create table if not exists nf3.master_supplier (
  kode       text primary key,
  nama       text not null,
  kategori   text not null default 'Lainnya',
  hari_order text not null default 'Harian'
);

-- ---- Hak akses ------------------------------------------------------------
grant usage on schema nf3 to anon, authenticated, service_role;
grant all on nf3.master_lokasi to anon, authenticated, service_role;
grant all on nf3.master_bahan to anon, authenticated, service_role;
grant all on nf3.opname_awal to anon, authenticated, service_role;
grant all on nf3.barang_masuk to anon, authenticated, service_role;
grant all on nf3.transfer_stok to anon, authenticated, service_role;
grant all on nf3.pemakaian_outlet to anon, authenticated, service_role;
grant all on nf3.waste_selisih to anon, authenticated, service_role;
grant all on nf3.master_supplier to anon, authenticated, service_role;
