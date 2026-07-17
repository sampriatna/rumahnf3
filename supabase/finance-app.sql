-- ============================================================================
-- Rumah NF3 — Fase D2b (lanjutan): Tabel relasional Finance / Kas
-- Jalankan di Supabase SQL Editor (sekali). Idempotent — aman diulang.
--
-- Catatan desain:
--   • ID = teks (mis. 'LED-0001', 'UTG-0002') agar cocok dgn aplikasi.
--   • Saldo akun: PK account_id (cash_physical, bank, qris_pending, ...).
--   • Ledger append-only — tidak dihapus, hanya ditambah.
--   • Timestamp disimpan sebagai TEXT (ISO verbatim).
-- ============================================================================

create schema if not exists nf3;

create table if not exists nf3.finance_account_balances (
  account_id text primary key,
  balance    numeric(14,2) not null default 0
);

create table if not exists nf3.finance_ledger (
  id               text primary key,
  date             text not null,
  outlet_id        text,
  outlet_name      text,
  account_id       text not null,
  transaction_type text not null,
  category         text not null,
  amount           numeric(14,2) not null,
  payment_method   text,
  source_doc_type  text,
  source_doc_id    text,
  note             text,
  created_by       text not null,
  created_at       text not null
);
alter table nf3.finance_ledger add column if not exists transfer_ref text;
alter table nf3.finance_ledger add column if not exists area_unit text;
alter table nf3.finance_ledger add column if not exists verification_status text default 'verified';
alter table nf3.finance_ledger add column if not exists verified_by text;
alter table nf3.finance_ledger add column if not exists evidence_url text;
create index if not exists idx_finance_ledger_date on nf3.finance_ledger(created_at desc);
create index if not exists idx_finance_ledger_doc on nf3.finance_ledger(source_doc_type, source_doc_id);
create index if not exists idx_finance_ledger_transfer_ref on nf3.finance_ledger(transfer_ref);

create table if not exists nf3.finance_debts (
  id              text primary key,
  debt_type       text not null,
  party           text not null,
  amount          numeric(14,2) not null,
  due_date        text not null,
  status          text not null,
  source_doc_type text,
  source_doc_id   text,
  note            text,
  created_at      text not null
);

create table if not exists nf3.finance_receivables (
  id         text primary key,
  party      text not null,
  amount     numeric(14,2) not null,
  due_date   text not null,
  status     text not null,
  note       text,
  created_at text not null
);

create table if not exists nf3.finance_held_cash (
  id                    text primary key,
  source                text not null,
  amount                numeric(14,2) not null,
  expected_release_date text,
  status                text not null,
  source_doc_id         text,
  created_at            text not null
);

-- ---- Hak akses (schema baru perlu grant) -----------------------------------
grant usage on schema nf3 to anon, authenticated, service_role;
grant all on all tables in schema nf3 to anon, authenticated, service_role;
alter default privileges in schema nf3
  grant all on tables to anon, authenticated, service_role;
