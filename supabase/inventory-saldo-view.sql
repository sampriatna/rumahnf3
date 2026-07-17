-- ============================================================================
-- Rumah NF3 — View saldo per lokasi (opsional, jalankan setelah inventory-sheets.sql)
-- Rumus sama dengan lib/inventory-metrics.ts saldoLokasi()
-- ============================================================================

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
