# Roadmap Rumah NF3 — Dari Prototipe ke Versi Poster

Dokumen ini memetakan **jarak (gap)** antara aplikasi yang sudah jalan sekarang dan
visi lengkap di infografis "RUMAH NF3 / NF3 ERP LITE", lalu menyusun langkah aman
untuk menutup gap tersebut.

> Status saat ini: **prototipe fungsional ±70%** dari poster. Supabase relasional + Auth + RLS
> sudah jalan; yang kurang terutama integrasi eksternal (payment, WA, marketplace) & HR.

---

## 1. Peta Gap (poster vs realita)

### ✅ Sudah jalan (bisa diuji sekarang)
- Dashboard, SOP, Form, Approval, Feedback, Rating Report
- POS, KDS, Inventory, Purchasing, Finance, **Transfer gudang→outlet**
- **Member & Loyalty** (poin, stamp 10-gratis-1, voucher, tier, segmentasi, void/refund, AI insight)
- **Integrasi inti**: POS → KDS → Inventory → Finance → Loyalty → Report → AI Direktur
- **Persistensi** disk + **Supabase relasional** (write-through) + cold-boot restore
- **Auth**: Email (Supabase Auth) + HP/PIN (bcrypt), middleware session, **RLS** per outlet

### 🟡 Sebagian / placeholder
- **Task** — masih link-out ke Task Dashboard lama (belum di-rebuild)
- **AI Direktur** — rule-based (belum LLM asli)
- **Multi-device** — web responsif (belum mobile app)
- **Sub-role staf** — kasir vs dapur vs gudang (satu role `staff` untuk semua)

### ⛔ Belum dibangun
- **HR & Payroll** — absensi, shift, payroll, slip gaji
- **API / Webhook / Real-time sync**
- **WhatsApp Business API** (broadcast & notifikasi asli)
- **Payment Gateway** (Midtrans/Xendit)
- **Integrasi marketplace** (GoFood/Grab/Shopee webhook) & **Google Review**
- **Hapus snapshot JSON** `app_state` setelah migrasi penuh (opsional cleanup)

---

## 2. Urutan langkah paling aman

### Fase D1 — Persistensi & keamanan data *(SELESAI sebagian)*
- [x] Disk persistence (`.data/nf3-store.json`) — data tidak hilang saat restart
- [ ] Tombol **export / import** data (backup manual) — opsional cepat

### Fase D2 — Migrasi ke Supabase (sedang berjalan)
Project Supabase sudah terhubung (`lib/supabase.ts`, kredensial di `.env.local`).

**D2a — Backup cloud snapshot (SELESAI di kode):**
- [x] `@supabase/supabase-js` + `lib/supabase.ts` (admin + anon client)
- [x] `lib/cloud-persist.ts` — simpan/muat seluruh state sebagai JSON ke `nf3.app_state`
- [x] `lib/store.ts` — auto-backup ke cloud tiap 8 dtk + restore otomatis saat disk hilang, dengan fallback aman ke disk/seed
- [ ] **Langkah manual kamu di dashboard** (2 klik): jalankan `supabase/app-state.sql` + expose schema `nf3`
- [ ] Verifikasi: `node --env-file=.env.local scripts/verify-cloud.mjs`

**D2b — Tabel relasional per-modul (sedang berjalan — pilot: Member/Loyalty):**
- [x] Repository layer `lib/db/loyalty-repo.ts` (map app camelCase ↔ baris snake_case, push/pull)
- [x] Write-through otomatis ke tabel relasional (lewat `cloudSave`, tiap 8 dtk)
- [x] Cold-boot: loyalty diambil dari tabel relasional (sumber kebenaran modul ini)
- [x] Route diagnostik `/api/cloud-status` (verifikasi tanpa shell)
- [x] `supabase/loyalty-app.sql` dijalankan + terverifikasi (customers 2, tiers 4, programs 2)
- [x] Catatan: pakai kolom eksplisit (bukan `select *`) — `*` bisa kosong tepat setelah DDL

**Pilot ke-2: POS / KDS (selesai ✅):**
- [x] `lib/db/pos-repo.ts` (registers, menu, recipes, shifts, orders+items/payments jsonb, KDS) + write-through + cold-boot
- [x] `supabase/pos-app.sql` (ID teks, timestamp teks verbatim, order items/payments jsonb)
- [x] `supabase/pos-app.sql` dijalankan di SQL Editor
- [x] Terverifikasi: `/api/cloud-status` → `posRelational` = registers 3, menu 4, items 12, recipes 11, shifts 1, orders 2, kds_stations 6, tickets 1
- [x] Catatan: `pullPos`/`pullLoyalty` dibuat **sekuensial** (bukan `Promise.all`) — query paralel di klien Supabase yg sama bisa balik kosong tepat setelah DDL

**Pilot ke-3: Inventory / Purchasing (selesai ✅):**
- [x] `lib/db/inventory-repo.ts` (items, stock_levels, movements, suppliers, PR, PO) + write-through + cold-boot
- [x] `supabase/inventory-app.sql` (ID teks, stok PK gabungan item+loc, PO items jsonb)
- [x] UI: banner aturan gudang vs outlet (inspirasi Blueprint Buri Umah — selaras arsitektur NF3)
- [x] `supabase/inventory-app.sql` dijalankan + terverifikasi (items 7, stockLevels 12, suppliers 4, movements 3)
- [x] Catatan: `select(cols, { count: "exact" })` — tanpa ini PostgREST bisa balik 0 baris

