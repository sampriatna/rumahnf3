# DATA MODEL PROPOSAL (NO MIGRATION EXECUTED)

Dokumen ini adalah usulan model data target + mapping ke struktur saat ini.  
**Tidak menjalankan migration** dan **tidak memaksa tabel baru** jika tabel lama bisa dipakai.

## 1) Prinsip model data

- Gunakan `outlet_id` di semua entitas transaksi.
- Pisahkan status order, payment, dan produksi item.
- Pakai ledger append-only untuk inventory dan audit.
- Reversal, bukan hard delete, untuk entitas finansial/stok/operasional.
- Pastikan mapping ID outlet konsisten (slug/code/uuid).

## 2) Evaluasi kebutuhan tabel vs kondisi saat ini

| Target Table | Existing Candidate / Mapping | Assessment | Action Proposal |
|---|---|---|---|
| `companies` | `business_groups` (di schema lama) | Partial | Reuse jika sudah dipakai; jika tidak, alias view/rename logical |
| `outlets` | `outlets` sudah ada + `mock-data` + `master_lokasi` | Partial | Buat registry mapping outlet identity (tanpa langsung drop tabel lama) |
| `production_areas` | `areas` (schema), `kds_stations`/`area_id` (POS) | Partial | Reuse `areas` sebagai canonical; map station area ke sini |
| `user_profiles` | `auth_accounts` aktif; `users` lama ada | Partial | Pertahankan `auth_accounts` sebagai active profile, tambah kolom bertahap jika perlu |
| `roles` | role string di `auth_accounts`; tabel `roles` lama ada | Partial | Gunakan tabel roles canonical, tetap support role string transisi |
| `permissions` | belum ada tabel aktif (capabilities array saja) | Missing | Tambah desain `permissions` + `role_permissions` (phase bertahap) |
| `user_outlets` | outlet tunggal di akun + scoping ad hoc | Partial | Tambah mapping multi-outlet access (jika dibutuhkan) |
| `products` | menu items ada (POS), inventory item master ada | Partial | Bedakan product jual vs ingredient; harmonisasi relasi |
| `product_outlet_settings` | branch menu settings sudah ada | Partial | Reuse/extend untuk active, availability, routing rules |
| `product_prices` | pricing per outlet/channel sudah parsial | Partial | Formalisasi table/listener untuk histori harga |
| `dining_tables` | floor tables sudah ada | Complete | Reuse, tambah audit jika perlu |
| `orders` | `pos_orders` aktif (JSONB item/payment) | Partial | Pertahankan sekarang, siapkan normalisasi bertahap |
| `order_items` | saat ini embedded JSONB | Missing | Tambah tabel normalisasi dengan sync bridge |
| `order_item_status_history` | belum ada table terstandar | Missing | Tambah append-only history item production |
| `payments` | embedded JSONB di order | Partial | Tambah tabel normalized `payments` secara bertahap |
| `cashier_shifts` | `pos_shifts` aktif | Complete | Reuse + tambah immutable/approval fields bila belum |
| `ingredients` | `master_bahan` / `inventory_items` | Partial | Pilih satu canonical ingredient master |
| `units` | satuan ada di beberapa field string | Partial | Tambah unit master tabel |
| `unit_conversions` | belum formal | Missing | Tambah conversion table |
| `recipes` | sudah parsial | Partial | Reuse lalu normalisasi relation ke ingredient/unit |
| `recipe_items` | sudah parsial | Partial | Reuse/align dengan unit conversions |
| `inventory_locations` | warehouse/outlet location sudah ada namun fragmented | Partial | Canonical location table + mapping |
| `inventory_movements` | ada tapi model ganda (`inventory-app` vs `inventory-sheets`) | Incorrect Architecture | Konsolidasi ke satu append-only movement table |
| `stock_opnames` | opname ada di flow/forms | Partial | Formalisasi header opname |
| `stock_opname_items` | opname detail belum seragam | Partial | Tambah detail table bila belum ada |
| `stock_transfers` | transfer request/workflow sudah ada | Partial | Reuse, tambah lifecycle lengkap + discrepancy |
| `stock_transfer_items` | ada line item basic | Partial | Tambah qty_sent/qty_received/reason variance |
| `production_batches` | belum ada | Missing | Tambah tabel batch produksi |
| `production_batch_inputs` | belum ada | Missing | Tambah tabel input konsumsi material |
| `production_batch_outputs` | belum ada | Missing | Tambah tabel output batch |
| `audit_logs` | audit tersebar domain-specific | Missing | Tambah audit log unified append-only |

