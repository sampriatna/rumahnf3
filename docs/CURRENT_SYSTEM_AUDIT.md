# CURRENT SYSTEM AUDIT

## 1) Teknologi yang digunakan

- **Frontend**: Next.js 14 App Router, React 18, TypeScript, Tailwind CSS.
- **Backend**: Next.js Server Actions + Route Handlers (monolith, tidak ada backend service terpisah).
- **Database**: Supabase Postgres (`nf3` schema) + beberapa SQL script idempotent manual.
- **Auth**:
  - Email/password via Supabase Auth.
  - HP + PIN via `auth_accounts` + bcrypt.
  - Session cookie HMAC (`nf3_session`).
- **State management**:
  - Server-side in-memory store (`lib/store.ts`) sebagai runtime utama banyak modul.
  - Sinkronisasi periodik ke disk `.data` + Supabase snapshot/relasional.
- **Deploy**: Vercel (production subdomain rumah/pos/kds/staff), cron endpoint via `vercel.json`.

## 2) Fitur yang sudah tersedia

- Login multi mode (email admin/owner, HP+PIN staf/leader, PIN kasir outlet).
- Dashboard role-based (owner/admin/leader/staff).
- POS dasar:
  - shift buka/tutup,
  - cart,
  - create order,
  - partial/full payment,
  - hold/resume,
  - split bill, merge bill, move table,
  - drawer entries,
  - receipt preview.
- KDS dapur/bar dasar:
  - ticket routing dari POS,
  - status proses item,
  - sinkronisasi status item ke POS.
- Forms + Approval:
  - submit form operasional,
  - approval center,
  - notifikasi WA basic.
- Finance dasar:
  - ledger append-only,
  - summary kas,
  - debt/receivable/held cash basic.
- Inventory dasar:
  - item/supplier master (dengan model ganda),
  - stock movement/transfer/request stok,
  - opname/waste flow parsial.
- Laporan dasar:
  - owner/outlet/loyalty/ratings.

## 3) Fitur yang berjalan sebagian

- **Multi-outlet**: sudah ada scoping outlet di banyak tempat, tetapi ID outlet masih fragmented (slug vs code vs UUID), sehingga konsistensi belum kuat.
- **KDS architecture**: ada dua model tiket (legacy dan board baru) yang berjalan paralel.
- **Payment lifecycle**: partial/paid ada, namun model refund belum komplit (lebih dekat ke void total).
- **Inventory source of truth**: ada model relasional + model “sheets-style”; keduanya coexist.
- **RBAC**: ada role/capability dan sebagian guard backend, tapi belum granular permission per action/entity.
- **Wallet/purchasing access**: sudah mulai diarahkan account-based, namun belum fully DB-enforced lewat policy terstruktur per user-wallet.

## 4) Fitur yang belum tersedia

- Checker workflow eksplisit end-to-end sebagai checkpoint order readiness.
- QR guest table ordering dengan secure token/table session dan control mode paid-first/pay-later.
- Realtime robust untuk KDS (masih polling interval).
- Production batch terstruktur (target vs actual, yield, input/output batch).
- Unified audit log lintas domain (POS, inventory, finance, recipe, shift).
- Permission matrix granular database-backed (`roles` + `permissions` + `role_permissions`) yang aktif dipakai app.
- Integrasi marketplace/payment gateway benar-benar online (masih mostly pencatatan channel/manual).

## 5) Masalah arsitektur

1. **Hybrid persistence kompleks**
   - In-memory + disk + Supabase snapshot + tabel relasional berjalan bersamaan.
   - Berisiko drift data antar layer.
2. **Dua model inventory aktif**
   - `inventory-app` dan `inventory-sheets` tidak sepenuhnya unified.
3. **Dua model POS/KDS**
   - `pos-app` aktif (JSONB order items/payments) vs desain normalized (`pos-kds.sql`) belum diadopsi.
4. **RBAC tidak konsisten**
   - Guard banyak tersebar per action/page, tidak lewat satu policy layer standar.
5. **Outlet identity fragmentation**
   - UUID/slug/code coexist tanpa registry tunggal.

## 6) Technical debt

- Modul besar dengan mixed concern (`lib/store.ts`, `lib/pos-service.ts`, `lib/loyalty-service.ts`).
- Beberapa fallback mock/dev masih ada di jalur auth.
- `auth-guard.ts` tersedia namun belum menjadi single enforcement point.
- Dokumentasi arsitektur belum tersentralisasi (sebelum dokumen audit ini).
- Testing coverage fokus utility/domain tertentu, belum kuat pada end-to-end flow kritikal.

## 7) Risiko keamanan

- Server menggunakan service-role Supabase untuk banyak write path, sehingga RLS bisa ter-bypass bila guard app terlewat.
- Endpoint diagnostik publik memberikan metadata sistem yang sebaiknya dibatasi.
- Authorization tersebar dan tidak selalu konsisten.
- Capability/role checks belum selalu disertai row-level/data-level guard yang seragam.
- Beberapa fallback auth/dev path dapat memperbesar attack surface jika tidak dipastikan nonaktif di produksi.

## 8) Risiko kehilangan data / inkonsistensi data

- Ketergantungan runtime in-memory + autosync bisa menyebabkan:
  - write order race,
  - partial sync,
  - stale state bila sinkronisasi gagal diam-diam.
- Tidak semua domain memakai append-only immutable ledger + reversal standard.
- Model ganda (inventory/POS schema) berpotensi menyebabkan laporan berbeda antar halaman.
- Tidak semua aksi sensitif memiliki audit trail before/after yang lengkap.

## 9) Komponen yang perlu dipertahankan

- Next.js monolith approach (cepat untuk incremental refactor).
- Service-layer domain modules yang sudah cukup jelas per area.
- Konsep append-only ledger di finance.
- Fondasi transfer/approval/shift flow yang sudah berjalan.
- RLS helper function sebagai basis hardening tahap lanjut.

## 10) Kesimpulan kondisi saat ini

Sistem sudah usable untuk sebagian operasi harian, namun masih berada pada fase transisi arsitektur. Untuk mencapai target platform multi-outlet F&B yang kuat, fokus utama bukan rewrite framework, melainkan **konsolidasi model data + penguatan authorization + unifikasi flow status domain** secara bertahap dan aman.
