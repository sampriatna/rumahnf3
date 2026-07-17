-- ============================================================================

-- Rumah NF3 — Menu Package + Promotion (master data POS)

-- Jalankan setelah pos-app.sql. Idempotent.

-- ============================================================================



create schema if not exists nf3;



create table if not exists nf3.menu_packages (

  id           text primary key,

  outlet_id    text not null,

  name         text not null,

  description  text,

  image_url    text,

  bundle_price numeric(14,2) not null default 0,

  sort_order   int not null default 0,

  active       boolean not null default true,

  unique (outlet_id, name)

);



create table if not exists nf3.menu_package_items (

  id           text primary key,

  package_id   text not null references nf3.menu_packages(id) on delete cascade,

  menu_item_id text not null,

  qty          int not null default 1,

  sort_order   int not null default 0

);



create index if not exists idx_menu_packages_outlet on nf3.menu_packages(outlet_id);

create index if not exists idx_menu_package_items_pkg on nf3.menu_package_items(package_id);



create table if not exists nf3.pos_promotions (

  id                  text primary key,

  outlet_id           text not null,

  name                text not null,

  code                text,

  promo_type          text not null default 'order_percent',

  value               numeric(14,2) not null default 0,

  target_menu_item_ids text[] not null default '{}',

  min_subtotal        numeric(14,2),

  valid_from          text,

  valid_to            text,

  sort_order          int not null default 0,

  active              boolean not null default true,

  unique (outlet_id, name)

);



create index if not exists idx_pos_promotions_outlet on nf3.pos_promotions(outlet_id);



grant all on nf3.menu_packages to anon, authenticated, service_role;

grant all on nf3.menu_package_items to anon, authenticated, service_role;

grant all on nf3.pos_promotions to anon, authenticated, service_role;

