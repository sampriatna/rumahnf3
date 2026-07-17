// Verifikasi backup cloud Supabase (nf3.app_state).
// Jalankan: node --env-file=.env.local scripts/verify-cloud.mjs
// Hasil ditulis ke scripts/_cloud-verify.txt agar mudah dibaca.
import { writeFileSync } from "node:fs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const out = [];
const log = (...a) => out.push(a.join(" "));
const headers = {
  apikey: service,
  Authorization: `Bearer ${service}`,
  "Content-Type": "application/json",
  "Accept-Profile": "nf3",
  "Content-Profile": "nf3"
};

try {
  // 1) Tulis baris uji
  const w = await fetch(`${url}/rest/v1/app_state?on_conflict=id`, {
    method: "POST",
    headers: { ...headers, Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({ id: "verify", data: { ok: true, at: new Date().toISOString() } })
  });
  log("WRITE status:", w.status);
  if (w.status >= 400) log("WRITE body:", (await w.text()).slice(0, 300));

  // 2) Baca kembali
  const r = await fetch(`${url}/rest/v1/app_state?id=eq.verify&select=id,updated_at`, { headers });
  log("READ status:", r.status);
  log("READ body:", (await r.text()).slice(0, 300));

  if (w.status < 400) log("RESULT: OK — backup cloud siap.");
  else log("RESULT: BELUM siap — cek (1) SQL app-state.sql sudah dijalankan, (2) schema nf3 sudah di-expose.");
} catch (e) {
  log("ERROR:", e?.message || String(e));
}

writeFileSync(new URL("./_cloud-verify.txt", import.meta.url), out.join("\n"));
