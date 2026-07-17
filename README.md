# Rumah NF3 — Internal Command Center & ERP Lite

Portal induk ("rumah kerja digital") untuk **Nusa Food Group** (Kopi Buri Umah / KBU, Kisamen, Samtaro Express) dan **Nusa Fishing**.
Tujuan: satu pusat kerja internal untuk owner, leader, admin, dan staf lapangan.

> **Status: Fase L2b selesai (Void/Refund POS + reversal loyalty). WA campaign broadcast belum dibangun (struktur segmen siap).**
> POS order lunas → ledger + stock out BOM + KDS. Setoran shift POS = verifikasi saja.

## Prinsip

- **Staf lapangan gaptek-friendly**: tombol besar, 1 layar 1 aksi, bahasa lapangan ("Kirim Laporan", "Menunggu Dicek").
- **Task Dashboard existing (`task.nf3.company`) TIDAK di-rebuild** — hanya di-link dari "Ruang Task".
- **Slip gaji private** per user (lihat catatan keamanan di `supabase/schema.sql`).
- **AI = advisor**, keputusan tetap manusia.
- **POS/KDS** — schema di `supabase/pos-kds.sql`; **POS Kasir (7b)** aktif in-memory di `/pos`.

## Stack

Next.js 14 (App Router) · TypeScript · TailwindCSS · Supabase (Postgres) — mengikuti konvensi app NF lain.

## Menjalankan

```bash
npm install
cp .env.example .env.local   # isi nilainya (lihat catatan di file)
npm run dev
```

Buka http://localhost:3000 — kamu akan diarahkan ke halaman login.
Akun demo (PIN semua **1234**), tertera juga di halaman login saat mode dev:

| Nomor HP | Peran |
|----------|-------|
| 0800 | Owner |
| 0801 | Admin / Keuangan |
| 0802 | Leader (KBU) |
| 0803 | Staf (KBU) |

## Struktur

```
app/
  page.tsx            # Pintu masuk: redirect ke /dashboard (bila login) atau /login
  login/              # Halaman login (HP + PIN)
  actions.ts          # Server actions: loginAction, logoutAction
  dashboard/          # Dashboard per role (staff / leader / admin / owner)
  staff/form/         # Ruang Form: daftar + /[type] (form dinamis)
  staff/status/       # Status Request Saya (feedback)
  inbox/              # Request & laporan masuk (leader: outletnya, owner/admin: semua)
  sop/                # SOP list + /[id] detail ("Saya sudah baca")
  q/[code]/           # QR shortcut: scan → redirect ke form ter-prefill
  qr/                 # Poster QR (generate gambar QR untuk dicetak)
  form-actions.ts     # Server actions: submitForm, updateStatus, acknowledgeSop
  approval-actions.ts # Server actions: decideApproval
  approvals/          # Approval Center (leader/owner/admin)
  reports/owner/      # Owner Report — ringkasan lintas outlet
  reports/outlet/     # Dashboard outlet (leader) + aktivitas staf
  reports/ratings/    # Rating & kendala (dari Lapor Kendala)
  ai/                 # AI Direktur — tombol "Analisa Hari Ini"
  inventory/          # Gudang & stok (master + kritis)
  inventory/movements/ # Riwayat barang masuk/keluar/waste/transfer
  purchasing/         # PO, request bahan, terima barang
  inventory-actions.ts
  finance/            # Ringkasan kas owner/admin + kas masuk/keluar manual
  finance/ledger/     # Buku kas (ledger append-only)
  finance-actions.ts
  pos/                 # POS Kasir (tablet): menu, keranjang, bayar
  pos/checkout/[orderId]/ # Split payment
  pos/close/           # Tutup shift → setoran kasir otomatis
  pos-actions.ts
  kds/                 # KDS board per station (Dapur/Bar)
  kds-actions.ts
  segera/             # Placeholder fitur menyusul
lib/
  types.ts            # Tipe inti (Role, MenuItem, dll)
  rbac.ts             # Definisi role + menu per role (sumber kebenaran navigasi)
  session.ts          # Session cookie bertanda HMAC (server-side)
  auth.ts             # Autentikasi (saat ini terhadap data mock)
  forms.ts            # Definisi form (data-driven) + aturan task/approval
  feedback.ts         # Status request (bahasa lapangan) + warna badge
  store.ts            # Penyimpanan sementara di memori (diganti Supabase)
  sop.ts              # Konten SOP contoh
  qr.ts               # Registry QR shortcut
  forms-roadmap.ts    # Roadmap form fase berikutnya
  approval.ts         # Routing leader vs owner, status approval
  wa.ts               # Format & log notifikasi WA
  reports.ts          # Agregasi report harian & rating
  ai-advisor.ts       # AI advisor berbasis aturan (baca data store)
  inventory.ts        # Master barang, movement types, seed
  inventory-service.ts # Stok, movement, purchasing engine
  purchasing.ts       # Supplier, PO, purchase request types
  finance.ts          # Tipe ledger, akun, utang, piutang, kategori kas
  finance-service.ts  # Engine keuangan: ledger, summary, hook setoran/PO
  pos-kds-roadmap.ts  # Tipe & roadmap implementasi POS/KDS (Fase 7, referensi schema)
  pos-seed.ts         # Seed menu & register demo
  pos-service.ts      # Engine POS: shift, cart, order, payment, close→setoran
  pos-recipes.ts      # BOM menu → bahan inventory
  pos-integration.ts  # Order lunas → ledger + stock out + KDS
  kds-service.ts      # Engine KDS: fire ticket, board, advance/bump
  mock-data.ts        # Data contoh (outlet, user) — diganti Supabase nanti
  constants.ts        # Konstanta global (URL task dashboard, dll)
components/           # MenuCard, RoleBadge, StatusBadge, FormRenderer, PageHeader, icon-map
supabase/
  schema.sql          # Fondasi DB (RBAC, organisasi)
  pos-kds.sql         # Desain POS/KDS (Fase 7) — register, menu, order, KDS, payment
```

