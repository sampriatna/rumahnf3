#!/usr/bin/env node
/**
 * Jalankan migrasi supplier + view saldo ke Supabase.
 *
 * Usage:
 *   npm run migrate:inventory-extra
 *
 * Butuh salah satu:
 *   SUPABASE_DB_URL di .env.local (postgresql://...)
 *   atau: npx supabase login && npx supabase link --project-ref <ref>
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dbUrl = process.env.SUPABASE_DB_URL;

const sqlFile = path.join(process.cwd(), "supabase", "inventory-extra-migration.sql");
const sql = fs.readFileSync(sqlFile, "utf8");

async function runWithPg() {
  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(sql);
    console.log("✓ Migrasi berhasil via SUPABASE_DB_URL");
  } finally {
    await client.end();
  }
}

async function verify() {
  if (!url || !serviceKey) return;
  const db = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: "nf3" }
  });

  const { count: supCount, error: supErr } = await db
    .from("master_supplier")
    .select("*", { count: "exact", head: true });
  if (supErr) {
    console.log(`✗ master_supplier: ${supErr.message}`);
  } else {
    console.log(`✓ master_supplier: ${supCount ?? 0} baris`);
  }

  const { error: viewErr } = await db.from("v_saldo_per_lokasi").select("kode_bahan").limit(1);
  if (viewErr) {
    console.log(`✗ v_saldo_per_lokasi: ${viewErr.message}`);
  } else {
    console.log("✓ v_saldo_per_lokasi: aktif");
  }
}

async function main() {
  console.log("=== NF3 Inventory Extra Migration ===\n");

  if (dbUrl) {
    await runWithPg();
    await verify();
    return;
  }

  console.log("SUPABASE_DB_URL tidak diset — coba supabase db query --linked ...\n");
  const { spawnSync } = await import("child_process");
  const result = spawnSync(
    "npx",
    ["supabase", "db", "query", "--linked", "-f", sqlFile],
    { stdio: "inherit", shell: true, cwd: process.cwd() }
  );

  if (result.status === 0) {
    console.log("\n✓ Migrasi berhasil via supabase CLI (--linked)");
    await verify();
    return;
  }

  console.log("\n⚠ Migrasi otomatis gagal. Jalankan manual di Supabase SQL Editor:");
  console.log(`  File: ${sqlFile}`);
  console.log("\nAtau tambahkan ke .env.local:");
  console.log("  SUPABASE_DB_URL=postgresql://postgres.[ref]:[password]@...pooler.supabase.com:6543/postgres");
  console.log("  lalu: npm run migrate:inventory-extra\n");

  await verify();

  const { count, error: supErr } = await (async () => {
    if (!url || !serviceKey) return { count: 0, error: { message: "no creds" } };
    const db = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      db: { schema: "nf3" }
    });
    return db.from("master_supplier").select("*", { count: "exact", head: true });
  })();

  if (!supErr && (count ?? 0) > 0) {
    console.log("\n=== Migrasi sudah aktif di Supabase ===");
    process.exit(0);
  }

  process.exit(result.status === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("✗", e.message);
  process.exit(1);
});
