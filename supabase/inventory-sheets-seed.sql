-- ============================================================================
-- Seed contoh — jalankan SETELAH inventory-sheets.sql (opsional, untuk uji adapter).
-- Ganti / hapus sebelum import CSV data asli dari Google Sheets.
-- ============================================================================

insert into nf3.master_lokasi (kode, nama_lokasi, jenis) values
  ('GDG', 'Gudang Pusat', 'Gudang'),
  ('KBU', 'Kopi Bunder Utara', 'Outlet F&B'),
  ('KSM', 'Kisamen', 'Outlet F&B'),
  ('SMT', 'Samtaro', 'Outlet F&B')
on conflict (kode) do update set
  nama_lokasi = excluded.nama_lokasi,
  jenis = excluded.jenis;

insert into nf3.master_bahan (
  kode_bahan, nama_baku, kategori, satuan_beli, satuan_pakai, konversi,
  harga_per_satuan_pakai, supplier_utama, stok_minimum, stok_aman, stok_maksimum,
  status_aktif, metode_stok
) values
  ('BH-AyamPaha', 'Ayam Paha Fillet', 'Protein', 'kg', 'kg', 1, 42000, 'Supplier Ayam Jaya', 8, 15, 40, 'Aktif', 'Distok'),
  ('BH-SusuUHT', 'Susu UHT 1L', 'Dairy', 'liter', 'ml', 1000, 18, 'Distributor Susu', 50000, 80000, 200000, 'Aktif', 'Distok'),
  ('BH-KopiBubuk', 'Kopi Bubuk Blend', 'Kopi', 'kg', 'g', 1000, 120, 'Roastery NF3', 5000, 10000, 30000, 'Aktif', 'Distok'),
  ('BH-Bawang', 'Bawang Merah', 'Bumbu', 'kg', 'kg', 1, 35000, 'Pasar Induk', 3, 6, 20, 'Aktif', 'Distok'),
  ('BH-SayurBayam', 'Bayam Segar', 'Sayur', 'ikat', 'ikat', 1, 5000, 'Pasar Harian', 10, 20, 50, 'Aktif', 'BeliHarian'),
  ('BH-Gula', 'Gula Pasir (discontinued)', 'Bumbu', 'kg', 'g', 1000, 15, '—', 5000, 10000, 50000, 'Nonaktif', 'Distok')
on conflict (kode_bahan) do update set
  nama_baku = excluded.nama_baku,
  harga_per_satuan_pakai = excluded.harga_per_satuan_pakai,
  supplier_utama = excluded.supplier_utama,
  stok_minimum = excluded.stok_minimum,
  stok_aman = excluded.stok_aman,
  status_aktif = excluded.status_aktif,
  metode_stok = excluded.metode_stok;
