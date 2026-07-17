-- ============================================================================
-- Rumah NF3 — Fase L1: Member / Customer Loyalty Program
-- DESAIN SCHEMA SAJA — implementasi awal pakai in-memory store (lib/loyalty*.ts).
--
-- Prasyarat: schema.sql (RBAC/org) + pos-kds.sql (orders/order_items).
--
-- Prinsip desain:
--   • loyalty_transactions = LEDGER poin/stamp append-only (earn/redeem/reversal).
--     Agregat di customer_memberships hanya CACHE, bisa direkalkulasi dari ledger.
--   • Poin GABUNGAN lintas outlet (keputusan owner) → outlet_scope = 'all'.
--   • Item gratis (reward) TIDAK mengurangi kas. Stok tetap berkurang via
--     stock_movements (source_doc_type = 'loyalty_redemption'). promo_cost =
--     harga jual normal, dicatat sebagai METRIK report (bukan kas keluar).
--   • Nomor HP unik = anti-fraud dasar. Semua perubahan poin lewat ledger = audit.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- LOOKUP / ENUM (text + check constraint)
-- ---------------------------------------------------------------------------
-- customer_status:        active | inactive
-- loyalty_program_type:   point | stamp | buy_x_get_y | voucher | birthday
--                         | tier_benefit | cashback
-- loyalty_tx_type:        earn_point | redeem_point | earn_stamp | redeem_stamp
--                         | voucher_issued | voucher_used | point_expired
--                         | manual_adjustment | reversal
-- voucher_type:           discount_amount | discount_percent | free_item
-- voucher_status:         active | used | expired | cancelled
-- reward_type:            free_item | discount_voucher | point_discount

