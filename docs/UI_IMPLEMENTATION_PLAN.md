# UI IMPLEMENTATION PLAN — Rumah NF3

**Tanggal:** 14 Juli 2026  
**Prasyarat:** Phase 0 stabilization gate (code-complete; UAT staging disarankan sebelum UI-2 POS).  
**Prinsip:** Incremental vertical slice; feature-flag UI bila perlu; tidak ubah business logic.

---

## Gambaran fase

| Fase | Fokus | Durasi estimasi |
|---|---|---|
| UI-1 | App shell + design tokens | 1–2 minggu |
| UI-2 | POS + cart + modifier | 2–3 minggu |
| UI-3 | Pesanan + KDS + Checker | 2–3 minggu |
| UI-4 | Meja + shift + laporan dasar | 1–2 minggu |
| UI-5 | Inventori + gudang + produksi | 2+ minggu |

---

## Phase UI-1 — App Shell & Design Tokens

### Objective

Satu kerangka navigasi portal (sidebar + top bar) dengan outlet switcher dan token desain reusable — tanpa mengubah flow POS/KDS existing.

### Routes affected

- `/dashboard` (semua role)
- `/approvals`, `/inbox`, `/finance`, `/inventory`, `/library`, `/reports/*`, `/settings/*`, `/members`, `/purchasing`, `/ai`
- **Tidak** mengubah `/pos/*`, `/kds` layout gelap

### Components affected (new)

- `components/shell/AppShell.tsx`
- `components/shell/Sidebar.tsx`
- `components/shell/TopNavigation.tsx`
- `components/shell/OutletSwitcher.tsx`
- `components/shell/UserMenu.tsx`
- `components/ui/Button.tsx`, `Card.tsx`, `StatusBadge.tsx` (generalized)
- `lib/design-tokens.ts`, `lib/ui-labels.ts`
- `lib/nav-items.ts` — adapter dari `lib/rbac.ts`

### Service/API affected

- **Tidak ada** perubahan business logic
- Baca: `getSession()`, `getRoleConfig()`, `toOutletSlug()`, `listOutletRegistry()`
- Middleware: tidak diubah

### Business logic dependency

- Nav item filter: `menu.ready === true` (sembunyikan `/segera`)
- Outlet switcher: `canAccessOutlet` / role owner|admin
- Staff subdomain tetap `StaffShell` terpisah

### Responsive behavior

- Desktop: sidebar 240px fixed
- Tablet: sidebar collapsed 64px (ikon + tooltip)
- Mobile owner: drawer overlay

### Risk

| Risiko | Mitigasi |
|---|---|
| Regresi navigasi role | Snapshot test nav items per role |
| Outlet switcher salah scope | Reuse `data-scope` + `outlet-identity` |
| Double layout dengan inventory sidebar | Inventory tetap nested sidebar dalam AppShell content area |

### Rollback plan

- Feature flag `NF3_FF_APP_SHELL_V1=false` → render children tanpa shell (layout lama)
- Tidak ada migration DB

### Acceptance criteria

- [ ] Semua role melihat menu sesuai `lib/rbac.ts` di sidebar
- [ ] Owner/admin bisa ganti outlet aktif; leader/staff tidak
- [ ] Halaman `ready: false` tidak muncul di nav
- [ ] Token button/card/status konsisten di dashboard
- [ ] Tidak ada regresi login/redirect subdomain

### Manual test checklist

- [ ] Login owner → sidebar lengkap + outlet switcher
- [ ] Login leader KBU → menu terbatas outlet
- [ ] Login admin → finance + inventory visible
- [ ] Collapse sidebar tablet landscape
- [ ] Deep link `/finance` tetap jalan dengan shell

---

## Phase UI-2 — POS Layout Profesional

### Objective

Layout POS 3-area (strip pesanan atas, katalog kiri, ringkasan kanan) dengan istilah Indonesia — **logic order/payment tidak berubah**.

### Routes affected

- `/pos` (utama)
- `/pos/add-item` (bisa digabung ke modal)
- Minor polish: `/pos/checkout/[orderId]`

### Components affected

- **New:** `PosShell.tsx`, `PosOrderStrip.tsx`, `CartPanel.tsx`, `PaymentSummary.tsx`, `OrderTypeSelector.tsx`
- **Refactor:** extract dari `app/pos/page.tsx` → presentational components
- **Keep:** `PosMenuGrid` (visual polish only)
- **Enhance:** `Modal` → `ModifierDialog`, `AuditReasonDialog` pattern