**Pilot ke-4: Finance / Kas (selesai ✅):**
- [x] `lib/db/finance-repo.ts` (account_balances, ledger, debts, receivables, held_cash) + write-through + cold-boot
- [x] `supabase/finance-app.sql` (saldo per akun, ledger append-only)
- [x] `supabase/finance-app.sql` dijalankan + terverifikasi (accountBalances 5, ledger 1, debts 1, receivables 1)

**Pilot ke-5: Forms / Approval / Notifikasi (selesai ✅):**
- [x] `lib/db/forms-repo.ts` (form_submissions, approvals, notification_logs) + write-through + cold-boot
- [x] `supabase/forms-app.sql` (payload & history jsonb, ID teks)
- [x] `supabase/forms-app.sql` dijalankan + terverifikasi (submissions 0, approvals 0, notificationLogs 0 — store belum ada aktivitas form)

**Pilot ke-6: Reports / AI Insights (selesai ✅):**
- [x] `lib/db/reports-repo.ts` (ai_insights, customer_ratings sync dari lapor_kendala) + write-through + cold-boot
- [x] `supabase/reports-app.sql` (AI insight jsonb arrays, ratings denormalisasi)
- [x] Daily/outlet/loyalty report tetap computed on-the-fly (sumber data sudah di modul lain)
- [x] `supabase/reports-app.sql` dijalankan + terverifikasi (aiInsights 0, customerRatings 0)
- [x] **D2b selesai** — semua modul inti sudah relasional.

### Fase D3 — Auth & multi-user (intake selesai ✅)
- [x] `supabase/auth-app.sql` — auth_accounts + outlet_cashier_pins
- [x] Login dual: Email+Password (Supabase Auth) & HP+PIN (bcrypt)
- [x] Halaman owner/admin: `/settings/pins` — kelola PIN kasir per outlet
- [x] Script `npm run seed:admin` — super admin dari `.env.local`
- [x] `auth-app.sql` dijalankan + seed OK (super admin Auth user aktif)
- [x] Terverifikasi: `/api/cloud-status` → authAccounts ≥1, outletCashierPins ≥0
- [x] `supabase/rls-policies.sql` — RLS per outlet/role + helper functions
- [x] `lib/data-scope.ts` + `lib/auth-guard.ts` — guard akses di app layer
- [x] `middleware.ts` — redirect ke login bila belum ada session
- [x] `rls-policies.sql` dijalankan + terverifikasi (enabledTables 33, policyCount 51)
- [ ] Hapus snapshot JSON setelah semua modul migrasi relasional

**Inspirasi Blueprint Buri Umah (referensi `D:\Inventory FnB Apps`) — tanpa mengubah scope inti:**
- [x] Sudah ada: stok gudang vs outlet terpisah, BOM POS → stock out outlet, RBAC per role
- [ ] Fase berikutnya: harga menu per outlet (`outlet_prices`) — saat ini base_price global per menu

**Transfer gudang → outlet (selesai ✅):**
- [x] Alur operasional: leader ajukan → gudang kirim → outlet terima (**tanpa approval owner**)
- [x] PO belanja ≥ Rp 2 jt → approval **Owner** (beda tier dari transfer rutin)

### Fase D3 — Auth & multi-user
- Login asli (Supabase Auth / kode PIN → session JWT)
- Row Level Security per outlet & role (RBAC sudah ada di `lib/rbac.ts`)

### Fase H1 — HR & Payroll (modul baru di poster)
- Data karyawan, absensi, shift & jadwal, payroll, slip gaji (sensitif)
- Terhubung ke Finance (gaji = kas keluar) & Approval

### Fase X1 — Integrasi eksternal (sesuai blok "Integrasi Eksternal" poster)
- Payment Gateway (Midtrans/Xendit) → POS pembayaran non-tunai asli
- WhatsApp Business API → broadcast segmen loyalty + notifikasi approval
- Marketplace webhook (GoFood/Grab/Shopee) → order online masuk otomatis
- Google Review / Instagram → feed ke Rating Report

### Fase M1 — Mobile & real-time
- PWA / mobile app (tablet kasir, HP owner)
- Real-time sync (Supabase Realtime) untuk KDS & dashboard

### Fase AI1 — AI Direktur asli
- Ganti advisor rule-based dengan LLM (mis. `OPENAI_API_KEY`) + data snapshot yang sudah ada

---

## 3. Yang JANGAN dikerjakan dulu (cegah scope melebar)
- WA broadcast & marketplace webhook sebelum Supabase + Auth beres (butuh data persisten & identitas user)
- Mobile app sebelum API/Realtime stabil
- LLM AI sebelum data nyata terkumpul di Supabase

---

## 4. Rekomendasi langkah berikut
**Migrasi Supabase (Fase D2)** adalah pondasi semua integrasi eksternal.
Kapan pun siap, buat project Supabase dan kirim kredensialnya — sisanya saya kerjakan
modul per modul tanpa membongkar fitur yang sudah jalan.