-- ---------------------------------------------------------------------------
-- CUSTOMERS
-- ---------------------------------------------------------------------------
create table if not exists nf3.customers (
  id            uuid primary key default gen_random_uuid(),
  full_name     text not null,
  phone         text not null unique,                 -- anti-fraud: HP unik
  email         text,
  birth_date    date,
  gender        text,
  registered_outlet_id uuid references nf3.outlets(id),
  member_code   text not null unique,                 -- NF3-100001
  qr_code_url   text,
  status        text not null default 'active' check (status in ('active','inactive')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- MEMBERSHIP TIERS (L2 — definisi disiapkan, auto-assign belum dibangun)
-- ---------------------------------------------------------------------------
create table if not exists nf3.membership_tiers (
  id                  uuid primary key default gen_random_uuid(),
  tier_name           text not null,
  min_spending        numeric(14,2) not null default 0,
  min_transactions    int not null default 0,
  benefit_description text,
  active_status       boolean not null default true
);

-- ---------------------------------------------------------------------------
-- CUSTOMER MEMBERSHIPS (agregat / cache — sumber kebenaran = ledger)
-- ---------------------------------------------------------------------------
create table if not exists nf3.customer_memberships (
  customer_id         uuid primary key references nf3.customers(id) on delete cascade,
  tier_id             uuid references nf3.membership_tiers(id),
  total_points        int not null default 0,
  total_stamps        int not null default 0,   -- per-program disimpan di jsonb bila perlu
  total_spending      numeric(14,2) not null default 0,
  total_transactions  int not null default 0,
  last_transaction_at timestamptz,
  updated_at          timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- LOYALTY PROGRAMS + RULES
-- ---------------------------------------------------------------------------
create table if not exists nf3.loyalty_programs (
  id            uuid primary key default gen_random_uuid(),
  program_name  text not null,
  program_type  text not null check (program_type in
                  ('point','stamp','buy_x_get_y','voucher','birthday','tier_benefit','cashback')),
  outlet_scope  text not null default 'all',          -- 'all' atau csv outlet id
  start_date    date,
  end_date      date,
  active_status boolean not null default true,
  description   text
);

create table if not exists nf3.loyalty_rules (
  id                      uuid primary key default gen_random_uuid(),
  program_id              uuid not null references nf3.loyalty_programs(id) on delete cascade,
  rule_type               text not null,
  min_purchase_amount     numeric(14,2),
  menu_id                 uuid references nf3.menu_items(id),
  category_id             uuid references nf3.menu_categories(id),
  earn_point_rate         numeric(14,2),               -- Rp sekian = 1 poin
  required_stamp_count    int,
  reward_menu_id          uuid references nf3.menu_items(id),
  reward_discount_amount  numeric(14,2),
  reward_discount_percent numeric(5,2),
  max_redemption          int,
  expiry_days             int,
  active_status           boolean not null default true
);

-- ---------------------------------------------------------------------------
-- LOYALTY TRANSACTIONS (LEDGER append-only — audit log poin/stamp)
-- ---------------------------------------------------------------------------
create table if not exists nf3.loyalty_transactions (
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid not null references nf3.customers(id) on delete cascade,
  order_id      uuid references nf3.orders(id),
  program_id    uuid references nf3.loyalty_programs(id),
  tx_type       text not null check (tx_type in
                  ('earn_point','redeem_point','earn_stamp','redeem_stamp',
                   'voucher_issued','voucher_used','point_expired',
                   'manual_adjustment','reversal')),
  points_change int not null default 0,
  stamps_change int not null default 0,
  description   text,
  created_by    text,
  created_at    timestamptz not null default now()
);
create index if not exists idx_loyalty_tx_customer on nf3.loyalty_transactions(customer_id);
create index if not exists idx_loyalty_tx_order on nf3.loyalty_transactions(order_id);

-- ---------------------------------------------------------------------------
-- VOUCHERS
-- ---------------------------------------------------------------------------
create table if not exists nf3.vouchers (
  id                  uuid primary key default gen_random_uuid(),
  customer_id         uuid not null references nf3.customers(id) on delete cascade,
  program_id          uuid references nf3.loyalty_programs(id),
  voucher_code        text not null unique,
  voucher_type        text not null check (voucher_type in
                        ('discount_amount','discount_percent','free_item')),
  discount_amount     numeric(14,2),
  discount_percent    numeric(5,2),
  reward_menu_id      uuid references nf3.menu_items(id),
  min_purchase_amount numeric(14,2),
  outlet_scope        text not null default 'all',
  valid_from          timestamptz,
  valid_until         timestamptz,
  status              text not null default 'active' check (status in
                        ('active','used','expired','cancelled')),
  source              text,                            -- stamp_reward | manual | birthday | ...
  used_order_id       uuid references nf3.orders(id),
  used_at             timestamptz,
  created_at          timestamptz not null default now()
);
create index if not exists idx_voucher_customer on nf3.vouchers(customer_id, status);

-- ---------------------------------------------------------------------------
-- REWARD REDEMPTIONS (catatan promo cost — NON-KAS, untuk report)
-- ---------------------------------------------------------------------------
create table if not exists nf3.reward_redemptions (
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid not null references nf3.customers(id),
  order_id      uuid not null references nf3.orders(id),
  program_id    uuid references nf3.loyalty_programs(id),
  voucher_id    uuid references nf3.vouchers(id),
  reward_type   text not null check (reward_type in
                  ('free_item','discount_voucher','point_discount')),
  reward_value  numeric(14,2) not null default 0,
  normal_price  numeric(14,2) not null default 0,
  promo_cost    numeric(14,2) not null default 0,      -- harga jual normal item gratis
  redeemed_by   text,
  outlet_id     uuid references nf3.outlets(id),
  created_at    timestamptz not null default now()
);
create index if not exists idx_redemption_outlet_date on nf3.reward_redemptions(outlet_id, created_at);

-- ---------------------------------------------------------------------------
-- CUSTOMER SEGMENTS (struktur untuk marketing/WA — BELUM diaktifkan di L1)
-- ---------------------------------------------------------------------------
create table if not exists nf3.customer_segments (
  id              uuid primary key default gen_random_uuid(),
  segment_name    text not null,
  rule_description text,
  active_status   boolean not null default true
);
create table if not exists nf3.customer_segment_members (
  segment_id   uuid not null references nf3.customer_segments(id) on delete cascade,
  customer_id  uuid not null references nf3.customers(id) on delete cascade,
  added_at     timestamptz not null default now(),
  primary key (segment_id, customer_id)
);

-- ---------------------------------------------------------------------------
-- ORDERS / ORDER_ITEMS — kolom tambahan untuk member (ALTER pos-kds.sql)
-- ---------------------------------------------------------------------------
alter table nf3.orders
  add column if not exists customer_id             uuid references nf3.customers(id),
  add column if not exists member_code             text,
  add column if not exists loyalty_program_applied text,
  add column if not exists total_gross             numeric(14,2),
  add column if not exists total_discount          numeric(14,2),
  add column if not exists total_loyalty_discount  numeric(14,2),
  add column if not exists total_voucher_discount  numeric(14,2),
  add column if not exists total_net               numeric(14,2),
  add column if not exists points_earned           int default 0,
  add column if not exists points_redeemed         int default 0,
  add column if not exists stamps_earned           int default 0,
  add column if not exists reward_redeemed_status  text;

alter table nf3.order_items
  add column if not exists is_reward_item       boolean default false,
  add column if not exists reward_program_id    uuid references nf3.loyalty_programs(id),
  add column if not exists reward_voucher_id    uuid references nf3.vouchers(id),
  add column if not exists normal_price         numeric(14,2),
  add column if not exists discount_amount      numeric(14,2),
  add column if not exists final_price          numeric(14,2),
  add column if not exists stock_deducted_status text;
