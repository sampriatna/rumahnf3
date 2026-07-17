/**
 * Smoke UAT POS production (tanpa session — cek ketersediaan route).
 * Untuk flow penuh: login pos.nf3.company → PIN kasir outlet → buka shift.
 */
const BASE = process.env.SMOKE_BASE_URL ?? "https://pos.nf3.company";

const checks = [
  { name: "health", url: "https://rumah.nf3.company/api/health", expect: 200 },
  { name: "pos-login", url: `${BASE}/pos/login`, expect: 200 },
  { name: "pos-root", url: `${BASE}/pos`, expect: [200, 303, 307] },
  { name: "pos-kbu", url: `${BASE}/pos?outlet=kbu`, expect: [200, 303, 307] }
];

let failed = 0;

for (const c of checks) {
  try {
    const res = await fetch(c.url, { redirect: "manual" });
    const ok = Array.isArray(c.expect) ? c.expect.includes(res.status) : res.status === c.expect;
    console.log(`${ok ? "✔" : "✗"} ${c.name} ${res.status} ${c.url}`);
    if (!ok) failed++;
  } catch (err) {
    console.log(`✗ ${c.name} ERROR ${err instanceof Error ? err.message : err}`);
    failed++;
  }
}

if (failed > 0) {
  console.error(`\n${failed} smoke check(s) failed.`);
  process.exit(1);
}

console.log("\nSmoke route OK. Manual UAT: login kasir → buka shift → layout 3-area → tipe pesanan → meja wajib dine-in.");
