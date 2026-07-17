-- ============================================================================
-- Rumah NF3 — Fase A Library (foto upload + modifier)
-- Jalankan di Supabase SQL Editor setelah pos-app.sql. Idempotent.
-- ============================================================================

-- 1) Kolom foto produk (fix schema drift)
alter table nf3.menu_items
  add column if not exists image_url text;

-- 2) Modifier / add-on (mirip Moka Library → Pengubah)
create table if not exists nf3.menu_modifiers (
  id          text primary key,
  outlet_id   text not null,
  name        text not null,
  price_delta numeric(14,2) not null default 0,
  active      boolean not null default true
);

create table if not exists nf3.menu_item_modifiers (
  menu_item_id text not null references nf3.menu_items(id) on delete cascade,
  modifier_id  text not null references nf3.menu_modifiers(id) on delete cascade,
  primary key (menu_item_id, modifier_id)
);

create index if not exists idx_menu_modifiers_outlet on nf3.menu_modifiers(outlet_id);

-- 3) Supabase Storage — foto produk (public read untuk POS tablet)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'menu-images',
  'menu-images',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Baca publik
drop policy if exists "menu_images_public_read" on storage.objects;
create policy "menu_images_public_read"
  on storage.objects for select
  using (bucket_id = 'menu-images');

-- Upload/update/delete — authenticated (service role bypass RLS)
drop policy if exists "menu_images_auth_insert" on storage.objects;
create policy "menu_images_auth_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'menu-images');

drop policy if exists "menu_images_auth_update" on storage.objects;
create policy "menu_images_auth_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'menu-images');

drop policy if exists "menu_images_auth_delete" on storage.objects;
create policy "menu_images_auth_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'menu-images');

grant all on nf3.menu_modifiers to anon, authenticated, service_role;
grant all on nf3.menu_item_modifiers to anon, authenticated, service_role;
