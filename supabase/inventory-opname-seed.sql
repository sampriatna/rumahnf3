-- ============================================================================
-- Seed opname awal GDG — baseline saldo dari prototipe owner dashboard.
-- Tanggal: 2026-05-04. Jalankan setelah master_bahan + master_lokasi terisi.
-- Atau: npm run seed:opname-awal
-- ============================================================================

insert into nf3.opname_awal (id, tanggal, kode_bahan, lokasi, qty_awal) values
  ('opname-seed-AYMBSR-GDG', '2026-05-04', 'AYMBSR', 'GDG', 40),
  ('opname-seed-AYMBPT-GDG', '2026-05-04', 'AYMBPT', 'GDG', 50),
  ('opname-seed-BBK-GDG',    '2026-05-04', 'BBK',    'GDG', 70),
  ('opname-seed-IKNLL-GDG',  '2026-05-04', 'IKNLL',  'GDG', 30),
  ('opname-seed-IKNNL-GDG',  '2026-05-04', 'IKNNL',  'GDG', 10),
  ('opname-seed-BRS-GDG',    '2026-05-04', 'BRS',    'GDG', 25),
  ('opname-seed-GRM-GDG',    '2026-05-04', 'GRM',    'GDG', 35),
  ('opname-seed-GLP-GDG',    '2026-05-04', 'GLP',    'GDG', 15),
  ('opname-seed-GLAB-GDG',   '2026-05-04', 'GLAB',   'GDG', 1000),
  ('opname-seed-MCN-GDG',    '2026-05-04', 'MCN',    'GDG', 3000),
  ('opname-seed-SAYAM-GDG',  '2026-05-04', 'SAYAM',  'GDG', 8000),
  ('opname-seed-ROYSAP-GDG', '2026-05-04', 'ROYSAP', 'GDG', 500),
  ('opname-seed-RCK-GDG',    '2026-05-04', 'RCK',    'GDG', 20),
  ('opname-seed-SATIR-GDG',  '2026-05-04', 'SATIR',  'GDG', 1),
  ('opname-seed-SATER-GDG',  '2026-05-04', 'SATER',  'GDG', 1),
  ('opname-seed-TRGU-GDG',   '2026-05-04', 'TRGU',   'GDG', 4000),
  ('opname-seed-TEPROT-GDG', '2026-05-04', 'TEPROT', 'GDG', 1000),
  ('opname-seed-TERAS-GDG',  '2026-05-04', 'TERAS',  'GDG', 1500),
  ('opname-seed-KECMAS-GDG', '2026-05-04', 'KECMAS', 'GDG', 1),
  ('opname-seed-SUSFRES-GDG','2026-05-04', 'SUSFRES','GDG', 24),
  ('opname-seed-PRIMA-GDG',  '2026-05-04', 'PRIMA',  'GDG', 168),
  ('opname-seed-CLEO-GDG',   '2026-05-04', 'CLEO',   'GDG', 48),
  ('opname-seed-SPRTKCL-GDG','2026-05-04', 'SPRTKCL','GDG', 72),
  ('opname-seed-STRS-GDG',   '2026-05-04', 'STRS',   'GDG', 48),
  ('opname-seed-SRPLCMJN-GDG','2026-05-04','SRPLCMJN','GDG', 4),
  ('opname-seed-SOSDBD-GDG', '2026-05-04', 'SOSDBD', 'GDG', 80),
  ('opname-seed-NGTMBL-GDG', '2026-05-04', 'NGTMBL', 'GDG', 50)
on conflict (id) do update set
  tanggal = excluded.tanggal,
  qty_awal = excluded.qty_awal;

-- GLAC, SKM, SRPVNL, KNTG — belum ada di master_bahan CSV saat ini.
