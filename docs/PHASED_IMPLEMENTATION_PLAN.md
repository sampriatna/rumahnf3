# PHASED IMPLEMENTATION PLAN

Dokumen ini adalah rencana incremental refactor sesuai batasan:

- tidak rewrite total,
- tidak ganti framework/database,
- pertahankan fitur berjalan,
- tidak implement phase lanjut sebelum fondasi stabil,
- migration hanya setelah approval.

---

## PHASE 1 — Fondasi Operasional Multi-Outlet

### Objective

Menstabilkan core operasional outlet: identity/access, POS-order-payment-KDS-checker, cashier shift, sales report basic, audit log basic.

### Scope

- Canonical outlet identity mapping.
- Standardisasi status:
  - `order_status`,
  - `payment_status`,
  - `order_item_production_status`.
- Unifikasi KDS source (hapus dual state behavior secara bertahap).
- Backend guard standard untuk outlet scoping + sensitive actions.
- Audit log dasar untuk aksi kritis POS/shift/payment.

### Files/Modules Affected

- `lib/session*`, `lib/auth-*`, `lib/data-scope.ts`, `lib/auth-guard.ts`
- `lib/pos-service.ts`, `lib/kds-*`, `app/pos*`, `app/kds*`
- `app/*-actions.ts` terkait order/payment/void/split/merge/move/discount
- `lib/reports.ts`, dashboard summary modules
- SQL policy files (hanya setelah approval)

### Database Impact

- Tambah kolom/status enum/table history jika dibutuhkan.
- Penyesuaian non-destructive pada order/payment/item status.
- Tambah audit log basic (append-only).

### API Impact

- Kontrak action/endpoint payment/void/refund/production update bisa bertambah field reason/outlet/status.
- Tambah konsistensi error code untuk unauthorized/forbidden/conflict.

### Frontend Impact

- POS/KDS UI mengikuti status terpisah.
- Checker screen/section jelas.
- Alert dan action states lebih ketat untuk approval.

### Risk

- Regressi di flow kasir jam sibuk.
- Data mismatch jika status lama-baru bercampur.

### Migration Strategy

1. Additive schema only.
2. Compatibility adapter untuk status lama.
3. Dual-read validation log.
4. Cutover setelah parity tercapai.

### Rollback Strategy

- Feature flag untuk status model baru.
- Keep old read path available sementara.
- Disable write ke field baru jika rollback.

### Acceptance Criteria

- Order/payment/item status terpisah dan konsisten.
- Outlet scoping enforced backend.
- Sensitive actions tercatat audit log basic.
- KDS readiness sinkron dengan item status dan checker.

### Manual Testing Checklist

- Open/close shift per outlet.
- Create order dine-in/takeaway.
- Partial/full payment.
- Void/refund flow + approval.
- Kitchen/bar item completion -> checker -> order complete.
- Role access test (owner vs outlet staff).

---

## PHASE 2 — Inventory, Warehouse, Production Core

### Objective

Membuat inventory dan transfer menjadi ledger-driven, akurat, dan siap untuk produksi batch pusat.

### Scope

- Satu canonical inventory movement ledger.
- Unit + unit conversion.
- Recipe/BOM enforcement pada sale consumption.
- Transfer lifecycle lengkap + discrepancy.
- Production batch + input/output + yield.
- Stock opname/waste/return standard.

### Files/Modules Affected

- `lib/inventory-*`, `lib/transfer-service.ts`, `lib/recipes*`
- `app/inventory*`, `app/purchasing*`, `app/approval*`
- `supabase/inventory-*.sql`, `supabase/transfer-*.sql` (approved migration only)

### Database Impact

- Konsolidasi movement model.
- Tambah batch production tables.
- Extend transfer item discrepancy fields.

### API Impact

- Mutasi stok menggunakan movement contract unified.
- Transfer APIs/actions menambah qty_sent/qty_received/discrepancy.

### Frontend Impact

- Inventory dashboard pakai ledger unified.
- Transfer UI menampilkan discrepancy workflow.
- Production batch management screens.

### Risk

- Risiko tertinggi data mismatch stok saat transisi.
- Potential downtime jika migrasi historis besar.

