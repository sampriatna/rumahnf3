-- Pengaturan kasir per register (printer, struk, dll.)
-- Jalankan di Supabase SQL editor (schema nf3).

alter table nf3.pos_registers
  add column if not exists settings jsonb default null;

comment on column nf3.pos_registers.settings is
  'Printer, auto-print, header/footer struk, modal awal default — camelCase JSON';
