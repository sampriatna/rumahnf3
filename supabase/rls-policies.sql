-- ============================================================================
-- Rumah NF3 — Fase D3 (lanjutan): Row Level Security per outlet & role
-- Jalankan di Supabase SQL Editor SETELAH semua *-app.sql + auth-app.sql.
-- Idempotent — aman diulang.
--
-- Model akses (selaras lib/rbac.ts):
--   • owner / admin / super_admin → semua baris
--   • leader → outlet sendiri (+ gudang untuk stok)
--   • staff → outlet sendiri (POS, form, KDS)
--
-- Catatan arsitektur:
--   • Next.js server memakai service_role → bypass RLS (write-through repo).
--   • RLS melindungi akses langsung via anon/authenticated + Supabase Auth JWT.
--   • Staf HP+PIN tanpa auth_user_id hanya lewat app server (bukan PostgREST).
-- ============================================================================

create schema if not exists nf3;

-- ---- Helper: profil aktif dari auth.uid() -----------------------------------
create or replace function nf3.current_account()
returns nf3.auth_accounts
language sql
stable
security definer
set search_path = nf3
as $$
  select *
  from nf3.auth_accounts
  where auth_user_id = auth.uid()
    and active = true
  limit 1;
$$;

create or replace function nf3.is_global_access()
returns boolean
language sql
stable
security definer
set search_path = nf3
as $$
  select exists (
    select 1
    from nf3.auth_accounts
    where auth_user_id = auth.uid()
      and active = true
      and (is_super_admin or role in ('owner', 'admin'))
  );
$$;

create or replace function nf3.current_outlet_id()
returns text
language sql
stable
security definer
set search_path = nf3
as $$
  select outlet_id from nf3.current_account();
$$;

create or replace function nf3.current_role()
returns text
language sql
stable
security definer
set search_path = nf3
as $$
  select role from nf3.current_account();
$$;

-- Baris outlet-scoped: global role, atau outlet cocok, atau outlet null (shared).
create or replace function nf3.can_access_outlet(p_outlet_id text)
returns boolean
language sql
stable
security definer
set search_path = nf3
as $$
  select case
    when auth.uid() is null then false
    when nf3.is_global_access() then true
    when p_outlet_id is null then true
    else exists (
      select 1
      from nf3.auth_accounts
      where auth_user_id = auth.uid()
        and active = true
        and outlet_id = p_outlet_id
    )
  end;
$$;

-- Stok: leader/admin/owner lihat gudang pusat + outlet; staf hanya outlet.
create or replace function nf3.can_access_location(p_location_id text)
returns boolean
language sql
stable
security definer
set search_path = nf3
as $$
  select case
    when auth.uid() is null then false
    when nf3.is_global_access() then true
    when p_location_id = 'warehouse' then nf3.current_role() in ('leader', 'admin', 'owner')
    else nf3.can_access_outlet(p_location_id)
  end;
$$;

create or replace function nf3.can_access_finance()
returns boolean
language sql
stable
security definer
set search_path = nf3
as $$
  select nf3.is_global_access();
$$;

create or replace function nf3.is_authenticated_account()
returns boolean
language sql
stable
security definer
set search_path = nf3
as $$
  select exists (
    select 1
    from nf3.auth_accounts
    where auth_user_id = auth.uid()
      and active = true
  );
$$;

-- ---- Macro: enable RLS + policy outlet-scoped --------------------------------
-- (policies ditulis eksplisit per tabel di bawah)

-- ---- Auth -------------------------------------------------------------------
alter table nf3.auth_accounts enable row level security;
alter table nf3.outlet_cashier_pins enable row level security;

drop policy if exists auth_accounts_select on nf3.auth_accounts;
create policy auth_accounts_select on nf3.auth_accounts
  for select to authenticated
  using (
    auth_user_id = auth.uid()
    or nf3.is_global_access()
  );

drop policy if exists auth_accounts_write on nf3.auth_accounts;
create policy auth_accounts_write on nf3.auth_accounts
  for all to authenticated
  using (nf3.is_global_access())
  with check (nf3.is_global_access());

drop policy if exists outlet_pins_select on nf3.outlet_cashier_pins;
create policy outlet_pins_select on nf3.outlet_cashier_pins
  for select to authenticated
  using (nf3.is_global_access() or nf3.can_access_outlet(outlet_id));

