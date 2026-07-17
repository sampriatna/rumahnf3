#!/usr/bin/env node
/**
 * Pre-deploy checklist — jalankan sebelum push ke Vercel production.
 * Usage: npm run check:prod
 *        node --env-file=.env.local scripts/check-prod-env.mjs
 */

const required = ["SESSION_SECRET", "CRON_SECRET"];
const recommended = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "INVENTORY_SOURCE",
  "NEXT_PUBLIC_APP_URL",
  "WA_PROVIDER_URL",
  "WA_PROVIDER_TOKEN"
];

let fail = 0;
let warn = 0;

console.log("Rumah NF3 — Production env check\n");

for (const key of required) {
  const ok = Boolean(process.env[key]?.trim());
  console.log(`${ok ? "✓" : "✗"} ${key}${ok ? "" : " (WAJIB di production)"}`);
  if (!ok) fail++;
}

console.log("");

for (const key of recommended) {
  const ok = Boolean(process.env[key]?.trim());
  console.log(`${ok ? "✓" : "○"} ${key}${ok ? "" : " (disarankan)"}`);
  if (!ok) warn++;
}

console.log("\n---");
if (fail > 0) {
  console.log(`GAGAL: ${fail} env wajib belum terisi.`);
  process.exit(1);
}
console.log(`OK: env wajib lengkap.${warn > 0 ? ` ${warn} disarankan belum ada.` : ""}`);
process.exit(0);
