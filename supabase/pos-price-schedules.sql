-- ============================================================================
-- Rumah NF3 — Scheduler Price / Happy Hour
-- Jalankan setelah pos-app.sql. Idempotent.
-- ============================================================================

create schema if not exists nf3;

create table if not exists nf3.menu_price_schedules (
  id                    text primary key,
  outlet_id             text not null,
  name                  text not null,
  days_of_week          int[] not null default '{}',
  start_time            text not null,
  end_time              text not null,
  adjust_type           text not null default 'percent_off',
  value                 numeric(14,2) not null default 0,
  target_menu_item_ids  text[] not null default '{}',
  target_category_ids   text[] not null default '{}',
  sort_order            int not null default 0,
  active                boolean not null default true,
  unique (outlet_id, name)
);

create index if not exists idx_menu_price_schedules_outlet on nf3.menu_price_schedules(outlet_id);

grant all on nf3.menu_price_schedules to anon, authenticated, service_role;