drop policy if exists outlet_pins_write on nf3.outlet_cashier_pins;
create policy outlet_pins_write on nf3.outlet_cashier_pins
  for all to authenticated
  using (nf3.is_global_access())
  with check (nf3.is_global_access());

-- ---- App state: hanya service_role (deny authenticated/anon) ----------------
alter table nf3.app_state enable row level security;
-- Tidak ada policy untuk authenticated/anon → default deny.

-- ---- POS / KDS --------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'pos_registers', 'menu_categories', 'menu_items', 'pos_shifts',
    'pos_orders', 'pos_kds_stations', 'kds_tickets'
  ] loop
    execute format('alter table nf3.%I enable row level security', t);
    execute format('drop policy if exists %I_select on nf3.%I', t, t);
    execute format(
      'create policy %I_select on nf3.%I for select to authenticated using (nf3.can_access_outlet(outlet_id))',
      t, t
    );
    execute format('drop policy if exists %I_write on nf3.%I', t, t);
    execute format(
      'create policy %I_write on nf3.%I for all to authenticated using (nf3.can_access_outlet(outlet_id)) with check (nf3.can_access_outlet(outlet_id))',
      t, t
    );
  end loop;
end $$;

alter table nf3.pos_recipes enable row level security;
drop policy if exists pos_recipes_select on nf3.pos_recipes;
create policy pos_recipes_select on nf3.pos_recipes
  for select to authenticated using (nf3.is_authenticated_account());
drop policy if exists pos_recipes_write on nf3.pos_recipes;
create policy pos_recipes_write on nf3.pos_recipes
  for all to authenticated
  using (nf3.is_global_access() or nf3.current_role() = 'leader')
  with check (nf3.is_global_access() or nf3.current_role() = 'leader');

-- ---- Inventory --------------------------------------------------------------
alter table nf3.suppliers enable row level security;
drop policy if exists suppliers_read on nf3.suppliers;
create policy suppliers_read on nf3.suppliers
  for select to authenticated
  using (nf3.is_authenticated_account());
drop policy if exists suppliers_write on nf3.suppliers;
create policy suppliers_write on nf3.suppliers
  for all to authenticated
  using (nf3.is_global_access())
  with check (nf3.is_global_access());

alter table nf3.inventory_items enable row level security;
drop policy if exists inventory_items_read on nf3.inventory_items;
create policy inventory_items_read on nf3.inventory_items
  for select to authenticated using (nf3.is_authenticated_account());
drop policy if exists inventory_items_write on nf3.inventory_items;
create policy inventory_items_write on nf3.inventory_items
  for all to authenticated
  using (nf3.is_global_access())
  with check (nf3.is_global_access());

alter table nf3.stock_levels enable row level security;
drop policy if exists stock_levels_access on nf3.stock_levels;
create policy stock_levels_access on nf3.stock_levels
  for all to authenticated
  using (nf3.can_access_location(location_id))
  with check (nf3.can_access_location(location_id));

alter table nf3.stock_movements enable row level security;
drop policy if exists stock_movements_access on nf3.stock_movements;
create policy stock_movements_access on nf3.stock_movements
  for all to authenticated
  using (nf3.can_access_location(location_id))
  with check (nf3.can_access_location(location_id));

alter table nf3.purchase_requests enable row level security;
drop policy if exists purchase_requests_access on nf3.purchase_requests;
create policy purchase_requests_access on nf3.purchase_requests
  for all to authenticated
  using (nf3.can_access_outlet(outlet_id))
  with check (nf3.can_access_outlet(outlet_id));

alter table nf3.purchase_orders enable row level security;
drop policy if exists purchase_orders_access on nf3.purchase_orders;
create policy purchase_orders_access on nf3.purchase_orders
  for all to authenticated
  using (nf3.can_access_outlet(outlet_id))
  with check (nf3.can_access_outlet(outlet_id));

alter table nf3.stock_transfer_requests enable row level security;
drop policy if exists stock_transfer_requests_access on nf3.stock_transfer_requests;
create policy stock_transfer_requests_access on nf3.stock_transfer_requests
  for all to authenticated
  using (nf3.is_global_access() or nf3.can_access_outlet(to_outlet_id))
  with check (nf3.is_global_access() or nf3.can_access_outlet(to_outlet_id));

