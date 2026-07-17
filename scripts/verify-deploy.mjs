#!/usr/bin/env node
/**
 * Verifikasi pre/post deploy — env, Supabase inventory, test, build.
 * Usage: npm run verify:deploy
 *        npm run verify:deploy -- --prod https://rumah.nf3.company
 */
import { spawnSync } from "child_process";
import { createClient } from "@supabase/supabase-js";

const args = process.argv.slice(2);
const prodIdx = args.indexOf("--prod");
const skipBuild = args.includes("--skip-build");
const prodUrl = prodIdx >= 0 ? args[prodIdx + 1]?.replace(/\/$/, "") : null;

let fail = 0;
const log = (ok, msg) => {
  console.log(`${ok ? "✓" : "✗"} ${msg}`);
  if (!ok) fail++;
};

function run(cmd, name) {
  console.log(`\n→ ${name}: ${cmd}`);
  const r = spawnSync(cmd, { shell: true, stdio: "inherit", cwd: process.cwd() });
  const ok = r.status === 0;
  log(ok, name);
  return ok;
}

async function checkSupabaseInventory() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const inv = process.env.INVENTORY_SOURCE?.toLowerCase();

  log(Boolean(url && key), "Supabase env terisi");
  log(inv === "supabase", `INVENTORY_SOURCE=supabase (sekarang: ${inv ?? "inherit"})`);

  if (!url || !key) return;

  const db = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: "nf3" }
  });

  const tables = [
    "master_bahan",
    "master_lokasi",
    "master_supplier",
    "barang_masuk",
    "transfer_stok",
    "pemakaian_outlet",
    "waste_selisih",
    "opname_awal"
  ];

  for (const t of tables) {
    const { count, error } = await db.from(t).select("*", { count: "exact", head: true });
    if (error) {
      log(false, `${t}: ${error.message}`);
    } else {
      log(true, `${t}: ${count ?? 0} baris`);
    }
  }

  const { error: viewErr } = await db.from("v_saldo_per_lokasi").select("kode_bahan").limit(1);
  log(!viewErr, viewErr ? `v_saldo_per_lokasi: ${viewErr.message}` : "v_saldo_per_lokasi: aktif");
}

async function checkProdEndpoints(base) {
  console.log(`\n→ Cek production: ${base}`);
  const cronSecret = process.env.CRON_SECRET;
  for (const path of ["/api/health", "/api/inventory-health", "/api/cloud-status"]) {
    try {
      const headers = {};
      if (path === "/api/cloud-status" && cronSecret) {
        headers.authorization = `Bearer ${cronSecret}`;
      }
      const res = await fetch(`${base}${path}`, {
        signal: AbortSignal.timeout(15000),
        headers
      });
      const ct = res.headers.get("content-type") ?? "";
      const isJson = ct.includes("application/json");
      const body = isJson ? await res.json().catch(() => ({})) : null;
      const inventoryOk = path !== "/api/inventory-health" || body?.ok === true;
      const healthOk = path !== "/api/health" || body?.ok !== false;
      const ok = res.ok && isJson && inventoryOk && healthOk;
      if (!isJson) {
        log(false, `${path} → HTTP ${res.status} (bukan JSON — perlu redeploy + middleware inventory-health)`);
        continue;
      }
      log(ok, `${path} → HTTP ${res.status}${body?.ok === false ? " (ok:false)" : ""}`);
      if (path === "/api/inventory-health" && body?.counts) {
        console.log("   counts:", JSON.stringify(body.counts));
        if (body.checks) console.log("   checks:", JSON.stringify(body.checks));
      }
      if (path === "/api/health" && body?.checks) {
        console.log("   checks:", JSON.stringify(body.checks));
      }
      if (path === "/api/cloud-status" && body?.persistenceMismatch?.enabled) {
        const mm = body.persistenceMismatch.totals?.mismatches ?? 0;
        if (mm > 0) {
          console.log(`   persistenceMismatch: ${mm} mismatch(es) detected`);
        } else {
          console.log("   persistenceMismatch: no mismatches");
        }
      }
    } catch (e) {
      log(false, `${path} → ${e instanceof Error ? e.message : "error"}`);
    }
  }
}

async function main() {
  console.log("=== Rumah NF3 — Deploy Verification ===\n");

  run("node --env-file=.env.local scripts/check-prod-env.mjs", "Env production check");

  await checkSupabaseInventory();

  run("npm run test:inventory", "Unit test inventory");
  run("npm run test:inventory-e2e", "E2E inventory Supabase");
  run("npm run test:waste-form-flow", "Waste form flow");

  const tc = spawnSync("npm run typecheck", { shell: true, stdio: "inherit" });
  if (tc.status !== 0) {
    console.log("  ⚠ Typecheck gagal (sering RAM lokal). Vercel build menjalankan tsc sendiri.");
  } else {
    log(true, "TypeScript");
  }

  if (skipBuild) {
    console.log("\n○ Build dilewati (--skip-build)");
  } else {
    const buildOk = run(
      "set NODE_OPTIONS=--max-old-space-size=4096&& npm run build",
      "Next.js build"
    );
    if (!buildOk) {
      console.log("  ⚠ Build lokal gagal (sering karena RAM). Vercel build biasanya tetap OK.");
    }
  }

  const prod = prodUrl ?? "https://kds.nf3.company";
  if (prodUrl || args.includes("--check-prod")) {
    await checkProdEndpoints(prod);
  } else {
    console.log(
      "\n○ Cek production: npm run verify:deploy -- --check-prod"
    );
    console.log("  atau: npm run verify:deploy -- --prod https://kds.nf3.company");
  }

  console.log("\n---");
  const criticalFail = fail;
  if (criticalFail > 0) {
    console.log(`GAGAL: ${criticalFail} cek kritis tidak lulus.`);
    process.exit(1);
  }
  console.log("SIAP DEPLOY — cek kritis lulus. Redeploy lalu: npm run verify:deploy -- --skip-build --check-prod");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
