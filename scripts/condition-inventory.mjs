#!/usr/bin/env node
/**
 * Kondisioning inventory: template Sheets → CSV → enrich master → Supabase.
 *
 * Usage:
 *   npm run condition:inventory
 *   npm run condition:inventory -- "C:\path\Barang_Masuk.csv"
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const DEFAULT_TEMPLATE =
  "c:\\Users\\Administrator\\Downloads\\Salinan dari template_inventory_fnb_multi_outlet_v3 - Barang_Masuk.csv";

const templatePath = process.argv[2] || DEFAULT_TEMPLATE;
const CSV_DIR = path.join(process.cwd(), "data", "inventory-csv");
const ENV_FILE = path.join(process.cwd(), ".env.local");

function run(cmd) {
  console.log(`\n> ${cmd}\n`);
  execSync(cmd, { stdio: "inherit", cwd: process.cwd(), shell: true });
}

function parseEnv(path) {
  if (!fs.existsSync(path)) return {};
  const out = {};
  for (const line of fs.readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return out;
}

function ensureEnv(key, value) {
  const env = parseEnv(ENV_FILE);
  if (env[key] === value) return;
  const line = `\n# inventory conditioning\n${key}=${value}\n`;
  fs.appendFileSync(ENV_FILE, line, "utf8");
  console.log(`+ ${ENV_FILE}: ${key}=${value}`);
}

/** Harga patokan & supplier utama dari riwayat barang masuk terakhir. */
function enrichMasterBahanFromMasuk() {
  const masukFile = path.join(CSV_DIR, "barang_masuk.csv");
  const masterFile = path.join(CSV_DIR, "master_bahan.csv");
  if (!fs.existsSync(masukFile) || !fs.existsSync(masterFile)) return;

  const masukLines = fs.readFileSync(masukFile, "utf8").trim().split(/\r?\n/);
  const mHeader = masukLines[0].split(",");
  const idx = (n) => mHeader.indexOf(n);

  const byKode = new Map();
  for (const line of masukLines.slice(1)) {
    if (!line.trim()) continue;
    const c = line.split(",");
    const kode = c[idx("kode_bahan")]?.trim();
    if (!kode) continue;
    const tanggal = c[idx("tanggal")] ?? "";
    const qty = Number(c[idx("qty")]) || 0;
    const total = Number(c[idx("total_harga")]) || 0;
    const supplier = c[idx("supplier")]?.trim() || "—";
    const satuan = c[idx("satuan")]?.trim() || "pcs";
    const harga = qty > 0 && total > 0 ? Math.round(total / qty) : 0;

    const prev = byKode.get(kode);
    const suppliers = prev?.suppliers ?? {};
    suppliers[supplier] = (suppliers[supplier] ?? 0) + 1;

    if (!prev || tanggal >= prev.tanggal) {
      byKode.set(kode, {
        tanggal,
        harga,
        satuan,
        suppliers,
        nama: prev?.nama
      });
    } else {
      byKode.get(kode).suppliers = suppliers;
    }
  }

  const masterLines = fs.readFileSync(masterFile, "utf8").trim().split(/\r?\n/);
  const h = masterLines[0].split(",");
  const hi = (n) => h.indexOf(n);

  const out = [masterLines[0]];
  for (const line of masterLines.slice(1)) {
    if (!line.trim()) continue;
    const cols = line.split(",");
    const kode = cols[hi("kode_bahan")]?.trim();
    const info = byKode.get(kode);
    if (info) {
      if (info.harga > 0) cols[hi("harga_per_satuan_pakai")] = String(info.harga);
      const topSupplier = Object.entries(info.suppliers).sort((a, b) => b[1] - a[1])[0]?.[0];
      if (topSupplier && topSupplier !== "—") cols[hi("supplier_utama")] = topSupplier;
      if (info.satuan) {
        cols[hi("satuan_beli")] = info.satuan;
        cols[hi("satuan_pakai")] = info.satuan;
      }
    }
    out.push(cols.join(","));
  }

  fs.writeFileSync(masterFile, out.join("\n") + "\n", "utf8");
  const priced = [...byKode.values()].filter((v) => v.harga > 0).length;
  console.log(`\n✓ master_bahan enriched: ${priced}/${byKode.size} punya harga patokan dari beli terakhir`);
}

console.log("=== Rumah NF3 — condition inventory ===\n");

if (!fs.existsSync(templatePath)) {
  console.error(`Template tidak ditemukan: ${templatePath}`);
  process.exit(1);
}

run(`node scripts/convert-barang-masuk-template.mjs "${templatePath}"`);
run(`node scripts/extract-master-bahan-from-masuk.mjs "${templatePath}"`);
enrichMasterBahanFromMasuk();

ensureEnv("INVENTORY_SOURCE", "supabase");

run("npm run import:inventory");

console.log("\n=== Selesai ===");
console.log("- data/inventory-csv/barang_masuk.csv");
console.log("- data/inventory-csv/master_bahan.csv (harga patokan dari beli terakhir)");
console.log("- data/inventory-csv/barang-masuk-import-report.txt");
console.log("\nJalankan: npm run sync:vercel-env  lalu redeploy untuk INVENTORY_SOURCE=supabase");
