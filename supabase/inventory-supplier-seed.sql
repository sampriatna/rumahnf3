-- Seed master supplier (dari prototipe owner dashboard)
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