## Roadmap

1. **Fase 1** — Portal induk + RBAC + dashboard role + link-out task *(selesai)*
2. **Fase 2** — SOP + Form + Feedback + QR shortcut *(selesai, data masih in-memory)*
3. **Fase 3** — Approval Center + routing leader/owner + log WA *(selesai)*
4. **Fase 4** — Report harian/outlet + Rating + AI Direktur *(selesai)*
5. **Fase 5** — Inventory + Purchasing *(selesai, in-memory)*
6. **Fase 6** — Finance / Kas *(selesai: ledger, free cash, setoran→kas, PO→utang)*
7. **Fase 7** — POS/KDS *(7a–7d aktif; 7e platform webhook menyusul)*
8. **Fase L1** — Member & Loyalty Basic *(selesai: member DB, poin, stamp 10-gratis-1, voucher, redemption, report)*
9. **Fase L2a** — Loyalty Advanced *(selesai: tier otomatis + benefit diskon, voucher otomatis first-purchase/birthday/winback, segmentasi, penyesuaian poin manual + audit, AI loyalty insight)*
10. **Fase L2b** — Void/Refund POS + reversal *(selesai: void order lunas → contra kas, restock opsional, balik poin/stamp, kembalikan voucher, audit)*
11. **Fase L3** — *(rencana: WA campaign broadcast pakai segmen yang sudah ada; PIN/OTP redeem)*

### Void / Refund (Fase L2b)

- Void order **lunas** hanya untuk **leader/admin/owner** (kasir staf tidak bisa) — kontrol fraud.
- Tombol **Void** muncul di daftar order POS → halaman konfirmasi `/pos/void/[orderId]` (wajib alasan = audit).
- Efek: **Finance** contra ledger (`Refund/Void POS`) + kas tertahan dibatalkan; **Inventory** restock opsional (centang "barang belum dibuat"); **Loyalty** poin earned dikurangi, poin redeem dikembalikan, stamp dikurangi, voucher yang dipakai diaktifkan lagi — semua via `loyalty_transactions` (tx_type `reversal`).

### Loyalty Advanced (Fase L2a)

- **Tier**: Basic / Silver / Gold (5%) / VIP (10%). Auto-assign dari total spending & transaksi tiap order lunas. Gold/VIP dapat **diskon tier** yang bisa dipakai kasir di checkout.
- **Voucher otomatis**: first-purchase (member baru, otomatis saat transaksi pertama), ulang tahun & winback (digenerate admin/owner via tombol di Report Loyalty).
- **Segmentasi terkomputasi**: Member Baru, Loyal, High Spender, Tidak Aktif, Ultah Bulan Ini — siap untuk WA campaign (L2b).
- **Penyesuaian poin manual**: hanya admin/owner, wajib alasan, tercatat di `loyalty_transactions` (audit log).
- **AI Direktur · Insight Loyalty**: di `/reports/loyalty` — efektivitas program, deteksi promo boros (redemption rate), pelanggan loyal/winback, saran kampanye & menu untuk program stamp.

### Member & Loyalty (Fase L1)

Modul member **menempel di pipeline POS** (`onPosOrderCompleted`), bukan modul berdiri sendiri.

**Cara uji:**
1. Login **Staf/Leader** → **POS Kasir** → buka shift → tambah menu → **Lanjut Bayar**
2. Di checkout: **Cari member** (coba `0812` atau `Budi`) atau **Daftar member baru**
3. Member tampil: poin, stamp kopi, voucher aktif → **Pakai voucher** / **Tukar poin**
4. Bayar → poin & stamp otomatis bertambah; 10 stamp kopi = voucher gratis 1 kopi
5. Item reward (gratis) → stok tetap berkurang (`source = loyalty_redemption`), promo cost masuk report
6. Owner/Admin → **Member & Loyalty** (`/reports/loyalty`) → member aktif, poin beredar, biaya promo, menu favorit, pelanggan tidak aktif

**Keputusan desain penting:**
- Poin **gabungan lintas outlet** (`outlet_scope = all`)
- Promo cost item gratis = **harga jual normal**, dicatat **NON-KAS** (tidak mengurangi saldo kas; hanya stok bahan yang berkurang via inventory). Terlihat di Finance & Report Loyalty.
- Semua perubahan poin lewat `loyalty_transactions` (ledger append-only = audit)
- Nomor HP unik = anti-fraud dasar