## 3) Usulan relasi inti (target)

- `companies 1..* outlets`
- `outlets 1..* production_areas`
- `users *..* outlets` (via `user_outlets`) untuk akses lintas outlet
- `roles *..* permissions` (via `role_permissions`)
- `users *..* roles` atau role utama + grant tambahan
- `products 1..* product_outlet_settings`
- `products 1..* product_prices`
- `orders 1..* order_items`
- `order_items 1..* order_item_status_history`
- `orders 1..* payments`
- `outlets 1..* cashier_shifts`
- `ingredients 1..* recipe_items`
- `recipes 1..* recipe_items`
- `inventory_locations 1..* inventory_movements`
- `stock_transfers 1..* stock_transfer_items`
- `production_batches 1..* production_batch_inputs`
- `production_batches 1..* production_batch_outputs`

## 4) Mapping tabel lama -> struktur target (incremental)

### A. Identity & Access

- Pertahankan `auth_accounts` sebagai active table.
- Tambah layer mapping:
  - role granular (permissions),
  - multi-outlet access (`user_outlets`) bila diperlukan.
- `users`/`user_roles` lama tidak langsung dihapus; gunakan sebagai reference sampai migration jelas.

### B. POS/Order

- `pos_orders` tetap dipakai sementara.
- Tambah adapter write-through:
  - saat order update, sinkron juga ke `order_items` (new normalized table) secara incremental.
- Setelah stabil, read utama berpindah ke normalized tabel.

### C. Inventory

- Pilih satu canonical movement ledger.
- Tabel movement lain diperlakukan sebagai legacy source, lalu dimigrasi bertahap.
- Build compatibility view agar UI lama tetap jalan selama transisi.

### D. Transfer

- Reuse transfer request existing.
- Extend line item dengan `qty_sent`, `qty_received`, `discrepancy_reason`.
- Tambah status final `received_with_discrepancy`.

### E. Audit

- Reuse domain event lama sebagai sumber awal.
- Standardisasi ke `audit_logs` unified tanpa mematikan log lama langsung.

## 5) Konsekuensi perubahan struktur lama

1. **Jika inventory ledger disatukan**:
   - Perlu migrasi historis movement.
   - Risiko mismatch sementara antara halaman lama vs baru.
2. **Jika order dinormalisasi**:
   - Perlu dual-write period.
   - Potensi duplicate/inconsistency bila tanpa idempotency key.
3. **Jika RBAC digranularkan**:
   - Banyak server action perlu penyesuaian guard.
   - Butuh matriks permission jelas sebelum roll out.
4. **Jika outlet identity disatukan**:
   - Banyak join/filter existing perlu mapping adapter.
   - Wajib strategy non-breaking untuk laporan existing.

## 6) Rekomendasi “minimum disruptive”

- Jangan drop tabel lama di phase awal.
- Gunakan pola:
  1. add new table/view,
  2. dual-write + reconciliation check,
  3. switch read path,
  4. freeze old writes,
  5. deprecate old table.

## 7) Catatan khusus requirement terbaru (Jagasatru purchasing)

- “Dompet” saat ini sudah direpresentasikan sebagai `account_id` finance.
- Tetap gunakan model ini untuk incremental path, sambil menambah access mapping per user/account.
- Jangan campur transaksi Jagasatru dengan Purchasing Kecil.
- Pisahkan laporan via filter `account_id` + `area/unit`.
