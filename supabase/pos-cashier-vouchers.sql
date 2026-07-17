-- ============================================================================
-- Rumah NF3 — Cashier Voucher (voucher kasir non-member)
-- Jalankan setelah pos-app.sql. Idempotent.
-- ============================================================================

create schema if not exists nf3;

create table if not exists nf3.pos_cashier_vouchers (
  id            text primary key,
  outlet_id     text not null,
  name          text not null,
  code          text not null,
  voucher_type  text not null default 'fixed',
  value         numeric(14,2) not null default 0,
  min_subtotal  numeric(14,2),
  max_discount  numeric(14,2),
  usage_limit   int,
  used_count    int not null default 0,
  valid_from    text,
  valid_to      text,
  sort_order    int not null default 0,
  active        boolean not null default true,
  unique (outlet_id, code)
);

create index if not exists idx_pos_cashier_vouchers_outlet on nf3.pos_cashier_vouchers(outlet_id);

grant all on nf3.pos_cashier_vouchers to anon, authenticated, service_role;