Schema blueprint: `supabase/loyalty.sql`. Logika: `lib/loyalty.ts`, `lib/loyalty-service.ts`, `lib/pos-integration.ts`.

### Integrasi Finance + Inventory (Fase 7d)

Saat order POS **lunas**:
- Setiap payment → **finance ledger** (`POS Penjualan`, akun cash/QRIS/online)
- QRIS/GoFood → **kas tertahan** otomatis
- Resep/BOM → **Stock Out** stok outlet (`/inventory/movements`)

Setoran dari **tutup shift POS** → approval leader **tanpa double-count** (kas sudah per order).
Setoran **manual** (form) → tetap masuk ledger saat di-approve.

Resep demo: Latte (kopi+susu+cup), Nasi Goreng (beras+ayam+minyak), dll. — lihat `lib/pos-recipes.ts`.

### KDS Dapur/Bar (Fase 7c) — cara uji

1. Tab/device **Staf (0803)** buka **KDS Dapur/Bar** → pilih **Dapur** atau **Bar**
2. Tab lain **POS Kasir** → buat order (Latte → Dapur Bar, Nasi Goreng → Dapur)
3. Bayar order → ticket muncul di KDS (auto-refresh 12 detik)
4. **Mulai Masak** → **Siap!** → **Sudah Diambil**
5. Order GoFood/Grab = prioritas (highlight merah)

### POS Kasir (Fase 7b) — cara uji

1. Login **Staf KBU (0803)** atau **Leader (0802)**
2. Buka **POS Kasir** → **Mulai Shift**
3. Tap menu (Latte, Nasi Goreng, dll.) → **Lanjut Bayar**
4. Bayar penuh (Cash/QRIS) atau **split payment** (bayar sebagian)
5. **Tutup Shift** → setoran verifikasi masuk **Approval** leader
6. Cek **Finance / Ledger** & **Inventory movements** — sudah terisi saat bayar order

Menu demo: 12 item KBU (Kopi, Non-Kopi, Makanan, Snack).

### POS/KDS — Isi desain (Fase 7)

| Area | Tabel | Fungsi |
|------|-------|--------|
| Shift | `pos_registers`, `pos_shifts` | Kasir buka/tutup shift → rekonsiliasi setoran |
| Menu | `menu_categories`, `menu_items`, `menu_modifiers` | Harga per outlet, modifier, station KDS |
| BOM | `recipes`, `recipe_lines` | Auto stock out ke inventory saat order selesai |
| Order | `orders`, `order_items`, `order_payments` | POS + split payment + platform online |
| KDS | `kds_tickets` | Dapur/Bar: New → Cooking → Ready → Served |
| Audit | `order_events` | Jejak perubahan status |

**Integrasi yang sudah dirancang** (implementasi di fase POS nyata):
- Payment captured → `finance_ledger` (cash / QRIS pending / GoFood pending)
- Order completed → `stock_movements` via recipe/BOM
- Close shift → bandingkan dengan form **Setoran Kasir** + approval selisih
- SLA KDS → feed **AI Direktur** & Owner Report

Jalankan schema (setelah `schema.sql`):

```bash
# Di Supabase SQL Editor — urutan wajib:
# 1. supabase/schema.sql
# 2. supabase/pos-kds.sql   (setelah modul inventory/finance migrasi)
```

## Roadmap Form (rencana fase berikutnya)

Definisi lengkap ada di `lib/forms-roadmap.ts`. Staf KBU hanya melihat form yang relevan untuk outletnya di halaman **Isi Form → Segera Hadir**.

| Form | Fase | Bisnis | Alur singkat |
|------|------|--------|--------------|
| Opening / Closing Outlet | 2 | F&B | → task opening/closing, verifikasi leader |
| Handover Shift | 2 | Semua | → log serah terima shift |
| Komplain Pelanggan | 2 | KBU, Kisamen, Samtaro | → Rating Report + task follow-up |
| Pengeluaran Kas Kecil / Kasbon | 3 | Semua | → Approval leader/owner → finance/payroll |
| **Waste Bahan** | 5 | Semua + NF | → stock movement Waste → report waste outlet *(aktif)* |
| **Stock Opname** | 5 | Semua | → koreksi stok + report selisih *(aktif)* |
| Barang Masuk / Keluar / Konfirmasi Terima | 5 | Semua | → loop request→belanja→terima |
| Waste Produksi / Hasil Packing | 5 | NF saja | → efisiensi produksi & stok FG |
| **Setoran Kasir** | 6 | F&B | → kas masuk + verifikasi leader *(aktif)* |
| **Selisih Kas** | 6 | Semua | → task investigasi + approval |
| Upload Nota | 6 | Semua | → purchasing + utang/kas keluar |

QR shortcut direncanakan per area (contoh: `kbu-dapur-waste`, `kbu-kasir-setoran`) — lihat `qrHint` di roadmap.