-- ---- Finance (sensitif — owner/admin saja) ----------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'finance_account_balances', 'finance_ledger', 'finance_debts',
    'finance_receivables', 'finance_held_cash'
  ] loop
    execute format('alter table nf3.%I enable row level security', t);
    execute format('drop policy if exists %I_finance on nf3.%I', t, t);
    execute format(
      'create policy %I_finance on nf3.%I for all to authenticated using (nf3.can_access_finance()) with check (nf3.can_access_finance())',
      t, t
    );
  end loop;
end $$;

-- ---- Forms / Approval -------------------------------------------------------
alter table nf3.form_submissions enable row level security;
drop policy if exists form_submissions_access on nf3.form_submissions;
create policy form_submissions_access on nf3.form_submissions
  for all to authenticated
  using (
    nf3.is_global_access()
    or nf3.can_access_outlet(outlet_id)
    or submitted_by_id = (nf3.current_account()).id
  )
  with check (nf3.can_access_outlet(outlet_id) or nf3.is_global_access());

alter table nf3.approvals enable row level security;
drop policy if exists approvals_access on nf3.approvals;
create policy approvals_access on nf3.approvals
  for all to authenticated
  using (nf3.is_global_access() or nf3.can_access_outlet(outlet_id))
  with check (nf3.is_global_access() or nf3.can_access_outlet(outlet_id));

alter table nf3.notification_logs enable row level security;
drop policy if exists notification_logs_access on nf3.notification_logs;
create policy notification_logs_access on nf3.notification_logs
  for select to authenticated using (nf3.is_global_access());
drop policy if exists notification_logs_write on nf3.notification_logs;
create policy notification_logs_write on nf3.notification_logs
  for insert to authenticated with check (nf3.is_authenticated_account());

-- ---- Reports ----------------------------------------------------------------
alter table nf3.ai_insights enable row level security;
drop policy if exists ai_insights_access on nf3.ai_insights;
create policy ai_insights_access on nf3.ai_insights
  for all to authenticated
  using (nf3.is_global_access() or nf3.can_access_outlet(scope_outlet_id))
  with check (nf3.is_global_access());

alter table nf3.customer_ratings enable row level security;
drop policy if exists customer_ratings_access on nf3.customer_ratings;
create policy customer_ratings_access on nf3.customer_ratings
  for all to authenticated
  using (nf3.is_global_access() or nf3.can_access_outlet(outlet_id))
  with check (nf3.can_access_outlet(outlet_id) or nf3.is_global_access());

-- ---- Loyalty (member global; tulis terbatas) --------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'membership_tiers', 'loyalty_programs', 'customers',
    'loyalty_txns', 'vouchers', 'reward_redemptions'
  ] loop
    execute format('alter table nf3.%I enable row level security', t);
    execute format('drop policy if exists %I_read on nf3.%I', t, t);
    execute format(
      'create policy %I_read on nf3.%I for select to authenticated using (nf3.is_authenticated_account())',
      t, t
    );
    execute format('drop policy if exists %I_write on nf3.%I', t, t);
    execute format(
      'create policy %I_write on nf3.%I for all to authenticated using (nf3.is_global_access() or nf3.current_role() in (''leader'', ''staff'')) with check (nf3.is_global_access() or nf3.current_role() in (''leader'', ''staff''))',
      t, t
    );
  end loop;
end $$;

-- ---- Grant execute helper ke role API ---------------------------------------
grant execute on function nf3.current_account() to authenticated, anon;
grant execute on function nf3.is_global_access() to authenticated, anon;
grant execute on function nf3.current_outlet_id() to authenticated, anon;
grant execute on function nf3.current_role() to authenticated, anon;
grant execute on function nf3.can_access_outlet(text) to authenticated, anon;
grant execute on function nf3.can_access_location(text) to authenticated, anon;
grant execute on function nf3.can_access_finance() to authenticated, anon;
grant execute on function nf3.is_authenticated_account() to authenticated, anon;

-- ---- Diagnostik (dipakai /api/cloud-status) --------------------------------
create or replace function nf3.rls_diagnostics()
returns jsonb
language sql
stable
security definer
set search_path = nf3, pg_catalog
as $$
  select jsonb_build_object(
    'enabledTables',
    (
      select count(*)::int
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'nf3'
        and c.relkind = 'r'
        and c.relrowsecurity
    ),
    'policyCount',
    (
      select count(*)::int
      from pg_policies
      where schemaname = 'nf3'
    )
  );
$$;

grant execute on function nf3.rls_diagnostics() to service_role;
