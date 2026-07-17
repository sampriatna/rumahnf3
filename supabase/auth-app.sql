-- ============================================================================
-- Rumah NF3 — Fase D3: Auth (Supabase Auth + PIN staf + PIN kasir per outlet)
-- Jalankan di Supabase SQL Editor (sekali). Idempotent — aman diulang.
--
-- Catatan:
--   • auth_accounts = profil app (email via Supabase Auth, HP+PIN untuk staf).
--   • outlet_cashier_pins = PIN kasir per outlet (dikelola owner dari dashboard).
--   • Super admin dibuat via: npm run seed:admin (baca .env.local).
-- ============================================================================

create schema if not exists nf3;

create table if not exists nf3.auth_accounts (
  id             text primary key,
  auth_user_id   uuid unique,
  email          text unique,
  phone          text unique,
  full_name      text not null,
  role           text not null,
  outlet_id      text,
  is_super_admin boolean not null default false,
  pin_hash       text,
  active         boolean not null default true,
  capabilities   text[] default array['forms'],
  created_at     text not null,
  updated_at     text not null
);
create index if not exists idx_auth_accounts_phone on nf3.auth_accounts(phone) where phone is not null;
create index if not exists idx_auth_accounts_email on nf3.auth_accounts(email) where email is not null;

create table if not exists nf3.outlet_cashier_pins (
  id              text primary key,
  outlet_id       text not null,
  outlet_name     text,
  label           text not null,
  pin_hash        text not null,
  role            text not null default 'staff',
  active          boolean not null default true,
  created_by_id   text,
  created_by_name text,
  created_at      text not null,
  updated_at      text not null
);
create index if not exists idx_outlet_cashier_pins_outlet on nf3.outlet_cashier_pins(outlet_id, active);

-- Migrasi kolom capabilities (aman diulang).
alter table nf3.auth_accounts add column if not exists capabilities text[] default array['forms'];

-- ---- Hak akses --------------------------------------------------------------
grant usage on schema nf3 to anon, authenticated, service_role;
grant all on all tables in schema nf3 to anon, authenticated, service_role;
alter default privileges in schema nf3
  grant all on tables to anon, authenticated, service_role;
