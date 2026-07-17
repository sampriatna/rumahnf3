-- ============================================================================
-- Rumah NF3 — Payment Method master + Chart of Accounts (COA)
-- Jalankan setelah pos-menu-layouts.sql. Idempotent.
-- ============================================================================

create schema if not exists nf3;

create table if not exists nf3.finance_chart_of_accounts (
  id             text primary key,
  code           text not null unique,
  name           text not null,
  account_type   text not null default 'asset',
  track_balance  boolean not null default true,
  ready          boolean not null default true,
  sort_order     int not null default 0,
  active         boolean not null default true
);

create table if not exists nf3.pos_payment_methods (
  id                      text not null,
  outlet_id               text not null,
  name                    text not null,
  kind                    text not null default 'other',
  coa_account_id          text not null,
  shift_bucket            text not null default 'cash',
  held_cash_enabled       boolean not null default false,
  held_cash_source        text,
  held_cash_release_days  int,
  sort_order              int not null default 0,
  active                  boolean not null default true,
  primary key (outlet_id, id)
);

create index if not exists idx_pos_payment_methods_outlet on nf3.pos_payment_methods(outlet_id);

grant all on nf3.finance_chart_of_accounts to anon, authenticated, service_role;
grant all on nf3.pos_payment_methods to anon, authenticated, service_role;