### Migration Strategy

1. Create unified movement structures.
2. Backfill dari model lama.
3. Reconciliation report (old vs new stock).
4. Switch read path.
5. Freeze old write path.

### Rollback Strategy

- Tetap simpan old movement tables.
- Controlled switch by environment flag.
- Restore read path ke legacy jika mismatch.

### Acceptance Criteria

- Current stock dihitung dari ledger unified.
- Cancellation menghasilkan reversal movement.
- Transfer discrepancy tercatat dan reportable.
- Production batch menghasilkan input/output stock movement.

### Manual Testing Checklist

- Purchase in -> stock naik.
- Sale -> BOM consumption.
- Cancel sale -> reversal.
- Transfer draft->received/discrepancy.
- Opname adjust.
- Batch produce + waste + yield.

---

## PHASE 3 — Digital Ordering & Customer Experience Layer

### Objective

Menambah QR order, dynamic payment UX, antrean customer display, notifikasi, promo loyalti lanjutan.

### Scope

- QR table order secure token + active control.
- Mode paid-first dan pay-later dengan approval guard.
- Queue display Samtaro (preparing/ready/collected).
- Dynamic QRIS abstraction.
- WhatsApp event notifications (bukan source of truth).
- Voucher/loyalty enhancements.

### Files/Modules Affected

- `app/q*`, `app/pos*`, `app/kds*`, `lib/queue*`, `lib/wa*`, payment adapters

### Database Impact

- QR token/session table.
- Queue display state table (atau derive dari order item state).
- Voucher/loyalty extensions bila dibutuhkan.

### API Impact

- New guest order endpoints / actions.
- Payment verification callbacks (adapter style).

### Frontend Impact

- Guest ordering UI.
- Queue board UI.
- Cashier approval controls for pay-later mode.

### Risk

- Abuse/security risk jika QR token tidak kuat.
- Integrasi payment callback race condition.

### Migration Strategy

- Isolated module rollout per outlet pilot.
- Start from Samtaro queue then KBU table QR.

### Rollback Strategy

- Disable guest QR mode with config switch.
- Revert to cashier-only order intake.

### Acceptance Criteria

- QR token secure, outlet+table bound, revocable.
- Paid-first/pay-later mode both working.
- Queue display realtime-ish and accurate.

### Manual Testing Checklist

- Scan QR invalid/expired/active.
- Place order paid-first.
- Place order pay-later pending approval.
- Queue transitions preparing->ready->collected.

---

## PHASE 4 — Enterprise Integrations & Intelligence

### Objective

Menghubungkan ekosistem eksternal dan advanced planning tanpa merusak core.

### Scope

- Marketplace adapter integration.
- Accounting integration.
- Attendance/payroll integration hardening.
- Forecasting, AI recommendations.

### Files/Modules Affected

- Integration adapter modules, reporting, forecasting service layers.

### Database Impact

- External reference mapping tables.
- Sync status/error logs.

### API Impact

- Inbound/outbound integration endpoints + retry queue.

### Frontend Impact

- Monitoring dashboard integrasi.
- Reconciliation workflows.

### Risk

- Dependency external instability.
- Data contract changes from third-party.

### Migration Strategy

- Adapter first with mock provider.
- Pilot per provider, per outlet.

### Rollback Strategy

- Disable provider adapter.
- Keep manual channel fallback.

### Acceptance Criteria

- Integration fail tidak mengganggu transaksi inti.
- Reconciliation dashboards tersedia.

### Manual Testing Checklist

- Simulasi provider timeout/failure.
- Retry & reconciliation pass.
- Finance/report consistency after sync.

---

## Urutan pengerjaan paling aman

1. Phase 1 sampai stabil dan terukur.
2. Phase 2 dengan reconciliation ketat.
3. Phase 3 per pilot outlet.
4. Phase 4 setelah core mature.

## Dependency antar phase

- Phase 2 **bergantung** pada stabilitas status + auth + audit Phase 1.
- Phase 3 **bergantung** pada order/payment/item lifecycle yang bersih.
- Phase 4 **bergantung** pada model data stabil dan auditable.
