-- ============================================================================
-- Rumah NF3 — Fase D2a: Backup Cloud (snapshot) ke Supabase
-- Jalankan di Supabase SQL Editor (sekali). Idempotent — aman diulang.
--
-- Tabel ini menyimpan SELURUH state aplikasi sebagai satu dokumen JSON.
-- Tujuan: backup cloud durable + restore otomatis saat pindah/kehilangan disk.
-- Fase berikutnya (D2b): tabel relasional per-modul menggantikan snapshot ini.
-- ============================================================================

create schema if not exists nf3;

create table if not exists nf3.app_state (
  id          text primary key,                 -- selalu 'main'
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);

-- Catatan: akses tabel ini HANYA via service-role key di server (lib/cloud-persist.ts).
-- Tidak perlu RLS sekarang karena anon key tidak menyentuh tabel ini.

-- ---------------------------------------------------------------------------
-- HAK AKSES: schema baru tidak otomatis dapat grant (beda dgn 'public').
-- Tanpa ini, API gagal: 42501 "permission denied for schema nf3".
-- ---------------------------------------------------------------------------
grant usage on schema nf3 to anon, authenticated, service_role;
grant all on all tables in schema nf3 to anon, authenticated, service_role;
grant all on all sequences in schema nf3 to anon, authenticated, service_role;
alter default privileges in schema nf3
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema nf3
  grant all on sequences to anon, authenticated, service_role;

-- ============================================================================
-- WAJIB: expose schema 'nf3' ke API
-- Dashboard → Project Settings → API → "Exposed schemas" → tambahkan: nf3
-- (atau Settings → API → Data API → Exposed schemas)
-- Tanpa ini, query akan gagal: PGRST106 "Invalid schema: nf3".
-- ============================================================================
