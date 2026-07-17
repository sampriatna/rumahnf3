#!/usr/bin/env node
/**
 * Import CSV export Google Sheets → Supabase (model inventory-sheets.sql).
 *
 * Usage:
 *   npm run import:inventory
 *   npm run import:inventory -- --dir=data/inventory-csv
 *
 * Urutan wajib di SQL Editor:
 *   1. supabase/schema.sql (jika belum)
 *   2. supabase/inventory-sheets.sql
 *   3. (opsional) supabase/inventory-sheets-seed.sql
 *
 * CSV: satu file per tab, header snake_case (lihat data/inventory-csv/*.csv.example).
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const args = process.argv.slice(2);
const dirArg = args.find((a) => a.startsWith("--dir="));
const CSV_DIR = dirArg ? dirArg.slice(6) : path.join(process.cwd(), "data", "inventory-csv");

if (!url || !serviceKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env.local");
  process.exit(1);
}

const db = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  db: { schema: "nf3" }
});

function readCsv(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const text = fs.readFileSync(filePath, "utf8").trim();
  if (!text) return [];
  const lines = text.split(/\r?\n/).filter(Boolean);
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^\uFEFF/, ""));
  return lines.slice(1).map((line, i) => {
    const cols = line.split(",").map((c) => c.trim());
    const row = {};
    headers.forEach((h, j) => {
      row[h] = cols[j] ?? "";
    });
    row.__line = i + 2;
    return row;
  });
}

function num(v) {
  if (v === "" || v == null) return 0;
  const n = Number(String(v).replace(/\./g, "").replace(",", "."));
  return Number.isNaN(n) ? 0 : n;
}

function req(row, key) {
  const v = row[key];
  if (v === "" || v == null) throw new Error(`Baris ${row.__line}: kolom ${key} wajib`);
  return String(v).trim();
}

async function upsert(table, rows, onConflict) {
  if (!rows.length) {
    console.log(`  (skip ${table} — file kosong/tidak ada)`);
    return;
  }
  const { error } = await db.from(table).upsert(rows, { onConflict });
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`  ✓ ${table}: ${rows.length} baris`);
}

async function importMasterLokasi(file) {
  const raw = readCsv(file);
  if (!raw) return;
  const rows = raw.map((r) => ({
    kode: req(r, "kode"),
    nama_lokasi: req(r, "nama_lokasi"),
    jenis: r.jenis || "Outlet"
  }));
  await upsert("master_lokasi", rows, "kode");
}

async function importMasterBahan(file) {
  const raw = readCsv(file);
  if (!raw) return;
  const rows = raw.map((r) => ({
    kode_bahan: req(r, "kode_bahan"),
    nama_baku: req(r, "nama_baku"),
    kategori: r.kategori || "Lainnya",
    satuan_beli: req(r, "satuan_beli"),
    satuan_pakai: req(r, "satuan_pakai"),
    konversi: num(r.konversi) || 1,
    harga_per_satuan_pakai: num(r.harga_per_satuan_pakai),
    supplier_utama: r.supplier_utama || "—",
    stok_minimum: num(r.stok_minimum),
    stok_aman: num(r.stok_aman),
    stok_maksimum: num(r.stok_maksimum),
    status_aktif: r.status_aktif || "Aktif",
    metode_stok: r.metode_stok || "Distok"
  }));
  await upsert("master_bahan", rows, "kode_bahan");
}

function movementId(prefix, r) {
  return r.id?.trim() || `${prefix}-${r.__line}-${Date.now()}`;
}

async function importOpname(file) {
  const raw = readCsv(file);
  if (!raw) return;
  const rows = raw.map((r) => ({
    id: movementId("op", r),
    tanggal: req(r, "tanggal"),
    kode_bahan: req(r, "kode_bahan"),
    lokasi: req(r, "lokasi"),
    qty_awal: num(r.qty_awal)
  }));
  await upsert("opname_awal", rows, "id");
}

async function importBarangMasuk(file) {
  const raw = readCsv(file);
  if (!raw) return;
  for (const r of raw) {
    if (!r.lokasi_tujuan?.trim()) {
      throw new Error(`Baris ${r.__line}: lokasi_tujuan kosong — REJECT (isi GDG/KBU/KSM/SMT)`);
    }
    if (num(r.qty) <= 0) throw new Error(`Baris ${r.__line}: qty harus > 0`);
  }
  const rows = raw.map((r) => ({
    id: movementId("bm", r),
    tanggal: req(r, "tanggal"),
    kode_bahan: req(r, "kode_bahan"),
    qty: num(r.qty),
    satuan: req(r, "satuan"),
    total_harga: num(r.total_harga),
    supplier: r.supplier || "—",
    lokasi_tujuan: req(r, "lokasi_tujuan"),
    diterima_oleh: r.diterima_oleh || "—"
  }));
  await upsert("barang_masuk", rows, "id");
}

async function importTransfer(file) {
  const raw = readCsv(file);
  if (!raw) return;
  for (const r of raw) {
    if (r.dari_lokasi === r.ke_lokasi) {
      throw new Error(`Baris ${r.__line}: dari_lokasi dan ke_lokasi tidak boleh sama`);
    }
  }
  const rows = raw.map((r) => ({
    id: movementId("tr", r),
    tanggal: req(r, "tanggal"),
    kode_bahan: req(r, "kode_bahan"),
    qty: num(r.qty),
    dari_lokasi: req(r, "dari_lokasi"),
    ke_lokasi: req(r, "ke_lokasi"),
    dikeluarkan_oleh: r.dikeluarkan_oleh || "—",
    diterima_oleh: r.diterima_oleh || "—"
  }));
  await upsert("transfer_stok", rows, "id");
}

async function importPemakaian(file) {
  const raw = readCsv(file);
  if (!raw) return;
  const rows = raw.map((r) => ({
    id: movementId("pk", r),
    tanggal: req(r, "tanggal"),
    kode_bahan: req(r, "kode_bahan"),
    qty: num(r.qty),
    lokasi: req(r, "lokasi"),
    jenis_pemakaian: r.jenis_pemakaian || "Penjualan Menu",
    pic: r.pic || "—"
  }));
  await upsert("pemakaian_outlet", rows, "id");
}

async function importWaste(file) {
  const raw = readCsv(file);
  if (!raw) return;
  const rows = raw.map((r) => ({
    id: movementId("ws", r),
    tanggal: req(r, "tanggal"),
    kode_bahan: req(r, "kode_bahan"),
    lokasi: req(r, "lokasi"),
    jenis: r.jenis || "Lainnya",
    qty: num(r.qty),
    alasan: r.alasan || "—"
  }));
  await upsert("waste_selisih", rows, "id");
}

console.log(`Rumah NF3 — import inventory CSV dari: ${CSV_DIR}\n`);

try {
  await importMasterLokasi(path.join(CSV_DIR, "master_lokasi.csv"));
  await importMasterBahan(path.join(CSV_DIR, "master_bahan.csv"));
  await importOpname(path.join(CSV_DIR, "opname_awal.csv"));
  await importBarangMasuk(path.join(CSV_DIR, "barang_masuk.csv"));
  await importTransfer(path.join(CSV_DIR, "transfer_stok.csv"));
  await importPemakaian(path.join(CSV_DIR, "pemakaian_outlet.csv"));
  await importWaste(path.join(CSV_DIR, "waste_selisih.csv"));
  console.log("\nSelesai. Set INVENTORY_SOURCE=supabase di Vercel lalu redeploy.");
} catch (e) {
  console.error("\nGAGAL:", e.message);
  process.exit(1);
}
