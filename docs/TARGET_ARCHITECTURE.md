# TARGET ARCHITECTURE

## 1) Prinsip Arsitektur Target

- Satu platform multi-outlet, satu source of truth per domain.
- Hierarki organisasi wajib:
  - `company -> outlet -> production_area -> user -> device`.
- Semua transaksi operasional memiliki `outlet_id`.
- Pemisahan lifecycle:
  - `order_status`
  - `payment_status`
  - `order_item_production_status`
- Authorization harus enforced di:
  1. service/backend layer
  2. database policy/constraint layer
  (bukan hanya UI visibility).
- Semua aksi sensitif menulis audit log append-only.

## 2) Modul Target

1. **Identity & Access**
   - user profile
   - roles/permissions
   - user-outlet access
   - device session
2. **Catalog & Pricing**
   - product master
   - product per outlet
   - price per outlet/channel
   - production area routing map
3. **POS & Order**
   - table management
   - order/order item
   - payment
   - cashier shift
4. **KDS & Checker**
   - kitchen/bar production queue
   - checker/expo decision
   - queue display (Samtaro)
5. **Inventory & Warehouse**
   - inventory locations
   - inventory movements ledger
   - stock transfer
   - opname/waste/return
6. **Production Center**
   - recipe/BOM
   - production batch
   - batch inputs/outputs
7. **Audit & Approval**
   - approval rules
   - audit logs
8. **Reporting**
   - per outlet, per role
   - company consolidated
9. **Integration Adapter**
   - marketplace
   - payment gateway/QRIS
   - print bridge
   - WhatsApp notifier

## 3) Hubungan antar modul

- Identity & Access mengontrol semua modul lain.
- POS menghasilkan order/payment event ke:
  - KDS
  - Inventory movement
  - Shift reconciliation
  - Reporting
  - Audit log
- Warehouse & Production menyuplai inventory untuk outlet.
- Approval engine menjadi gatekeeper aksi sensitif.

## 4) Data Flow Order (Target)

1. User create order (`draft`) dengan `outlet_id`, channel, table/queue context.
2. Order dikonfirmasi (`confirmed`) setelah validasi policy outlet.
3. Setiap `order_item` diroute ke `production_area_id`.
4. Item siap (`ready`) per area; checker dapat:
   - approve complete
   - hold issue
5. Order menjadi `completed` hanya saat item wajib selesai/checker approve.
6. Cancelled order menghasilkan reversal (bukan delete).

## 5) Data Flow KDS (Target)

1. POS publish order item ke KDS queue by production area.
2. KDS transitions item:
   - `queued -> accepted -> preparing -> ready -> served`
3. Semua perubahan status item tersimpan dalam `order_item_status_history`.
4. Checker mengonsolidasikan readiness lintas dapur/bar.
5. Queue display mengambil status item/order per outlet/channel.

## 6) Data Flow Pembayaran (Target)

1. Payment intent dibuat per order.
2. Payment lines mendukung split method/channel.
3. `payment_status` dihitung dari total captured/refunded:
   - `unpaid`, `partially_paid`, `paid`, `refunded`.
4. Refund/void tidak menghapus data; buat event + audit + reversal movement.
5. Shift reconciliation mengonsumsi payment ledger untuk expected cash.

## 7) Data Flow Inventori (Target)

1. Semua perubahan stok ditulis ke `inventory_movements` (append-only).
2. `current_stock` = agregasi movement by location+item.
3. Source movement:
   - purchase
   - transfer
   - production consumption/output
   - sales consumption (BOM)
   - waste
   - return
   - opname adjustment
   - cancellation reversal
4. Transfer:
   - stok gudang turun saat `shipped` (atau in-transit policy terpilih)
   - stok outlet naik saat `received`
   - discrepancy wajib tercatat.

## 8) Role Access (Target)

- `OWNER`: full global.
- `CENTRAL_ADMIN`: global admin operasional.
- `OUTLET_LEADER`: scoped outlet.
- `CASHIER`, `WAITER`, `KITCHEN`, `BAR`, `CHECKER`: scoped outlet + scoped action.
- `WAREHOUSE`, `PRODUCTION`: pusat + location-specific.
- `AUDITOR`: read audit/report lintas outlet (no transactional write).

Enforcement:

- route/service guard,
- entity-level check (`outlet_id`/`location_id`),
- database RLS/policy.

## 9) Integrasi eksternal (Target)

Implementasi lewat interface adapter:

- `OrderSourceAdapter` (GoFood/Grab/Shopee).
- `PaymentAdapter` (QRIS gateway).
- `PrintAdapter` (local print bridge/agent).
- `NotifierAdapter` (WhatsApp).

Catatan:

- Untuk phase awal, marketplace tetap sebagai `order_source` metadata.
- Printer web tidak diasumsikan auto print tanpa bridge.
- Google Sheets hanya jalur export/reporting, bukan DB utama.

## 10) Decision penting untuk transisi dari sistem saat ini

1. Tetap gunakan Next.js monolith + Supabase (tidak ganti framework/database).
2. Kurangi model ganda secara bertahap:
   - inventory ledger
   - POS/KDS state model
3. Tetapkan canonical outlet identity mapping sebelum refactor besar.
4. Terapkan incremental refactor modul-per-modul dengan compatibility layer.
