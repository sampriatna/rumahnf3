-- ============================================================================
-- Rumah NF3 — Fase 7: POS / KDS
-- DESAIN SCHEMA SAJA — belum diimplementasi di aplikasi Next.js.
--
-- Prasyarat: jalankan supabase/schema.sql terlebih dahulu (RBAC + organisasi).
-- Modul Fase 2–6 (form, approval, inventory, finance) migrasi ke Supabase
-- sebelum POS/KDS di-wire ke produksi.
--
-- Prinsip desain:
--   • Harga menu PER OUTLET (KBU ≠ Kisamen ≠ Samtaro).
--   • KDS per AREA/station (Dapur, Bar, Kasir) — pakai nf3.areas yang sudah ada.
--   • Order → payment → finance_ledger (append-only, source_doc_type = 'pos_order').
--   • Order completed → recipe/BOM → nf3.stock_movements (Stock Out).
--   • Shift POS ↔ form setoran_kasir (reconciliation kasir vs sistem).
--   • Platform online (GoFood/Grab/Shopee) = channel terpisah, kas masuk pending.
--   • Nusa Fishing: channel 'wholesale' / 'production' (bukan dine-in).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- LOOKUP / ENUM (text + check constraint — mudah di-extend tanpa migration enum)
-- ---------------------------------------------------------------------------

-- order_status:
--   draft → open → paid → completed | void | refunded
-- kds_status:
--   new → acknowledged → cooking → ready → served | bumped | void
-- payment_method:
--   cash | qris | debit | credit | gofood | grab | shopee | transfer | other
-- order_channel:
--   dine_in | takeaway | delivery_own | gofood | grab | shopee | wholesale | production

-- ---------------------------------------------------------------------------
-- POS REGISTER & SHIFT  (shift = unit rekonsiliasi setoran kasir)
-- ---------------------------------------------------------------------------
create table if not exists nf3.pos_registers (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null references nf3.outlets(id) on delete restrict,
  area_id uuid references nf3.areas(id) on delete set null,  -- biasanya area Kasir
  code text not null,                                         -- 'KASIR-1', 'KASIR-2'
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (outlet_id, code)
);

