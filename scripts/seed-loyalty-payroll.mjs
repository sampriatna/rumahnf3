#!/usr/bin/env node
/**
 * Seed Member/Loyalty + Payroll demo ke Supabase.
 *
 * Prasyarat SQL Editor:
 *   1. supabase/loyalty-app.sql
 *   2. supabase/payroll-app.sql
 *
 * Usage: npm run seed:loyalty-payroll
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env.local");
  process.exit(1);
}

const db = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  db: { schema: "nf3" }
});

const tiers = [
  {
    id: "tier-basic",
    name: "Basic",
    min_spending: 0,
    min_transactions: 0,
    discount_percent: 0,
    benefit_description: "Member baru",
    active: true
  },
  {
    id: "tier-silver",
    name: "Silver",
    min_spending: 500000,
    min_transactions: 5,
    discount_percent: 5,
    benefit_description: "Diskon 5%",
    active: true
  },
  {
    id: "tier-gold",
    name: "Gold",
    min_spending: 2000000,
    min_transactions: 15,
    discount_percent: 10,
    benefit_description: "Diskon 10%",
    active: true
  }
];

const programs = [
  {
    id: "lp-point",
    name: "Poin NF3",
    type: "point",
    outlet_scope: "all",
    active: true,
    earn_per_rupiah: 1000,
    min_purchase_for_point: 10000,
    description: "1 poin per Rp 1.000 belanja"
  },
  {
    id: "lp-stamp-kopi",
    name: "Kopi 10 Gratis 1",
    type: "stamp",
    outlet_scope: ["kbu"],
    active: true,
    required_stamp_count: 10,
    reward_label: "1 Kopi Gratis",
    description: "Khusus kategori kopi KBU"
  }
];

const customers = [
  {
    id: "cust-1",
    full_name: "Budi Santoso",
    phone: "62811110001",
    member_code: "NF3-100001",
    status: "active",
    total_points: 120,
    total_spending: 850000,
    total_transactions: 8,
    stamps: { "lp-stamp-kopi": 4 },
    tier_id: "tier-silver",
    registered_outlet_id: "kbu",
    created_at: new Date().toISOString()
  },
  {
    id: "cust-2",
    full_name: "Siti Rahayu",
    phone: "62811110002",
    member_code: "NF3-100002",
    status: "active",
    total_points: 45,
    total_spending: 320000,
    total_transactions: 3,
    stamps: {},
    tier_id: "tier-basic",
    registered_outlet_id: "kbu",
    created_at: new Date().toISOString()
  }
];

const payslips = [
  {
    id: "ps-2026-05-aji",
    user_id: "u-staff",
    user_name: "Aji (Staf Dapur)",
    outlet_id: "kbu",
    outlet_name: "Kopi Buri Umah",
    period_label: "Mei 2026",
    period_start: "2026-05-01",
    period_end: "2026-05-31",
    status: "published",
    published_at: "2026-06-05T01:00:00.000Z",
    note: "Kasbon diajukan 10 Apr — sisa 1x potongan di slip Juni."
  },
  {
    id: "ps-2026-04-aji",
    user_id: "u-staff",
    user_name: "Aji (Staf Dapur)",
    outlet_id: "kbu",
    outlet_name: "Kopi Buri Umah",
    period_label: "April 2026",
    period_start: "2026-04-01",
    period_end: "2026-04-30",
    status: "published",
    published_at: "2026-05-05T01:00:00.000Z"
  },
  {
    id: "ps-2026-05-siti",
    user_id: "u-staff-kasir",
    user_name: "Siti (Kasir)",
    outlet_id: "kbu",
    outlet_name: "Kopi Buri Umah",
    period_label: "Mei 2026",
    period_start: "2026-05-01",
    period_end: "2026-05-31",
    status: "published",
    published_at: "2026-06-05T01:00:00.000Z"
  }
];

const payslipLines = [
  ["ps-2026-05-aji", "Gaji Pokok", 3200000, "earning", 0],
  ["ps-2026-05-aji", "Tunjangan Makan", 450000, "earning", 1],
  ["ps-2026-05-aji", "Tunjangan Transport", 300000, "earning", 2],
  ["ps-2026-05-aji", "Lembur (12 jam)", 480000, "earning", 3],
  ["ps-2026-05-aji", "Potongan Kasbon (1/2)", 500000, "deduction", 4],
  ["ps-2026-05-aji", "Potongan Telat (2x)", 50000, "deduction", 5],
  ["ps-2026-04-aji", "Gaji Pokok", 3200000, "earning", 0],
  ["ps-2026-04-aji", "Tunjangan Makan", 450000, "earning", 1],
  ["ps-2026-04-aji", "Tunjangan Transport", 300000, "earning", 2],
  ["ps-2026-04-aji", "Bonus Target Outlet", 200000, "earning", 3],
  ["ps-2026-04-aji", "Potongan Kasbon (1/2)", 500000, "deduction", 4],
  ["ps-2026-05-siti", "Gaji Pokok", 3400000, "earning", 0],
  ["ps-2026-05-siti", "Tunjangan Makan", 450000, "earning", 1],
  ["ps-2026-05-siti", "Tunjangan Transport", 300000, "earning", 2],
  ["ps-2026-05-siti", "Insentif Kasir", 350000, "earning", 3]
].map(([payslip_id, label, amount, line_type, sort_order]) => ({
  id: `${payslip_id}-line-${sort_order}`,
  payslip_id,
  label,
  amount,
  line_type,
  sort_order
}));

async function upsert(table, rows) {
  if (!rows.length) return;
  const { error } = await db.from(table).upsert(rows, { onConflict: "id" });
  if (error) throw new Error(`${table}: ${error.message}`);
}

async function main() {
  console.log("Seeding loyalty...");
  await upsert("membership_tiers", tiers);
  await upsert("loyalty_programs", programs);
  await upsert("customers", customers);

  console.log("Seeding payroll...");
  await upsert("payroll_payslips", payslips);
  await upsert("payroll_payslip_lines", payslipLines);

  console.log("Done.");
  console.log(`  tiers: ${tiers.length}`);
  console.log(`  programs: ${programs.length}`);
  console.log(`  customers: ${customers.length}`);
  console.log(`  payslips: ${payslips.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