### Service/API affected

- **Tidak ubah** `lib/pos-service.ts`, `app/pos-actions.ts`
- Data fetch tetap server component di page

### Business logic dependency

- Channel: `listSalesChannels(outletId)`
- Table: `hasFloorPlan`, open bills
- Payment vs order status: display terpisah (label only)
- Sold out: `menuItem.soldOut` disable add

### Responsive behavior

- ≥1024px: 3-column layout
- 768–1023px: cart toggle FAB + sheet
- <768px: warning banner tablet

### Risk

| Risiko | Mitigasi |
|---|---|
| **Tinggi** — regression POS peak hour | Characterization test `phase0-baseline` harus tetap hijau |
| Cart state stale | Server Actions + `revalidatePath` existing |
| Modifier flow break | UAT manual add item + variant |

### Rollback plan

- Flag `NF3_FF_POS_LAYOUT_V2=false` → render layout lama (keep old component tree branch)
- Zero DB change

### Acceptance criteria

- [ ] Buka shift → katalog + cart tampil
- [ ] Dine-in / takeaway channel selector visible
- [ ] Tambah item + modifier + variant works
- [ ] Open bill + hold + resume works
- [ ] Kirim dapur + checkout path unchanged
- [ ] Label ID sesuai `lib/ui-labels.ts`

### Manual test checklist

- [ ] KBU dine-in meja: buat order → add to bill → bayar
- [ ] Takeaway order tanpa meja
- [ ] Hold + resume bill
- [ ] Item sold out tidak bisa ditambah
- [ ] Partial + full payment
- [ ] Tablet landscape 1024px cart visible

---

## Phase UI-3 — Pesanan, KDS Dapur, KDS Bar, Checker

### Objective

Halaman pesanan terpusat + polish KDS board + **Checker MVP** (readiness view) — checker membutuhkan service tipis baru (read-only aggregation).

### Routes affected

- **New:** `/orders` (portal + link dari POS top bar)
- **New:** `/checker` (portal, capability baru atau leader/staff)
- `/kds` — polish visual + summary header + timer colors
- Station bar: `/kds?station=bar` — metadata minuman

### Components affected

- **New:** `OrdersPage`, `OrderCard`, `OrderItemRow`, `FilterTabs`, `CheckerBoard`, `TimerIndicator`
- **Enhance:** `KdsOrderCard`, `KdsBoardClient` top summary
- **Keep:** `KdsTabletShell` tab structure

### Service/API affected

- **New read service:** `lib/checker-service.ts` — aggregate item status per order (no write Phase 1)
- **New actions (later slice):** checker mark complete — **butuh approval bisnis**, UI-3a read-only dulu
- Existing: `listShiftOrders`, `listBoard`, `kds-pos-bridge`

### Business logic dependency

- Checker: order siap hanya jika semua item wajib ready (display rule dari existing item status)
- KDS bar vs dapur: `defaultAreaId` / station routing
- Jangan satu dropdown ubah seluruh status order

### Responsive behavior

- Orders: card grid desktop, stack tablet
- KDS: existing 3-col; add top summary bar
- Checker: 2-col desktop (order list + detail)

### Risk

| Risiko | Mitigasi |
|---|---|
| Checker tanpa backend write | Fase 3a read-only; label "coming soon" pada aksi |
| KDS timer false positive | Reuse `KdsAlertMonitor` thresholds |
| Orders page performance | Pagination per shift + outlet scope |

### Rollback plan

- Hide `/orders` dan `/checker` dari nav via flag
- KDS visual rollback independent

### Acceptance criteria

- [ ] `/orders` list pesanan shift dengan filter channel/status bayar
- [ ] KDS summary: baru / sedang dibuat / terlambat counts
- [ ] Checker menampilkan item per area (dapur/bar) dengan progress
- [ ] KDS bar menampilkan modifier minuman jelas
- [ ] Status label bahasa Indonesia

### Manual test checklist

- [ ] 3 order aktif → terlihat di `/orders`
- [ ] Fire kitchen → KDS baru column
- [ ] Proses → siap → POS item status sync
- [ ] Checker menunjukkan item belum siap
- [ ] Bar order tidak mark order lengkap jika dapur belum siap

---

## Phase UI-4 — Meja, Shift Kasir, Laporan Dasar

### Objective

Table management visual + shift open/close UX + laporan outlet dasar terintegrasi shell.

### Routes affected

