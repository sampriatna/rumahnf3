/**
 * UAT production POS — Fase A/B/C/D + drawer (authenticated HTTP).
 * Usage: node scripts/pos-production-uat.mjs
 */
const PORTAL = "https://rumah.nf3.company";
const POS = "https://pos.nf3.company";

class Jar {
  #m = new Map();
  store(res) {
    const list = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
    for (const raw of list) {
      const part = raw.split(";")[0];
      const i = part.indexOf("=");
      if (i > 0) this.#m.set(part.slice(0, i).trim(), part.slice(i + 1).trim());
    }
  }
  header() {
    return [...this.#m.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }
}

let failed = 0;
const log = (ok, name, detail = "") => {
  console.log(`${ok ? "✔" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failed++;
};

async function postLogin(url, fields, jar) {
  const body = new URLSearchParams(fields);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: jar.header() },
    body,
    redirect: "manual"
  });
  jar.store(res);
  return res;
}

function hasRedirectToPos(text) {
  return text.includes("NEXT_REDIRECT") && text.includes("/pos");
}

async function get(path, jar, base = POS) {
  const res = await fetch(`${base}${path}`, {
    headers: { Cookie: jar.header() },
    redirect: "manual"
  });
  jar.store(res);
  const text = res.status === 200 ? await res.text() : "";
  return { res, text };
}

async function follow(path, jar, base = POS) {
  let url = `${base}${path}`;
  for (let i = 0; i < 5; i++) {
    const res = await fetch(url, { headers: { Cookie: jar.header() }, redirect: "manual" });
    jar.store(res);
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) break;
      url = loc.startsWith("http") ? loc : new URL(loc, url).toString();
      continue;
    }
    const text = await res.text();
    return { res, text, url };
  }
  return { res: { status: 0 }, text: "", url };
}

console.log("=== NF3 POS Production UAT ===\n");

// --- Kasir outlet (PIN kasir) ---
const kasir = new Jar();
const loginKasir = await postLogin(`${POS}/api/auth/login-pos`, { outletId: "kbu", pin: "1234" }, kasir);
log([303, 307].includes(loginKasir.status), "S1 Login POS kasir (kbu+1234)", `HTTP ${loginKasir.status}`);

const posHome = await follow("/pos?outlet=kbu", kasir);
log(posHome.res.status === 200, "S2 POS home authenticated", `HTTP ${posHome.res.status}`);
log(
  posHome.text.includes("pos-drawer") || posHome.text.includes("Buka Shift") || posHome.text.includes("Mulai Penjualan"),
  "S2 Drawer atau buka shift terlihat"
);

const drawerRoutes = [
  { name: "Sync", path: "/pos/sync?outlet=kbu", must: ["Sinkronkan", "Antrean"] },
  { name: "History", path: "/pos/history?outlet=kbu", must: ["Penjualan Tanggal", "TRANSAKSI"] },
  { name: "Shift hub", path: "/pos/shift?outlet=kbu", must: ["Shift"] },
  { name: "Attendance", path: "/pos/attendance?outlet=kbu", must: ["Clock-in", "Absen"] }
];

for (const r of drawerRoutes) {
  const { res, text } = await get(r.path, kasir);
  const ok = res.status === 200 && r.must.some((m) => text.includes(m));
  log(ok, r.name, `HTTP ${res.status}`);
  log(!text.includes("Fase C — segera") && !text.includes("Fase B — segera"), `${r.name} bukan placeholder`);
}

const recapKasir = await get("/pos/recap?outlet=kbu", kasir);
log(hasRedirectToPos(recapKasir.text), "Recap blocked for kasir PIN");

const memberStaff = await get("/pos/member-deposit?outlet=kbu", kasir);
log(hasRedirectToPos(memberStaff.text), "Member deposit blocked for kasir PIN");

// --- Leader (0802) ---
const leader = new Jar();
const loginLeader = await postLogin(
  `${PORTAL}/api/auth/login-phone`,
  { phone: "0802", pin: "1234" },
  leader
);
log([303, 307].includes(loginLeader.status), "L1 Login leader 0802", `HTTP ${loginLeader.status}`);

const memberLeader = await follow("/pos/member-deposit?outlet=kbu", leader, POS);
log(memberLeader.res.status === 200, "L+ Member deposit leader", `HTTP ${memberLeader.res.status}`);
log(
  memberLeader.text.includes("Cari Member") || memberLeader.text.includes("Saldo deposit"),
  "Member deposit UI loaded"
);
log(!memberLeader.text.includes("Fase D — segera"), "Member deposit bukan placeholder");

const recapLeader = await get("/pos/recap?outlet=kbu", leader);
log(
  recapLeader.res.status === 200 && recapLeader.text.includes("Detail Rekapitulasi"),
  "Recap leader+ OK"
);

// --- Owner (0800) ---
const owner = new Jar();
const loginOwner = await postLogin(
  `${PORTAL}/api/auth/login-phone`,
  { phone: "0800", pin: "1234" },
  owner
);
log([303, 307].includes(loginOwner.status), "O1 Login owner 0800", `HTTP ${loginOwner.status}`);

const dash = await follow("/dashboard", owner, PORTAL);
log(dash.res.status === 200, "O1 Dashboard owner", `HTTP ${dash.res.status}`);

const posOwner = await follow("/pos?outlet=kbu", owner, POS);
log(posOwner.res.status === 200, "O POS access owner", `HTTP ${posOwner.res.status}`);
log(
  posOwner.text.includes("pos-drawer") || posOwner.text.includes("pos-global-header"),
  "O Drawer layout owner"
);

const syncOwner = await get("/pos/sync?outlet=kbu", owner);
log(syncOwner.res.status === 200 && syncOwner.text.includes("Perangkat"), "Fase C sync page owner");

console.log(`\n=== ${failed === 0 ? "SEMUA UAT LULUS" : `${failed} CEK GAGAL`} ===`);
process.exit(failed > 0 ? 1 : 0);
