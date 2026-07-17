#!/usr/bin/env node
/**
 * Ekstrak kode + nama unik dari template Barang Masuk → master_bahan.csv minimal.
 * Harga patokan = 0 (isi nanti dari tab Master Bahan asli).
 */
import fs from "fs";
import path from "path";

const input = process.argv[2];
if (!input) {
  console.error("Usage: node scripts/extract-master-bahan-from-masuk.mjs <template-barang-masuk.csv>");
  process.exit(1);
}

const text = fs.readFileSync(input, "utf8");
const lines = text.split(/\r?\n/);
let headerIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].toLowerCase().includes("kode bahan")) {
    headerIdx = i;
    break;
  }
}
const headers = lines[headerIdx].split(",").map((h) => h.trim().toLowerCase());
const iKode = headers.indexOf("kode bahan");
const iNama = headers.indexOf("nama bahan");
const iSatuan = headers.indexOf("satuan");

const map = new Map();
for (let r = headerIdx + 1; r < lines.length; r++) {
  const cols = lines[r].split(",");
  const kode = cols[iKode]?.trim();
  if (!kode) continue;
  const nama = cols[iNama]?.trim() || kode;
  const satuan = cols[iSatuan]?.trim() || "pcs";
  if (!map.has(kode)) map.set(kode, { nama, satuan });
}

const OUT = path.join(process.cwd(), "data", "inventory-csv", "master_bahan.csv");
const header =
  "kode_bahan,nama_baku,kategori,satuan_beli,satuan_pakai,konversi,harga_per_satuan_pakai,supplier_utama,stok_minimum,stok_aman,stok_maksimum,status_aktif,metode_stok\n";
const body = [...map.entries()]
  .sort((a, b) => a[0].localeCompare(b[0]))
  .map(([kode, v]) =>
    [
      kode,
      v.nama,
      "Umum",
      v.satuan,
      v.satuan,
      1,
      0,
      "—",
      0,
      0,
      0,
      "Aktif",
      "Distok"
    ].join(",")
  )
  .join("\n");

fs.writeFileSync(OUT, header + body + "\n", "utf8");
console.log(`master_bahan.csv: ${map.size} bahan unik → ${OUT}`);
console.log("harga_per_satuan_pakai=0 — ganti dari tab Master Bahan setelah export asli.");
