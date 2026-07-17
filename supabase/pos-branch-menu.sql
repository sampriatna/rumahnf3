-- ============================================================================
-- Rumah NF3 — Branch Menu (harga & aktif per outlet cabang)
-- Jalankan setelah pos-app.sql. Idempotent.
-- ============================================================================

create schema if not exists nf3;

create table if not exists nf3.menu_branch_settings (
  menu_item_id  text not null,
  outlet_id     text not null,
  price         numeric(14,2),
  active        boolean not null default true,
  sold_out      boolean not null default false,
  primary key (menu_item_id, outlet_id)
);

create index if not exists idx_menu_branch_settings_outlet on nf3.menu_branch_settings(outlet_id);

grant all on nf3.menu_branch_settings to anon, authenticated, service_role;
