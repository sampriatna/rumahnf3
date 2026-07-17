#!/usr/bin/env node
/**
 * Konversi export Google Sheets template → barang_masuk.csv (format import Supabase).
 *
 * Usage:
 *   node scripts/convert-barang-masuk-template.mjs "C:\path\Barang_Masuk.csv"
 *   npm run convert:barang-masuk -- "C:\path\file.csv"
 */
import fs from "fs";
import path from "path";

const input = process.argv[2];
if (!input) {
  console.error("Usage: node scripts/convert-barang-masuk-template.mjs <path-to-template-csv>");
  process.exit(1);
}

const OUT_DIR = path.join(process.cwd(), "data", "inventory-csv");
const OUT_FILE = path.join(OUT_DIR, "barang_masuk.csv");
const REPORT_FILE = path.join(OUT_DIR, "barang-masuk-import-report.txt");

const BULAN = {
  januari: "01",
  februari: "02",
  maret: "03",
  april: "04",
  mei: "05",
  juni: "06",
  juli: "07",
  agustus: "08",
  september: "09",
  oktober: "10",
  november: "11",
  desember: "12"
};

function parseTanggal(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = s.match(/^(\d{1,2})\s+(\w+)\s+(\d{4})$/i);
  if (!m) return null;
  const day = m[1].padStart(2, "0");
  const mon = BULAN[m[2].toLowerCase()];
  if (!mon) return null;
  return `${m[3]}-${mon}-${day}`;
}

function parseRupiah(raw) {
  const s = String(raw ?? "").trim();
  if (!s || s === "-") return 0;
  const n = s.replace(/Rp\s?/gi, "").replace(/\./g, "").replace(",", ".");
  const v = Number(n);
  return Number.isNaN(v) ? 0 : v;
}

function parseQty(raw) {
  const v = Number(String(raw ?? "").replace(/\./g, "").replace(",", "."));
  return Number.isNaN(v) ? 0 : v;
}

function readTemplateRows(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  let headerIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().includes("kode bahan") && lines[i].toLowerCase().includes("tanggal")) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx < 0) throw new Error("Header tidak ditemukan (harus ada kolom Tanggal + Kode Bahan)");

  const headers = lines[headerIdx].split(",").map((h) => h.trim().toLowerCase());
  const col = (names) => {
    for (const n of names) {
      const i = headers.findIndex((h) => h === n.toLowerCase());
      if (i >= 0) return i;
    }
    return -1;
  };

  const iTgl = col(["tanggal"]);
  const iKode = col(["kode bahan"]);
  const iQty = col(["qty masuk", "qty"]);
  const iSatuan = col(["satuan"]);
  const iHarga = col(["total harga beli", "total harga"]);
  const iSupplier = col(["supplier"]);
  const iLokasi = col(["lokasi tujuan"]);
  const iDiterima = col(["diterima oleh"]);

  const rows = [];
  for (let r = headerIdx + 1; r < lines.length; r++) {
    const cols = lines[r].split(",");
    if (cols.every((c) => !c.trim())) continue;
    rows.push({
      line: r + 1,
      tanggal: cols[iTgl]?.trim() ?? "",
      kodeBahan: cols[iKode]?.trim() ?? "",
      qty: cols[iQty]?.trim() ?? "",
      satuan: cols[iSatuan]?.trim() ?? "",
      totalHarga: cols[iHarga]?.trim() ?? "",
      supplier: cols[iSupplier]?.trim() ?? "",
      lokasiTujuan: cols[iLokasi]?.trim() ?? "",
      diterimaOleh: cols[iDiterima]?.trim() ?? ""
    });
  }
  return rows;
}

const raw = readTemplateRows(input);
const ok = [];
const skipped = [];
const warnings = [];
let lastTanggal = null;

for (const r of raw) {
  const kode = r.kodeBahan.trim();
  const qty = parseQty(r.qty);
  const parsed = parseTanggal(r.tanggal);
  if (parsed) lastTanggal = parsed;
  const tanggal = parsed ?? lastTanggal;

  if (!kode) {
    skipped.push({ line: r.line, reason: "kode bahan kosong", raw: r });
    continue;
  }
  if (!tanggal) {
    skipped.push({ line: r.line, reason: "tanggal tidak valid", raw: r });
    continue;
  }
  if (qty <= 0) {
    skipped.push({ line: r.line, reason: "qty <= 0", raw: r });
    continue;
  }

  let lokasi = r.lokasiTujuan.trim().toUpperCase();
  if (!lokasi) {
    lokasi = "GDG";
    warnings.push({
      line: r.line,
      kode,
      tanggal,
      msg: "lokasi_tujuan kosong → diisi GDG (perbaiki di sheet asli)"
    });
  }

  ok.push({
    id: `bm-${kode}-${tanggal.replace(/-/g, "")}-${r.line}`,
    tanggal: `${tanggal}T08:00:00Z`,
    kode_bahan: kode,
    qty,
    satuan: r.satuan || "pcs",
    total_harga: parseRupiah(r.totalHarga),
    supplier: r.supplier || "—",
    lokasi_tujuan: lokasi,
    diterima_oleh: r.diterimaOleh || "—"
  });
}

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const header =
  "id,tanggal,kode_bahan,qty,satuan,total_harga,supplier,lokasi_tujuan,diterima_oleh\n";
const body = ok
  .map((row) =>
    [
      row.id,
      row.tanggal,
      row.kode_bahan,
      row.qty,
      row.satuan,
      row.total_harga,
      row.supplier,
      row.lokasi_tujuan,
      row.diterima_oleh
    ].join(",")
  )
  .join("\n");

fs.writeFileSync(OUT_FILE, header + body + (body ? "\n" : ""), "utf8");

const report = [
  `Sumber: ${input}`,
  `Output: ${OUT_FILE}`,
  `Baris valid: ${ok.length}`,
  `Dilewati: ${skipped.length}`,
  `Peringatan (lokasi default GDG): ${warnings.length}`,
  "",
  "=== DILEWATI ===",
  ...skipped.map((s) => `Baris ${s.line}: ${s.reason} | kode=${s.raw.kodeBahan || "-"} tgl=${s.raw.tanggal || "-"}`),
  "",
  "=== LOKASI DEFAULT GDG (Juni dst — perbaiki di Sheets) ===",
  ...warnings.slice(0, 50).map((w) => `Baris ${w.line}: ${w.kode} ${w.tanggal} — ${w.msg}`),
  warnings.length > 50 ? `... +${warnings.length - 50} baris lagi` : ""
].join("\n");

fs.writeFileSync(REPORT_FILE, report, "utf8");

console.log(report);
console.log(`\nSiap import: npm run import:inventory`);
console.log(`(Pastikan master_bahan.csv punya kode: ${[...new Set(ok.map((r) => r.kode_bahan))].slice(0, 5).join(", ")}...)`);