- `/pos/floor` → enhance `TableCard`
- `/pos/close`, `/pos/drawer` → `ShiftSummaryCard`
- `/reports/outlet`, `/reports/owner` → unify KPI cards

### Components affected

- `TableCard`, `ShiftSummaryCard`, `StatCard` grid
- `ConfirmationDialog` untuk pindah/gabung meja

### Service/API affected

- Existing: `closeShift`, `moveOrderTable`, `mergeOrders`, `buildDailyReport`
- Display selisih kas dari shift summary (existing fields)

### Business logic dependency

- Meja: `TABLE_STATUS_STYLE` mapping
- Shift: tidak edit setelah approval (display read-only badge)
- Laporan: outlet scope enforced

### Responsive behavior

- Floor plan: zoom/pan optional fase 4b
- Shift close: single column form tablet

### Risk

| Risiko | Mitigasi |
|---|---|
| Meja aksi sensitif | ConfirmationDialog wajib |
| Laporan angka mismatch | Satu sumber `lib/reports.ts` |

### Rollback plan

- Visual only — revert components

### Acceptance criteria

- [ ] Meja status warna + label ID
- [ ] Tutup shift flow dengan ringkasan jelas
- [ ] Selisih kas ditampilkan netral (bukan mempermalukan)
- [ ] Owner report menampilkan omzet POS jika data ada

### Manual test checklist

- [ ] Tap meja terisi → buka order
- [ ] Pindah meja dengan konfirmasi
- [ ] Tutup shift → setoran submission
- [ ] Owner report angka masuk akal

---

## Phase UI-5 — Inventori, Gudang, Produksi

### Objective

Polish inventory/warehouse UI mengikuti shell; movement-based display; **produksi batch UI** hanya jika model data disetujui.

### Routes affected

- `/inventory/*`, `/purchasing`, `/inventory/data/*`
- **Future:** `/production` (belum ada)

### Components affected

- Align `InventorySidebar` dengan `AppShell`
- `StockAlertCard`, movement `DataTable`
- Production batch forms — **blocked** sampai data model approved

### Service/API affected

- `inventory-service`, `transfer-service` — read only UI phase
- Tidak direct stock edit di UI

### Business logic dependency

- Semua perubahan stok via movement
- Transfer workflow status

### Risk

| Risiko | Mitigasi |
|---|---|
| Dual inventory model confusion | Label sumber data di UI |
| Production scope creep | UI-5b terpisah setelah DDL approval |

### Rollback plan

- Inventory keeps own layout fallback

### Acceptance criteria

- [ ] Tidak ada input "edit stok langsung"
- [ ] Transfer status visual jelas
- [ ] Stock alert konsisten dengan saldo engine

---

## Feature flags (usulan)

| Flag | Fase | Default |
|---|---|---|
| `NF3_FF_APP_SHELL_V1` | UI-1 | `false` |
| `NF3_FF_POS_LAYOUT_V2` | UI-2 | `false` |
| `NF3_FF_ORDERS_PAGE_V1` | UI-3 | `false` |
| `NF3_FF_CHECKER_READ_V1` | UI-3 | `false` |

---

## Dependensi dengan Phase 0 / Phase 1 backend

| UI Fase | Backend dependency |
|---|---|
| UI-1 | Minimal — rbac + session |
| UI-2 | Outlet identity resolver (done) |
| UI-3 | KDS canonical sync (flag); checker service baru |
| UI-4 | Shift/setoran flow (existing) |
| UI-5 | Inventory ownership matrix |

**Disarankan:** UI-1 boleh mulai paralel dengan UAT Phase 0. UI-2 POS setelah regression test hijau.

---

## Definisi selesai program UI

1. Portal punya App Shell konsisten semua role
2. POS layout profesional 3-area terhubung data penuh
3. Pesanan + KDS + Checker MVP operasional
4. Istilah Indonesia konsisten (`lib/ui-labels.ts`)
5. Loading/empty/error state standar di halaman kritikal
6. Tidak ada halaman statis palsu di navigasi
7. Manual UAT per fase lulus

---

## Persetujuan yang dibutuhkan sebelum coding

- [ ] Setuju urutan fase UI-1 → UI-2 → …
- [ ] Setuju KDS tetap dark mode
- [ ] Setuju Checker fase 3a read-only dulu
- [ ] Setuju tidak mulai produksi batch UI sebelum data model
- [ ] Setuju feature-flag rollout per fase

**Status:** Menunggu persetujuan — **belum ada kode UI yang diubah.**
