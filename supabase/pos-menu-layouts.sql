-- ============================================================================
-- Rumah NF3 — POS Menu Layout (Menu Template Layout)
-- Jalankan setelah pos-price-schedules.sql. Idempotent.
-- ============================================================================

create schema if not exists nf3;

create table if not exists nf3.pos_menu_layouts (
  id                      text primary key,
  outlet_id               text not null,
  name                    text not null,
  columns                 int not null default 3,
  view_mode               text not null default 'tabs',
  show_packages           boolean not null default true,
  category_order          text[] not null default '{}',
  hidden_category_ids     text[] not null default '{}',
  item_order_by_category  jsonb not null default '{}',
  pinned_item_ids         text[] not null default '{}',
  sort_order              int not null default 0,
  active                  boolean not null default true,
  unique (outlet_id, name)
);

create index if not exists idx_pos_menu_layouts_outlet on nf3.pos_menu_layouts(outlet_id);

grant all on nf3.pos_menu_layouts to anon, authenticated, service_role;
