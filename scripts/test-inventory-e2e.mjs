#!/usr/bin/env node
/**
 * Uji end-to-end inventory sheets writer + saldo.
 * Usage: npm run test:inventory-e2e
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env.local");
  process.exit(1);
}

const db = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  db: { schema: "nf3" }
});

function num(v) {
  return v == null ? 0 : Number(v);
}

async function latestOpname(kodeBahan, lokasi) {
  const { data, error } = await db
    .from("opname_awal")
    .select("qty_awal, tanggal")
    .eq("kode_bahan", kodeBahan)
    .eq("lokasi", lokasi)
    .order("tanggal", { ascending: false })
    .limit(1);
  if (error) throw new Error(`opname: ${error.message}`);
  return num(data?.[0]?.qty_awal);
}

async function sumTable(table, kodeBahan, lokasi, mode) {
  const cols =
    mode === "masuk"
      ? "qty, lokasi_tujuan"
      : mode === "transfer_in" || mode === "transfer_out"
        ? "qty, dari_lokasi, ke_lokasi"
        : "qty, lokasi";
  const { data, error } = await db.from(table).select(cols).eq("kode_bahan", kodeBahan);
  if (error) throw new Error(`${table}: ${error.message}`);
  let rows = data ?? [];
  if (mode === "masuk") rows = rows.filter((r) => r.lokasi_tujuan === lokasi);
  else if (mode === "transfer_in") rows = rows.filter((r) => r.ke_lokasi === lokasi);
  else if (mode === "transfer_out") rows = rows.filter((r) => r.dari_lokasi === lokasi);
  else if (mode === "pemakaian" || mode === "waste") rows = rows.filter((r) => r.lokasi === lokasi);
  return rows.reduce((s, r) => s + num(r.qty), 0);
}

async function saldoLokasi(kodeBahan, lokasi) {
  const [opname, masuk, trIn, trOut, pakai, waste] = await Promise.all([
    latestOpname(kodeBahan, lokasi),
    sumTable("barang_masuk", kodeBahan, lokasi, "masuk"),
    sumTable("transfer_stok", kodeBahan, lokasi, "transfer_in"),
    sumTable("transfer_stok", kodeBahan, lokasi, "transfer_out"),
    sumTable("pemakaian_outlet", kodeBahan, lokasi, "pemakaian"),
    sumTable("waste_selisih", kodeBahan, lokasi, "waste")
  ]);
  return opname + masuk + trIn - trOut - pakai - waste;
}

async function ensureSupplierTable() {
  const { error } = await db.from("master_supplier").select("kode").limit(1);
  if (error) {
    if (error.message?.includes("schema cache") || error.code === "42P01") {
      console.log("⚠ master_supplier belum ada — jalankan CREATE TABLE di Supabase SQL Editor:");
      console.log("  supabase/inventory-sheets.sql (bagian master_supplier)");
      console.log("  lalu: supabase/inventory-supplier-seed.sql\n");
      return false;
    }
    throw new Error(error.message);
  }
  return true;
}

async function seedSuppliers() {
  const rows = [
    { kode: "SUP-001", nama: "Lotte Mart", kategori: "Sembako/Frozen", hari_order: "Harian" },
    { kode: "SUP-005", nama: "Offline Terdekat", kategori: "Sayur & Sembako", hari_order: "Harian" }
  ];
  const { error } = await db.from("master_supplier").upsert(rows, { onConflict: "kode" });
  if (error) throw new Error(`seed supplier: ${error.message}`);
  console.log(`✓ Seed supplier: ${rows.length} baris`);
}

async function main() {
  console.log("=== NF3 Inventory E2E Test ===\n");
  console.log(`INVENTORY_SOURCE=${process.env.INVENTORY_SOURCE ?? "(unset)"}`);
  console.log(`Supabase: ${url}\n`);

  const hasSupplier = await ensureSupplierTable();
  if (hasSupplier) {
    await seedSuppliers();
    const { count } = await db.from("master_supplier").select("*", { count: "exact", head: true });
    console.log(`✓ master_supplier: ${count ?? 0} baris\n`);
  }

  const { data: bahanList, error: bahanErr } = await db
    .from("master_bahan")
    .select("kode_bahan, nama_baku, satuan_pakai")
    .eq("status_aktif", "Aktif")
    .limit(5);
  if (bahanErr) throw new Error(bahanErr.message);
  if (!bahanList?.length) {
    console.error("✗ Belum ada master_bahan. Jalankan: npm run condition:inventory");
    process.exit(1);
  }
  console.log(`✓ master_bahan: ${bahanList.length}+ item aktif`);

  const testBahan = bahanList[0];
  const kode = testBahan.kode_bahan;
  const lokasi = "KBU";
  const testQty = 1;
  const testId = `ws-e2e-${Date.now()}`;

  const saldoBefore = await saldoLokasi(kode, lokasi);
  console.log(`\n→ Saldo ${kode} (${testBahan.nama_baku}) di ${lokasi} SEBELUM: ${saldoBefore}`);

  const { error: insertErr } = await db.from("waste_selisih").insert({
    id: testId,
    tanggal: new Date().toISOString().slice(0, 10),
    kode_bahan: kode,
    lokasi,
    jenis: "E2E Test",
    qty: testQty,
    alasan: "Automated test — akan dihapus"
  });
  if (insertErr) throw new Error(`insert waste: ${insertErr.message}`);
  console.log(`✓ Insert waste_selisih: ${testQty} ${testBahan.satuan_pakai}`);

  const saldoAfter = await saldoLokasi(kode, lokasi);
  console.log(`→ Saldo SESUDAH: ${saldoAfter}`);

  const delta = saldoBefore - saldoAfter;
  if (delta !== testQty) {
    console.error(`\n✗ GAGAL: saldo turun ${delta}, harusnya ${testQty}`);
    await db.from("waste_selisih").delete().eq("id", testId);
    process.exit(1);
  }
  console.log(`✓ Saldo turun tepat ${testQty} — rumus mutasi benar`);

  await db.from("waste_selisih").delete().eq("id", testId);
  console.log(`✓ Cleanup: baris test dihapus`);

  const saldoFinal = await saldoLokasi(kode, lokasi);
  if (saldoFinal !== saldoBefore) {
    console.error(`\n✗ GAGAL cleanup: saldo akhir ${saldoFinal}, harusnya ${saldoBefore}`);
    process.exit(1);
  }
  console.log(`✓ Saldo kembali ke ${saldoFinal} setelah cleanup`);

  const { error: viewErr } = await db.from("v_saldo_per_lokasi").select("saldo").limit(1);
  if (viewErr) {
    console.log(`\n⚠ View v_saldo_per_lokasi belum ada — jalankan supabase/inventory-saldo-view.sql`);
  } else {
    const { data: viewRow } = await db
      .from("v_saldo_per_lokasi")
      .select("saldo")
      .eq("kode_bahan", kode)
      .eq("lokasi", lokasi)
      .maybeSingle();
    const viewSaldo = num(viewRow?.saldo);
    if (viewSaldo === saldoBefore) {
      console.log(`✓ View v_saldo_per_lokasi cocok: ${viewSaldo}`);
    } else {
      console.log(`⚠ View saldo ${viewSaldo} ≠ hitung manual ${saldoBefore} (cek view SQL)`);
    }
  }

  console.log("\n=== SEMUA TEST LULUS ===");
}

main().catch((e) => {
  console.error("\n✗ ERROR:", e.message);
  process.exit(1);
});
