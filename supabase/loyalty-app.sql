-- ============================================================================
-- Rumah NF3 — Fase D2b: Tabel relasional Member/Loyalty (ID teks, sesuai app)
-- Jalankan di Supabase SQL Editor (sekali). Idempotent — aman diulang.
--
-- Pendekatan pragmatis: ID = teks (mis. 'cust-1', 'tier-gold') agar cocok dgn
-- aplikasi sekarang tanpa rewrite besar. Kolom kompleks (stamps, outlet_scope,
-- eligible_category_ids) disimpan jsonb. FK ke modul lain (outlet/menu/order)
-- sengaja dibiarkan kolom teks dulu sampai modul tsb ikut relasional.
-- ============================================================================

create schema if not exists nf3;

-- ---- Tiers -----------------------------------------------------------------
create table if not exists nf3.membership_tiers (
  id                  text primary key,
  name                text not null,
  min_spending        numeric(14,2) not null default 0,
  min_transactions    int not null default 0,
  discount_percent    numeric(5,2) not null default 0,
  benefit_description text,
  active              boolean not null default true
);

-- ---- Programs --------------------------------------------------------------
create table if not exists nf3.loyalty_programs (
  id                    text primary key,
  name                  text not null,
  type                  text not null check (type in ('point','stamp')),
  outlet_scope          jsonb not null default '"all"',
  active                boolean not null default true,
  earn_per_rupiah       numeric(14,2),
  min_purchase_for_point numeric(14,2),
  eligible_category_ids jsonb,
  required_stamp_count  int,
  reward_label          text,
  description           text
);

-- ---- Customers -------------------------------------------------------------
create table if not exists nf3.customers (
  id                     text primary key,
  full_name              text not null,
  phone                  text not null unique,
  birth_date             text,
  registered_outlet_id   text,
  member_code            text not null unique,
  status                 text not null default 'active' check (status in ('active','inactive')),
  total_points           int not null default 0,
  total_spending         numeric(14,2) not null default 0,
  total_transactions     int not null default 0,
  stamps                 jsonb not null default '{}',
  tier_id                text references nf3.membership_tiers(id),
  first_purchase_rewarded boolean,
  birthday_voucher_year  int,
  winback_voucher_at     timestamptz,
  last_transaction_at    timestamptz,
  created_at             timestamptz not null default now()
);

-- ---- Loyalty transactions (ledger append-only) -----------------------------
create table if not exists nf3.loyalty_txns (
  id            text primary key,
  customer_id   text not null references nf3.customers(id) on delete cascade,
  order_id      text,
  program_id    text,
  tx_type       text not null,
  points_change int not null default 0,
  stamps_change int not null default 0,
  description   text,
  created_by    text,
  created_at    timestamptz not null default now()
);
create index if not exists idx_loyalty_txns_customer on nf3.loyalty_txns(customer_id);

-- ---- Vouchers --------------------------------------------------------------
create table if not exists nf3.vouchers (
  id                  text primary key,
  customer_id         text not null references nf3.customers(id) on delete cascade,
  program_id          text,
  code                text not null unique,
  type                text not null check (type in ('discount_amount','free_item')),
  discount_amount     numeric(14,2),
  reward_menu_id      text,
  reward_menu_name    text,
  reward_normal_price numeric(14,2),
  min_purchase_amount numeric(14,2),
  outlet_scope        jsonb not null default '"all"',
  valid_until         timestamptz,
  status              text not null default 'active' check (status in ('active','used','expired','cancelled')),
  used_order_id       text,
  used_at             timestamptz,
  source              text,
  created_at          timestamptz not null default now()
);
create index if not exists idx_vouchers_customer on nf3.vouchers(customer_id, status);

-- ---- Reward redemptions (promo cost — non-kas) -----------------------------
create table if not exists nf3.reward_redemptions (
  id           text primary key,
  customer_id  text not null,
  order_id     text not null,
  voucher_id   text,
  reward_type  text not null check (reward_type in ('free_item','discount_voucher','point_discount')),
  reward_value numeric(14,2) not null default 0,
  normal_price numeric(14,2) not null default 0,
  promo_cost   numeric(14,2) not null default 0,
  redeemed_by  text,
  outlet_id    text,
  created_at   timestamptz not null default now()
);
create index if not exists idx_redemptions_outlet on nf3.reward_redemptions(outlet_id, created_at);

-- ---- Hak akses (schema baru perlu grant; jalankan sekali) -------------------
grant usage on schema nf3 to anon, authenticated, service_role;
grant all on all tables in schema nf3 to anon, authenticated, service_role;
alter default privileges in schema nf3
  grant all on tables to anon, authenticated, service_role;
