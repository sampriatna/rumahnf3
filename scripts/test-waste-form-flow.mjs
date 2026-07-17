#!/usr/bin/env node
/**
 * Uji alur form waste staff → waste_selisih → saldo dashboard.
 * Mensimulasikan writeWasteFromForm (nama bahan → kodeBahan → insert).
 *
 * Usage: npm run test:waste-form-flow
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Set env Supabase di .env.local");
  process.exit(1);
}

const db = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  db: { schema: "nf3" }
});

function num(v) {
  return v == null ? 0 : Number(v);
}

function resolveKodeBahan(itemName, bahanList) {
  const lower = itemName.trim().toLowerCase();
  const exact = bahanList.find((b) => b.nama_baku.toLowerCase() === lower);
  if (exact) return exact.kode_bahan;
  const partial = bahanList.find(
    (b) => lower.includes(b.nama_baku.toLowerCase()) || b.nama_baku.toLowerCase().includes(lower)
  );
  return partial?.kode_bahan ?? null;
}

async function saldoLokasi(kodeBahan, lokasi) {
  const { data: opnameRows } = await db
    .from("opname_awal")
    .select("qty_awal")
    .eq("kode_bahan", kodeBahan)
    .eq("lokasi", lokasi)
    .order("tanggal", { ascending: false })
    .limit(1);
  let saldo = num(opnameRows?.[0]?.qty_awal);

  const add = async (table, mode) => {
    const cols =
      mode === "masuk"
        ? "qty, lokasi_tujuan"
        : mode === "transfer_in" || mode === "transfer_out"
          ? "qty, dari_lokasi, ke_lokasi"
          : "qty, lokasi";
    const { data } = await db.from(table).select(cols).eq("kode_bahan", kodeBahan);
    let rows = data ?? [];
    if (mode === "masuk") rows = rows.filter((r) => r.lokasi_tujuan === lokasi);
    else if (mode === "transfer_in") rows = rows.filter((r) => r.ke_lokasi === lokasi);
    else if (mode === "transfer_out") rows = rows.filter((r) => r.dari_lokasi === lokasi);
    else rows = rows.filter((r) => r.lokasi === lokasi);
    return rows.reduce((s, r) => s + num(r.qty), 0);
  };

  saldo += await add("barang_masuk", "masuk");
  saldo += await add("transfer_stok", "transfer_in");
  saldo -= await add("transfer_stok", "transfer_out");
  saldo -= await add("pemakaian_outlet", "pemakaian");
  saldo -= await add("waste_selisih", "waste");
  return saldo;
}

async function main() {
  console.log("=== NF3 Waste Form Flow Test ===\n");

  const { data: bahanList, error } = await db
    .from("master_bahan")
    .select("kode_bahan, nama_baku, satuan_pakai")
    .eq("status_aktif", "Aktif")
    .limit(20);
  if (error) throw new Error(error.message);
  if (!bahanList?.length) throw new Error("Tidak ada master_bahan");

  const target = bahanList.find((b) => b.nama_baku.toLowerCase().includes("bawang")) ?? bahanList[0];
  const lokasi = "KBU";
  const testQty = 2;
  const formId = `REQ-E2E-${Date.now()}`;
  const wasteId = `ws-form-${formId}`;

  console.log(`Bahan uji: "${target.nama_baku}" (${target.kode_bahan})`);
  const resolved = resolveKodeBahan(target.nama_baku, bahanList);
  if (resolved !== target.kode_bahan) {
    console.error(`✗ Resolve gagal: dapat ${resolved}, harusnya ${target.kode_bahan}`);
    process.exit(1);
  }
  console.log(`✓ resolveKodeBahan("${target.nama_baku}") → ${resolved}`);

  const before = await saldoLokasi(target.kode_bahan, lokasi);
  console.log(`→ Saldo ${lokasi} SEBELUM form waste: ${before}`);

  const { error: insErr } = await db.from("waste_selisih").insert({
    id: wasteId,
    tanggal: new Date().toISOString().slice(0, 10),
    kode_bahan: resolved,
    lokasi,
    jenis: "Form Staff",
    qty: testQty,
    alasan: "E2E waste form test — Rusak"
  });
  if (insErr) throw new Error(insErr.message);
  console.log(`✓ Form waste tercatat: ${testQty} ${target.satuan_pakai} di ${lokasi}`);

  const after = await saldoLokasi(target.kode_bahan, lokasi);
  console.log(`→ Saldo SESUDAH: ${after}`);

  if (before - after !== testQty) {
    console.error(`✗ Saldo harus turun ${testQty}, turun ${before - after}`);
    await db.from("waste_selisih").delete().eq("id", wasteId);
    process.exit(1);
  }
  console.log("✓ Dashboard akan menampilkan saldo terbaru (mutasi terbaca)");

  await db.from("waste_selisih").delete().eq("id", wasteId);
  const final = await saldoLokasi(target.kode_bahan, lokasi);
  console.log(`✓ Cleanup — saldo kembali: ${final}`);

  console.log("\n=== WASTE FORM FLOW LULUS ===");
}

main().catch((e) => {
  console.error("\n✗", e.message);
  process.exit(1);
});
