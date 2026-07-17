-- ============================================================================
-- Rumah NF3 — Fase D2b (lanjutan): Tabel relasional Reports / AI Insights
-- Jalankan di Supabase SQL Editor (sekali). Idempotent — aman diulang.
--
-- Catatan desain:
--   • ai_insights = riwayat analisis AI Direktur (jsonb untuk array field).
--   • customer_ratings = salinan denormalisasi dari form lapor_kendala +
--     rating eksternal nanti (Google Review, dll.) — untuk query report SQL.
--   • Daily/outlet report tetap dihitung on-the-fly dari modul lain.
-- ============================================================================

create schema if not exists nf3;

create table if not exists nf3.ai_insights (
  id           text primary key,
  generated_at text not null,
  scope_outlet_id text,
  ringkasan    text not null,
  bukti        jsonb not null default '[]',
  analisa      jsonb not null default '[]',
  risiko       jsonb not null default '[]',
  rekomendasi  jsonb not null default '[]',
  prioritas    jsonb not null default '[]'
);
create index if not exists idx_ai_insights_generated on nf3.ai_insights(generated_at desc);

create table if not exists nf3.customer_ratings (
  id            text primary key,
  outlet_id     text,
  outlet_name   text,
  source        text not null,
  category      text not null,
  rating        text,
  comment       text not null,
  status        text not null,
  submission_id text,
  created_at    text not null
);
create index if not exists idx_customer_ratings_outlet on nf3.customer_ratings(outlet_id, created_at desc);
create index if not exists idx_customer_ratings_status on nf3.customer_ratings(status);

-- ---- Hak akses (schema baru perlu grant) -----------------------------------
grant usage on schema nf3 to anon, authenticated, service_role;
grant all on all tables in schema nf3 to anon, authenticated, service_role;
alter default privileges in schema nf3
  grant all on tables to anon, authenticated, service_role;