create table if not exists nf3.pos_shifts (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null references nf3.outlets(id) on delete restrict,
  register_id uuid not null references nf3.pos_registers(id) on delete restrict,
  shift_label text not null,                                  -- 'Pagi', 'Siang', 'Malam'
  opened_by uuid not null references nf3.users(id) on delete restrict,
  closed_by uuid references nf3.users(id) on delete set null,
  opening_float numeric(14,2) not null default 0,             -- uang modal awal laci
  status text not null default 'open'
    check (status in ('open', 'closing', 'closed', 'reconciled')),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  -- Ringkasan sistem (diisi saat close shift)
  system_cash_total numeric(14,2),
  system_qris_total numeric(14,2),
  system_online_total numeric(14,2),
  system_grand_total numeric(14,2),
  order_count int,
  -- Link ke form setoran_kasir (nf3.form_submissions) bila ada
  setoran_submission_id uuid,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pos_shifts_outlet_open_idx
  on nf3.pos_shifts (outlet_id, status)
  where status = 'open';

-- ---------------------------------------------------------------------------
-- MENU CATALOG  (harga per outlet — tidak global)
-- ---------------------------------------------------------------------------
create table if not exists nf3.menu_categories (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null references nf3.outlets(id) on delete cascade,
  name text not null,                                         -- 'Kopi', 'Makanan', 'Add-on'
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (outlet_id, name)
);

create table if not exists nf3.menu_items (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null references nf3.outlets(id) on delete cascade,
  category_id uuid references nf3.menu_categories(id) on delete set null,
  sku text,                                                   -- opsional, untuk scan barcode NF
  name text not null,
  description text,
  base_price numeric(14,2) not null default 0,
  tax_included boolean not null default true,
  -- Station KDS default (bisa override per item)
  default_area_id uuid references nf3.areas(id) on delete set null,
  prep_time_minutes int,                                      -- estimasi untuk KDS SLA
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (outlet_id, name)
);

create table if not exists nf3.menu_modifiers (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null references nf3.outlets(id) on delete cascade,
  name text not null,                                         -- 'Extra Shot', 'Less Sugar'
  price_delta numeric(14,2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists nf3.menu_item_modifiers (
  menu_item_id uuid not null references nf3.menu_items(id) on delete cascade,
  modifier_id uuid not null references nf3.menu_modifiers(id) on delete cascade,
  required boolean not null default false,
  max_select int not null default 1,
  primary key (menu_item_id, modifier_id)
);

-- Item menu bisa di-fire ke lebih dari satu station (contoh: minuman + makanan combo)
create table if not exists nf3.menu_item_stations (
  menu_item_id uuid not null references nf3.menu_items(id) on delete cascade,
  area_id uuid not null references nf3.areas(id) on delete cascade,
  sort_order int not null default 0,
  primary key (menu_item_id, area_id)
);

-- ---------------------------------------------------------------------------
-- RECIPE / BOM  (hubungkan menu → nf3.items untuk auto Stock Out)
-- Dibuat saat Fase 5 inventory sudah di Supabase.
-- ---------------------------------------------------------------------------
create table if not exists nf3.recipes (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references nf3.menu_items(id) on delete cascade,
  name text not null,
  yield_qty numeric(12,4) not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- recipe_lines.item_id → nf3.items (dibuat di migration inventory Fase 5)
-- Contoh kolom di sini; FK ke items ditambahkan setelah tabel items ada:
create table if not exists nf3.recipe_lines (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references nf3.recipes(id) on delete cascade,
  item_id uuid not null,                                      -- FK → nf3.items(id)
  qty numeric(12,4) not null,
  unit text not null,
  note text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- ORDERS
-- ---------------------------------------------------------------------------
create table if not exists nf3.orders (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null references nf3.outlets(id) on delete restrict,
  shift_id uuid references nf3.pos_shifts(id) on delete set null,
  order_number text not null,                                 -- 'KBU-20260612-0042'
  channel text not null default 'dine_in'
    check (channel in (
      'dine_in', 'takeaway', 'delivery_own',
      'gofood', 'grab', 'shopee',
      'wholesale', 'production'
    )),
  table_label text,                                           -- 'Meja 5', 'Takeaway #3'
  customer_name text,
  customer_phone text,
  status text not null default 'open'
    check (status in ('draft', 'open', 'paid', 'completed', 'void', 'refunded')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'partial', 'paid', 'refunded')),
  subtotal numeric(14,2) not null default 0,
  discount_amount numeric(14,2) not null default 0,
  discount_note text,
  tax_amount numeric(14,2) not null default 0,
  service_charge_amount numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  -- Platform eksternal
  external_platform text,                                     -- 'gofood', 'grab', ...
  external_order_id text,
  external_status text,
  -- Audit
  created_by uuid references nf3.users(id) on delete set null,
  voided_by uuid references nf3.users(id) on delete set null,
  void_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz,
  completed_at timestamptz,
  unique (outlet_id, order_number)
);

create index if not exists orders_outlet_created_idx
  on nf3.orders (outlet_id, created_at desc);

create index if not exists orders_shift_idx
  on nf3.orders (shift_id)
  where shift_id is not null;

create table if not exists nf3.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references nf3.orders(id) on delete cascade,
  menu_item_id uuid references nf3.menu_items(id) on delete set null,
  -- Snapshot saat order (harga/menu bisa berubah nanti)
  name_snapshot text not null,
  qty numeric(10,2) not null default 1,
  unit_price numeric(14,2) not null,
  modifiers_snapshot jsonb not null default '[]',               -- [{name, price_delta}]
  line_total numeric(14,2) not null,
  note text,                                                  -- 'tanpa es', 'pedas'
  status text not null default 'pending'
    check (status in ('pending', 'fired', 'cooking', 'ready', 'served', 'void')),
  fired_at timestamptz,
  ready_at timestamptz,
  served_at timestamptz,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_idx
  on nf3.order_items (order_id);

-- ---------------------------------------------------------------------------
-- KDS TICKETS  (satu ticket per order_item × station)
-- ---------------------------------------------------------------------------
create table if not exists nf3.kds_tickets (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references nf3.orders(id) on delete cascade,
  order_item_id uuid not null references nf3.order_items(id) on delete cascade,
  outlet_id uuid not null references nf3.outlets(id) on delete restrict,
  area_id uuid not null references nf3.areas(id) on delete restrict,
  ticket_number int,                                          -- nomor antrian di station
  status text not null default 'new'
    check (status in ('new', 'acknowledged', 'cooking', 'ready', 'served', 'bumped', 'void')),
  priority int not null default 0,                            -- 0=normal, 1=rush
  assigned_to uuid references nf3.users(id) on delete set null,
  fired_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  cooking_at timestamptz,
  ready_at timestamptz,
  served_at timestamptz,
  bumped_at timestamptz,
  bump_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists kds_tickets_station_active_idx
  on nf3.kds_tickets (outlet_id, area_id, status)
  where status not in ('served', 'bumped', 'void');

-- ---------------------------------------------------------------------------
-- PAYMENTS  (split payment: cash + qris dalam satu order)
-- ---------------------------------------------------------------------------
create table if not exists nf3.order_payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references nf3.orders(id) on delete cascade,
  method text not null
    check (method in ('cash', 'qris', 'debit', 'credit', 'gofood', 'grab', 'shopee', 'transfer', 'other')),
  amount numeric(14,2) not null,
  reference text,                                             -- no ref QRIS / platform
  status text not null default 'captured'
    check (status in ('pending', 'captured', 'failed', 'refunded')),
  -- Mapping ke akun finance (lihat lib/finance.ts AccountId)
  finance_account_id text,                                    -- 'cash_physical', 'qris_pending', ...
  ledger_entry_id uuid,                                       -- FK → nf3.finance_ledger(id)
  created_by uuid references nf3.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists order_payments_order_idx
  on nf3.order_payments (order_id);

-- ---------------------------------------------------------------------------
-- ORDER EVENTS  (audit trail — siapa ubah status apa)
-- ---------------------------------------------------------------------------
create table if not exists nf3.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references nf3.orders(id) on delete cascade,
  event_type text not null,                                   -- 'status_change', 'payment', 'void', 'kds_bump'
  from_status text,
  to_status text,
  payload jsonb not null default '{}',
  actor_id uuid references nf3.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- TRIGGERS updated_at
-- ---------------------------------------------------------------------------
drop trigger if exists pos_registers_updated_at on nf3.pos_registers;
create trigger pos_registers_updated_at before update on nf3.pos_registers
  for each row execute function nf3.set_updated_at();

drop trigger if exists pos_shifts_updated_at on nf3.pos_shifts;
create trigger pos_shifts_updated_at before update on nf3.pos_shifts
  for each row execute function nf3.set_updated_at();

drop trigger if exists menu_categories_updated_at on nf3.menu_categories;
create trigger menu_categories_updated_at before update on nf3.menu_categories
  for each row execute function nf3.set_updated_at();

drop trigger if exists menu_items_updated_at on nf3.menu_items;
create trigger menu_items_updated_at before update on nf3.menu_items
  for each row execute function nf3.set_updated_at();

drop trigger if exists recipes_updated_at on nf3.recipes;
create trigger recipes_updated_at before update on nf3.recipes
  for each row execute function nf3.set_updated_at();

drop trigger if exists orders_updated_at on nf3.orders;
create trigger orders_updated_at before update on nf3.orders
  for each row execute function nf3.set_updated_at();

drop trigger if exists kds_tickets_updated_at on nf3.kds_tickets;
create trigger kds_tickets_updated_at before update on nf3.kds_tickets
  for each row execute function nf3.set_updated_at();

-- ---------------------------------------------------------------------------
-- SEED CONTOH AREA (untuk KDS station) — sesuaikan per outlet nyata
-- ---------------------------------------------------------------------------
-- insert into nf3.areas (outlet_id, name)
-- select o.id, a.name
-- from nf3.outlets o
-- cross join (values ('Kasir'), ('Dapur'), ('Bar'), ('Gudang')) as a(name)
-- where o.code in ('KBU', 'KSM', 'SMT')
-- on conflict do nothing;

-- ---------------------------------------------------------------------------
-- INTEGRASI DENGAN MODUL LAIN (implementasi di fase POS — bukan sekarang)
-- ---------------------------------------------------------------------------
--
-- 1. FINANCE (nf3.finance_ledger)
--    Saat order_payments.status = 'captured':
--      INSERT finance_ledger (
--        outlet_id, account_id, transaction_type='in', category='POS Penjualan',
--        amount, payment_method, source_doc_type='pos_order', source_doc_id=order_id
--      )
--    GoFood/Grab → account_id = 'gofood_pending' (kas tertahan, sama seperti setoran).
--
-- 2. INVENTORY (nf3.stock_movements)
--    Saat order.status → 'completed':
--      Untuk tiap order_item, lookup recipe → recipe_lines
--      INSERT stock_movements (movement_type='Stock Out', qty=recipe_qty * order_qty)
--      source_doc_type='pos_order', source_doc_id=order_id
--
-- 3. FORM SETORAN KASIR (nf3.form_submissions, form_type='setoran_kasir')
--    Saat close shift:
--      Bandingkan pos_shifts.system_* vs payload form (cash, qris, online)
--      Selisih ≥ Rp100K → approval owner (sudah ada di lib/approval.ts)
--      Approval → recordSetoranKasir() atau langsung dari payment ledger
--
-- 4. REPORT / AI
--    orders + order_items → laporan penjualan per outlet/shift/menu
--    kds_tickets (ready_at - fired_at) → SLA dapur/bar untuk AI Direktur
--
-- 5. TASK DASHBOARD (task.nf3.company)
--    POS TIDAK rebuild task — tapi bisa webhook:
--      order void besar, selisih shift, komplain → task manual di dashboard existing
--
-- ---------------------------------------------------------------------------
-- RLS (sketsa — aktifkan saat implementasi POS)
-- ---------------------------------------------------------------------------
-- alter table nf3.orders enable row level security;
-- Policy: kasir/leader hanya outlet_id session; owner/admin lintas outlet.
-- KDS tablet: role staff + area_id scope (hanya ticket station-nya).
-- ============================================================================
