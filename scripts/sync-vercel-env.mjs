/**
 * Push env dari .env.local ke Vercel (production + preview).
 * Tidak mencetak nilai secret ke stdout.
 */
import fs from "fs";
import { execSync } from "child_process";
import crypto from "crypto";

function addEnv(name, value, target) {
  if (!value) return;
  try {
    execSync(`npx vercel env add ${name} ${target} --force`, {
      input: value,
      stdio: ["pipe", "pipe", "pipe"],
      encoding: "utf8",
      shell: true,
      cwd: process.cwd()
    });
    console.log(`+ ${name} → ${target}`);
  } catch (err) {
    const msg = err.stderr?.toString() || err.message;
    console.warn(`! ${name} (${target}): ${msg.split("\n")[0]}`);
  }
}

const ENV_FILE = ".env.local";
const PUSH_KEYS = new Set([
  "SESSION_SECRET",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_TASK_DASHBOARD_URL",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_POS_URL",
  "NEXT_PUBLIC_KDS_URL",
  "SESSION_COOKIE_DOMAIN",
  "WA_PROVIDER",
  "WA_PROVIDER_URL",
  "WA_PROVIDER_TOKEN",
  "CRON_SECRET",
  "INVENTORY_SOURCE",
  "FINANCE_SOURCE",
  "NF3_FF_APP_SHELL_V1",
  "NF3_FF_POS_LAYOUT_V2",
  "NF3_FF_POS_DRAWER_NAV_V1",
  "NF3_FF_POS_SYNC_V1",
  "NF3_FF_ORDERS_PAGE_V1",
  "NF3_FF_CHECKER_READ_V1",
  "NF3_FF_KDS_SUMMARY_V1",
  "NF3_FF_UI_OPS_V1",
  "NF3_FF_UI_INVENTORY_V1"
]);

function parseEnvFile(path) {
  if (!fs.existsSync(path)) return {};
  const out = {};
  for (const line of fs.readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i <= 0) continue;
    out[trimmed.slice(0, i).trim()] = trimmed.slice(i + 1).trim();
  }
  return out;
}

const local = parseEnvFile(ENV_FILE);
if (!local.CRON_SECRET) {
  local.CRON_SECRET = crypto.randomBytes(24).toString("hex");
  fs.appendFileSync(ENV_FILE, `\nCRON_SECRET=${local.CRON_SECRET}\n`);
  console.log("+ CRON_SECRET generated and appended to .env.local");
}

for (const key of PUSH_KEYS) {
  const val = local[key];
  if (!val) continue;
  addEnv(key, val, "production");
  if (key.startsWith("NEXT_PUBLIC_")) {
    addEnv(key, val, "preview");
  }
}

console.log("Env sync selesai.");
