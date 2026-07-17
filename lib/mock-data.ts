// Data contoh untuk fallback dev & seed demo.
// Login produksi: Supabase Auth (email) + auth_accounts.pin_hash (bcrypt) — BUKAN pin plaintext di sini.

export type MockGroup = { id: string; name: string };
export type MockOutlet = { id: string; groupId: string; code: string; name: string; uuid?: string };
// phone + pin HANYA fallback bila Supabase/auth_accounts belum tersedia (lib/auth-service).
// Jangan salin pola pin plaintext ke database produksi.
export type MockUser = {
  id: string;
  name: string;
  role: string;
  outletId?: string;
  phone: string;
  pin: string;
  /** P4 — sub-role staf (kosong = akses penuh staf). */
  capabilities?: import("./types").StaffCapability[];
};

export const GROUPS: MockGroup[] = [
  { id: "nfg", name: "Nusa Food Group" },
  { id: "nf", name: "Nusa Fishing" }
];

export const OUTLETS: MockOutlet[] = [
  {
    id: "kbu",
    groupId: "nfg",
    code: "KBU",
    name: "Kopi Buri Umah",
    uuid: "5ec5d95f-5b97-489b-a7f9-19866fd7f918"
  },
  {
    id: "kisamen",
    groupId: "nfg",
    code: "KSM",
    name: "Kisamen",
    uuid: "4ceece4b-42a5-44f8-bf06-ed5ea8135bc8"
  },
  {
    id: "samtaro",
    groupId: "nfg",
    code: "SMT",
    name: "Samtaro Express",
    uuid: "9a7b7e8c-6835-4322-a98a-8f3a016e6f8f"
  },
  {
    id: "nf-prod",
    groupId: "nf",
    code: "NF-PRD",
    name: "Nusa Fishing — Produksi",
    uuid: "72f687f0-b363-42f2-abf7-51ba9a36af95"
  }
];

// PIN demo semua "1234" — HANYA dev/fallback. Produksi: npm run seed:admin → bcrypt di Supabase.
export const USERS: MockUser[] = [
  { id: "u-owner", name: "Owner NF3", role: "owner", phone: "0800", pin: "1234" },
  { id: "u-admin", name: "Admin Keuangan", role: "admin", phone: "0801", pin: "1234" },
  { id: "u-leader", name: "Leader KBU", role: "leader", outletId: "kbu", phone: "0802", pin: "1234" },
  { id: "u-staff", name: "Aji (Staf Dapur)", role: "staff", outletId: "kbu", phone: "0803", pin: "1234", capabilities: ["forms"] },
  { id: "u-kds-dapur", name: "Tablet Dapur KBU", role: "staff", outletId: "kbu", phone: "0810", pin: "1234", capabilities: ["kds"] },
  { id: "u-kds-bar", name: "Tablet Bar KBU", role: "staff", outletId: "kbu", phone: "0811", pin: "1234", capabilities: ["kds"] },
  { id: "u-staff-kasir", name: "Siti (Kasir)", role: "staff", outletId: "kbu", phone: "0804", pin: "1234", capabilities: ["pos"] }
];

// Angka contoh untuk widget owner (placeholder, bukan data nyata).
export const DEMO_OWNER_WIDGETS = [
  { label: "Kas Tersedia", value: "Rp —", hint: "Fase 6" },
  { label: "Kas Masuk Hari Ini", value: "Rp —", hint: "Fase 6" },
  { label: "Request Bahan Pending", value: "—", hint: "Fase 2" },
  { label: "Stok Kritis", value: "—", hint: "Fase 5" },
  { label: "Task Telat", value: "—", hint: "sinkron task" },
  { label: "Approval Menunggu", value: "—", hint: "Fase 3" }
];
