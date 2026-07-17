-- ============================================================================
-- Rumah NF3 — Internal Command Center
-- Schema fondasi (Fase 1). Hanya tabel inti RBAC + organisasi.
-- Modul lain (SOP, Form, Approval, Inventory, Purchasing, Finance, Payroll)
-- ditambahkan bertahap pada fase masing-masing — sketsanya ada di bagian bawah
-- file ini sebagai komentar agar arah arsitektur jelas & POS/KDS tetap mungkin.
--
-- Konvensi mengikuti app NF lain: Postgres (Supabase), pgcrypto, trigger updated_at.
-- Dipakai pada Supabase PROJECT BARU khusus Command Center.
-- ============================================================================

create schema if not exists nf3;
create extension if not exists "pgcrypto";

create or replace function nf3.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- ORGANISASI  (outlet sebagai TABEL, bukan enum string -> siap multi-outlet & POS/KDS)
-- ---------------------------------------------------------------------------
create table if not exists nf3.business_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,                                  -- 'Nusa Food Group', 'Nusa Fishing'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists nf3.outlets (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references nf3.business_groups(id) on delete restrict,
  code text not null unique,                           -- 'KBU', 'KSM', 'SMT', 'NF-PRD'
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists nf3.areas (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null references nf3.outlets(id) on delete cascade,
  name text not null,                                  -- 'Dapur', 'Bar', 'Kasir', 'Gudang'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- USER & RBAC  (role bisa lebih dari satu, ber-scope per outlet)
-- ---------------------------------------------------------------------------
create table if not exists nf3.users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text unique,
  pin_hash text,                                       -- bcrypt; login staf via PIN/HP
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists nf3.roles (
  id text primary key,                                 -- 'owner','admin','leader','staff','gudang','purchasing','hr'
  label text not null
);

insert into nf3.roles (id, label) values
  ('owner', 'Owner'),
  ('admin', 'Admin / Keuangan'),
  ('leader', 'Leader Outlet'),
  ('staff', 'Staf'),
  ('gudang', 'Gudang'),
  ('purchasing', 'Purchasing'),
  ('hr', 'HR / Admin Absensi')
on conflict (id) do nothing;

create table if not exists nf3.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references nf3.users(id) on delete cascade,
  role_id text not null references nf3.roles(id) on delete restrict,
  outlet_id uuid references nf3.outlets(id) on delete cascade   -- null = lintas outlet (owner/admin)
);

-- Cegah duplikat (user, role, outlet). COALESCE agar baris outlet NULL juga unik.
create unique index if not exists user_roles_unique_idx
  on nf3.user_roles (user_id, role_id, coalesce(outlet_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- ---------------------------------------------------------------------------
-- TASK MIRROR  (sumber kebenaran tetap di task.nf3.company — ini ringkasan read-only
--               untuk Owner Report; diisi via sinkron API/webhook pada fase berikutnya)
-- ---------------------------------------------------------------------------
create table if not exists nf3.task_mirror (
  task_id text primary key,                            -- id dari Task Dashboard existing
  title text,
  outlet_id uuid references nf3.outlets(id) on delete set null,
  assigned_to uuid references nf3.users(id) on delete set null,
  source_type text,                                    -- 'form','approval','manual',...
  source_id uuid,
  priority text,
  due_date timestamptz,
  status text,                                         -- Open/In Progress/Waiting Verification/...
  synced_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Triggers updated_at
-- ---------------------------------------------------------------------------
drop trigger if exists business_groups_updated_at on nf3.business_groups;
create trigger business_groups_updated_at before update on nf3.business_groups
  for each row execute function nf3.set_updated_at();
drop trigger if exists outlets_updated_at on nf3.outlets;
create trigger outlets_updated_at before update on nf3.outlets
  for each row execute function nf3.set_updated_at();
drop trigger if exists areas_updated_at on nf3.areas;
create trigger areas_updated_at before update on nf3.areas
  for each row execute function nf3.set_updated_at();
drop trigger if exists users_updated_at on nf3.users;
create trigger users_updated_at before update on nf3.users
  for each row execute function nf3.set_updated_at();

-- ---------------------------------------------------------------------------
-- Seed organisasi (sesuaikan nanti)
-- ---------------------------------------------------------------------------
insert into nf3.business_groups (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Nusa Food Group'),
  ('22222222-2222-2222-2222-222222222222', 'Nusa Fishing')
on conflict do nothing;

insert into nf3.outlets (group_id, code, name) values
  ('11111111-1111-1111-1111-111111111111', 'KBU', 'Kopi Buri Umah'),
  ('11111111-1111-1111-1111-111111111111', 'KSM', 'Kisamen'),
  ('11111111-1111-1111-1111-111111111111', 'SMT', 'Samtaro Express'),
  ('22222222-2222-2222-2222-222222222222', 'NF-PRD', 'Nusa Fishing — Produksi')
on conflict (code) do nothing;

-- ============================================================================
-- CATATAN KEAMANAN (WAJIB diterapkan saat modul terkait dibangun)
-- ============================================================================
-- 1. PAYROLL / SLIP GAJI (Fase 6) bersifat RAHASIA per user:
--      - Aktifkan RLS pada tabel nf3.payroll dan buat POLICY: auth.uid() = user_id
--        (staf hanya bisa membaca barisnya sendiri).
--      - Endpoint API payroll WAJIB memverifikasi session.user.id === row.user_id
--        sebelum mengembalikan data. Owner/HR lewat jalur terpisah + AUDIT LOG.
--      - File PDF slip disimpan di storage PRIVAT + signed URL kedaluwarsa.
-- 2. Service-role key HANYA dipakai di server. Jangan pernah mengandalkan
--    "sembunyikan menu di UI" sebagai keamanan — selalu enforce outlet_id & role
--    pada setiap query (mis. leader hanya outletnya).
-- 3. finance_ledger (Fase 6) bersifat APPEND-ONLY + selalu referensi source_doc.

-- ============================================================================
-- SKETSA FASE BERIKUTNYA (belum dibuat — referensi arah saja)
-- ============================================================================
-- Fase 2 — SOP & FORM & FEEDBACK
--   nf3.sops(id, title, category, outlet_scope, role_scope, content, file_url,
--            version, status, created_by, updated_at)
--   nf3.sop_read_logs(id, sop_id, user_id, read_at, quiz_score, acknowledged)
--   nf3.form_submissions(id, form_type, outlet_id, area_id, submitted_by,
--            payload jsonb, photo_urls text[], creates_task, needs_approval,
--            status, created_at)
--   nf3.request_status(id, ref_type, ref_id, user_id, status, note, updated_at)
--
-- Fase 3 — APPROVAL & NOTIFIKASI
--   nf3.approvals(id, request_type, request_id, requested_by, outlet_id, amount,
--            reason, status, approved_by, approval_note, created_at, updated_at)
--   nf3.notification_logs(id, event, target, payload jsonb, status, response_body,
--            created_at)  -- pola sama seperti app buri-umah
--
-- Fase 5 — INVENTORY & PURCHASING
--   nf3.items(id, item_name, category, unit, min_stock, last_purchase_price,
--            supplier_id, active)
--   nf3.stock_movements(id, item_id, outlet_id, warehouse_id, movement_type,
--            qty, unit, source_doc_type, source_doc_id, note, created_by, created_at)
--            -- movement_type: Stock In/Out, Transfer In/Out, Waste, Adjustment, Opname
--   nf3.suppliers(id, name, ...)
--   nf3.purchases(id, supplier_id, requested_by, approved_by, outlet_id,
--            total_estimated, total_actual, payment_method, payment_status,
--            note_url, status, created_at)
--
-- Fase 6 — FINANCE / KAS
--   nf3.finance_ledger(id, date, outlet_id, account_id, transaction_type,
--            category, amount, source_doc_type, source_doc_id, payment_method,
--            note, attachment_url, created_by, created_at)  -- APPEND-ONLY
--   nf3.payroll(...)  -- lihat CATATAN KEAMANAN di atas
--
-- Fase 7 — POS / KDS (DESAIN SAJA — lihat file terpisah)
--   supabase/pos-kds.sql  — DDL lengkap: register, shift, menu, order, KDS, payment
--   lib/pos-kds-roadmap.ts — tipe TypeScript mirror untuk app layer
--   Integrasi: finance_ledger, stock_movements, form setoran_kasir, report/AI
-- ============================================================================
