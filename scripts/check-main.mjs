// Cek apakah aplikasi sudah menulis snapshot 'main' ke cloud + ukurannya.
import { writeFileSync } from "node:fs";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const out = [];
const log = (...a) => out.push(a.join(" "));
const headers = { apikey: service, Authorization: `Bearer ${service}`, "Accept-Profile": "nf3" };
try {
  const r = await fetch(`${url}/rest/v1/app_state?id=eq.main&select=id,updated_at,data`, { headers });
  log("status:", r.status);
  const body = await r.json();
  if (Array.isArray(body) && body[0]) {
    log("main updated_at:", body[0].updated_at);
    const d = body[0].data || {};
    log("customers:", (d.customers || []).length, "posOrders:", (d.posOrders || []).length, "items:", (d.items || []).length);
    log("RESULT: OK — aplikasi sudah backup ke cloud.");
  } else {
    log("RESULT: baris 'main' belum ada. Buka http://localhost:3000 lalu tunggu ~10 dtk.");
  }
} catch (e) { log("ERROR:", e?.message || String(e)); }
writeFileSync(new URL("./_cloud-main.txt", import.meta.url), out.join("\n"));
