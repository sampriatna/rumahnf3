#!/usr/bin/env node
/**
 * Seed opname awal GDG (baseline saldo) dari prototipe owner dashboard.
 * Usage: npm run seed:opname-awal
 *        npm run seed:opname-awal -- --force
 */
import { createClient } from "@supabase/supabase-js";

const TANGGAL = "2026-05-04";
const LOKASI = "GDG";

/** Baseline prototipe — 4 Mei 2026, gudang pusat. */
const SEED_OPNAME = {
  AYMBSR: 40,
  AYMBPT: 50,
  BBK: 70,
  IKNLL: 30,
  IKNNL: 10,
  BRS: 25,
  GRM: 35,
  GLP: 15,
  GLAB: 1000,
  GLAC: 3000,
  MCN: 3000,
  SAYAM: 8000,
  ROYSAP: 500,
  RCK: 20,
  SATIR: 1,
  SATER: 1,
  TRGU: 4000,
  TEPROT: 1000,
  TERAS: 1500,
  KECMAS: 1,
  SUSFRES: 24,
  SKM: 10,
  PRIMA: 168,
  CLEO: 48,
  SPRTKCL: 72,
  STRS: 48,
  SRPVNL: 12,
  SRPLCMJN: 4,
  SOSDBD: 80,
  NGTMBL: 50,
  KNTG: 10
};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const force = process.argv.includes("--force");

if (!url || !serviceKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env.local");
  process.exit(1);
}

const db = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  db: { schema: "nf3" }
});

async function main() {
  console.log("=== NF3 Seed Opname Awal ===\n");
  console.log(`Tanggal: ${TANGGAL} | Lokasi: ${LOKASI}\n`);

  const { count: existing, error: countErr } = await db
    .from("opname_awal")
    .select("*", { count: "exact", head: true });
  if (countErr) throw new Error(countErr.message);

  if ((existing ?? 0) > 0 && !force) {
    console.log(`✓ opname_awal sudah ada (${existing} baris). Lewati — pakai --force untuk timpa seed.`);
    return;
  }

  const { data: bahanRows, error: bahanErr } = await db
    .from("master_bahan")
    .select("kode_bahan");
  if (bahanErr) throw new Error(bahanErr.message);

  const known = new Set((bahanRows ?? []).map((r) => r.kode_bahan));
  const rows = [];
  const skipped = [];

  for (const [kode, qty] of Object.entries(SEED_OPNAME)) {
    if (!known.has(kode)) {
      skipped.push(kode);
      continue;
    }
    rows.push({
      id: `opname-seed-${kode}-${LOKASI}`,
      tanggal: TANGGAL,
      kode_bahan: kode,
      lokasi: LOKASI,
      qty_awal: qty
    });
  }

  if (skipped.length) {
    console.log(`⚠ Lewati ${skipped.length} kode (belum di master_bahan): ${skipped.join(", ")}`);
  }

  if (!rows.length) {
    console.error("✗ Tidak ada baris valid untuk di-insert.");
    process.exit(1);
  }

  if (force && (existing ?? 0) > 0) {
    const ids = rows.map((r) => r.id);
    const { error: delErr } = await db.from("opname_awal").delete().in("id", ids);
    if (delErr) throw new Error(`hapus seed lama: ${delErr.message}`);
    console.log(`→ Hapus ${ids.length} baris seed lama (--force)`);
  }

  const { error: insErr } = await db.from("opname_awal").upsert(rows, { onConflict: "id" });
  if (insErr) throw new Error(`insert: ${insErr.message}`);

  console.log(`✓ Insert/upsert opname_awal: ${rows.length} baris`);

  const sample = rows.slice(0, 3).map((r) => `${r.kode_bahan}=${r.qty_awal}`).join(", ");
  console.log(`  Contoh: ${sample} ...`);

  const { count: after, error: afterErr } = await db
    .from("opname_awal")
    .select("*", { count: "exact", head: true });
  if (afterErr) throw new Error(afterErr.message);
  console.log(`✓ Total opname_awal sekarang: ${after ?? 0} baris`);

  const { data: viewRow, error: viewErr } = await db
    .from("v_saldo_per_lokasi")
    .select("saldo")
    .eq("kode_bahan", "AYMBSR")
    .eq("lokasi", LOKASI)
    .maybeSingle();
  if (viewErr) {
    console.log(`⚠ v_saldo_per_lokasi: ${viewErr.message}`);
  } else {
    console.log(`✓ Saldo view AYMBSR@${LOKASI}: ${viewRow?.saldo ?? "(null)"}`);
  }

  console.log("\n=== SELESAI ===");
}

main().catch((e) => {
  console.error("\n✗ ERROR:", e.message);
  process.exit(1);
});
