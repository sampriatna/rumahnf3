-- Jalankan sekali di Supabase SQL Editor (atau: npm run migrate:inventory-extra)
-- Master supplier + view saldo per lokasi

create table if not exists nf3.master_supplier (
  kode       text primary key,
  nama       text not null,
  kategori   text not null default 'Lainnya',
  hari_order text not null default 'Harian'
);

grant all on nf3.master_supplier to anon, authenticated, service_role;

insert into nf3.master_supplier (kode, nama, kategori, hari_order) values
  ('SUP-001', 'Lotte Mart', 'Sembako/Frozen', 'Harian'),
  ('SUP-005', 'Offline Terdekat', 'Sayur & Sembako', 'Harian'),
  ('SUP-006', 'Pasar Jagasatru', 'Sayuran & Sembako', 'Mingguan'),
  ('SUP-007', 'Suplier', 'Bahan Fresh', 'Harian'),
  ('SUP-008', 'Djaja', 'Plastik & Kemasan', 'Harian'),
  ('SUP-009', 'Frozen Food', 'Makanan Frozen', 'Harian'),
  ('SUP-038', 'Prima', 'Bebek/Ayam', 'Harian')
on conflict (kode) do update set
  nama = excluded.nama,
  kategori = excluded.kategori,
  hari_order = excluded.hari_order;

create or replace view nf3.v_saldo_per_lokasi as
with latest_opname as (
  select distinct on (kode_bahan, lokasi)
    kode_bahan,
    lokasi,
    qty_awal
  from nf3.opname_awal
  order by kode_bahan, lokasi, tanggal desc
)
select
  b.kode_bahan,
  b.nama_baku,
  l.kode as lokasi,
  l.nama_lokasi,
  coalesce(o.qty_awal, 0)
    + coalesce((
        select sum(m.qty) from nf3.barang_masuk m
        where m.kode_bahan = b.kode_bahan and m.lokasi_tujuan = l.kode
      ), 0)
    + coalesce((
        select sum(t.qty) from nf3.transfer_stok t
        where t.kode_bahan = b.kode_bahan and t.ke_lokasi = l.kode
      ), 0)
    - coalesce((
        select sum(t.qty) from nf3.transfer_stok t
        where t.kode_bahan = b.kode_bahan and t.dari_lokasi = l.kode
      ), 0)
    - coalesce((
        select sum(p.qty) from nf3.pemakaian_outlet p
        where p.kode_bahan = b.kode_bahan and p.lokasi = l.kode
      ), 0)
    - coalesce((
        select sum(w.qty) from nf3.waste_selisih w
        where w.kode_bahan = b.kode_bahan and w.lokasi = l.kode
      ), 0) as saldo,
  b.satuan_pakai,
  b.harga_per_satuan_pakai,
  b.stok_minimum,
  b.stok_aman
from nf3.master_bahan b
cross join nf3.master_lokasi l
left join latest_opname o
  on o.kode_bahan = b.kode_bahan and o.lokasi = l.kode
where b.status_aktif = 'Aktif';

grant select on nf3.v_saldo_per_lokasi to anon, authenticated, service_role;
