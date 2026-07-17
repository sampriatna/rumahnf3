# UI PAGE MAPPING — Rumah NF3

**Tanggal:** 14 Juli 2026  
**Legenda status:** Layak Dipertahankan · Perlu Perbaikan Ringan · Perlu Refactor · Belum Ada · Tidak Terhubung Data · Salah Business Logic

---

## Portal & Shell

| Modul | Route Saat Ini | Component Saat Ini | Kondisi | Target UI | Data Source | API/Service | Permission | Risiko | Prioritas |
|---|---|---|---|---|---|---|---|---|---|
| App Shell | — (tidak ada) | `app/layout.tsx` (minimal) | Belum Ada | Sidebar + TopBar + OutletSwitcher | `lib/rbac.ts`, session | `getSession`, middleware | Semua role | Medium | P0 |
| Ringkasan Owner | `/dashboard`, `/reports/owner` | `OwnerDashboardShell`, `DashboardOwnerSummary`, owner report page | Perlu Refactor | Dashboard KPI operasional tunggal | `lib/reports.ts`, POS aggregates | `buildDailyReport`, finance summary | owner, admin | Medium | P1 |
| Ringkasan Leader | `/reports/outlet`, `/dashboard` | `PageHeader`, menu grid | Perlu Perbaikan Ringan | Ringkasan Outlet card-based | `lib/reports.ts`, outlet scope | reports + inventory alerts | leader | Low | P2 |
| Login Portal | `/login` | `LoginForm` | Layak Dipertahankan | Polish form + error state | Supabase auth | `/api/auth/login-email` | public | Low | P3 |
| Navigasi Role | `/dashboard` | `MenuCard`, `lib/rbac.ts` | Perlu Refactor | Sidebar permission-based | `getRoleConfig(role)` | — | per role | Medium | P0 |
| Placeholder fitur | `/segera?fitur=` | static page | Tidak Terhubung Data | Sembunyikan atau EmptyState | — | — | — | Low | P3 |

---

## POS & Penjualan

| Modul | Route Saat Ini | Component Saat Ini | Kondisi | Target UI | Data Source | API/Service | Permission | Risiko | Prioritas |
|---|---|---|---|---|---|---|---|---|---|
| POS Kasir | `/pos` | `PosMenuGrid`, inline cart/bills | Perlu Refactor | 3-area: order strip + katalog kiri + ringkasan kanan | `lib/pos-service.ts` | `app/pos-actions.ts` | capability `pos` | **High** | P1 |
| Login POS | `/pos/login` | `PosLoginForm` | Layak Dipertahankan | Touch-friendly PIN pad | `lib/auth-service.ts` | `/api/auth/login-pos` | public | Low | P3 |
| Checkout / Bayar | `/pos/checkout/[orderId]` | inline forms, `quick-cash` | Perlu Perbaikan Ringan | PaymentSummary panel | `getOrder`, payments | `addPayment`, `payFullAction` | pos + outlet | High | P1 |
| Pesanan (list) | — | embedded di `/pos` | Belum Ada | Card/grid semua pesanan shift | `listShiftOrders` | pos-actions | pos, leader | Medium | P2 |
| Meja | `/pos/floor` | floor grid inline | Perlu Perbaikan Ringan | TableCard layout visual | `lib/pos-floor.ts` | `moveOrderTable` | pos | Medium | P2 |
| Split bill | `/pos/split/[orderId]` | page form | Layak Dipertahankan | Dialog/split panel | `splitOrder` | pos-actions | pos | Medium | P2 |
| Merge bill | `/pos/merge` | page form | Layak Dipertahankan | Table picker UI | `mergeOrders` | pos-actions | pos | Medium | P2 |
| Void order | `/pos/void/[orderId]` | `PosCancelReasonFields` | Layak Dipertahankan | AuditReasonDialog pattern | `reverseOrder` | pos-actions + PIN | pos + leader PIN | High | P2 |
| Tutup shift | `/pos/close` | form page | Perlu Perbaikan Ringan | ShiftSummaryCard | `closeShift` | pos-actions | pos | High | P2 |
| Laci kas | `/pos/drawer` | simple page | Perlu Perbaikan Ringan | Cash in/out cards | `recordCashDrawerEntry` | pos-actions | pos | Medium | P3 |
| Order online | `/pos/online` | form | Layak Dipertahankan | Channel cards | `createOnlineOrder` | pos-actions | pos | Low | P3 |
| Struk | `/pos/receipt/*` | `print-receipt-button` | Layak Dipertahankan | Invoice preview polish | order data | — | pos | Low | P3 |
| Denah meja config | `/library/floor` | `FloorLibraryClient` | Layak Dipertahankan | Admin table editor | floor plan store | library actions | leader+ | Low | P4 |

---

## KDS & Produksi

| Modul | Route Saat Ini | Component Saat Ini | Kondisi | Target UI | Data Source | API/Service | Permission | Risiko | Prioritas |
|---|---|---|---|---|---|---|---|---|---|
| KDS Board | `/kds?station=` | `KdsTabletShell`, `KdsBoardClient`, `KdsOrderCard` | Layak Dipertahankan | Board kartu besar + timer | `lib/kds-board-service.ts` | `app/kds-actions.ts` | capability `kds` | High | P1 |
| KDS Dapur | `/kds?station=dapur` | same (filter station) | Layak Dipertahankan | Station filter + summary top | `getStations`, `listBoard` | kds-actions | kds | Medium | P1 |
| KDS Bar | `/kds?station=bar` | same | Layak Dipertahankan | Bar-specific item metadata UI | routing `defaultAreaId` | kds bridge | kds | Medium | P2 |
| KDS Closing | tab di `KdsTabletShell` | `KdsClosingPanel` | Layak Dipertahankan | Closing checklist cards | `kds-closing-service` | inventory write | kds, leader | Medium | P3 |
| Menu habis KDS | tab `KdsMenuStockPanel` | panel | Layak Dipertahankan | Stock alert cards | menu `soldOut` | toggle sold out | kds | Low | P3 |
| Checker | — | — | Belum Ada | Order readiness board | order items by area | **belum ada service** | staff checker cap | **High** | P2 |
| Antrean pelanggan | — | — | Belum Ada | Queue display (Samtaro) | order queue state | **belum ada** | public display | Medium | P4 |

---

## Inventori & Gudang

| Modul | Route Saat Ini | Component Saat Ini | Kondisi | Target UI | Data Source | API/Service | Permission | Risiko | Prioritas |
|---|---|---|---|---|---|---|---|---|---|
| Ringkasan stok | `/inventory` | `InventoryOwnerDashboard` | Perlu Perbaikan Ringan | StockAlertCard grid | inventory metrics | `inventory-service` | leader+ | Medium | P3 |
| Sidebar gudang | layout | `InventorySidebar` | Layak Dipertahankan | Reuse pattern AppShell | — | — | leader+ | Low | P0 ref |
| Transfer | `/inventory/transfers` | page + actions | Layak Dipertahankan | Status workflow cards | `transfer-service` | inventory actions | leader+ | Medium | P3 |
| Data master | `/inventory/data/*` | `InventoryDataNav` | Layak Dipertahankan | DataTable polish | Supabase sheets + store | various | owner/admin | Low | P4 |
| Mutasi | `/inventory/movements` | list page | Perlu Perbaikan Ringan | Movement ledger view | `recordMovement` | inventory-service | leader+ | Medium | P4 |
| Purchasing | `/purchasing` | page | Layak Dipertahankan | PO cards | `inventory-service` | inventory-actions | leader+ | Low | P4 |
| Produksi batch | — | — | Belum Ada | Batch production UI | **belum ada model** | — | warehouse | High | P5 |

---

## Finance, Approval, Staff

| Modul | Route Saat Ini | Component Saat Ini | Kondisi | Target UI | Data Source | API/Service | Permission | Risiko | Prioritas |
|---|---|---|---|---|---|---|---|---|---|
| Kas | `/finance` | page | Perlu Perbaikan Ringan | StatCard kas | `finance-service` | finance-actions | admin/owner | Medium | P3 |
| Ledger | `/finance/ledger` | table-like | Perlu Perbaikan Ringan | DataTable | ledger entries | finance-actions | finance access | Low | P4 |
| Approval | `/approvals` | `ApprovalBadge` | Layak Dipertahankan | ApprovalDialog pattern | store approvals | approval-actions | leader+ | Medium | P3 |
| Inbox / Request | `/inbox` | list | Layak Dipertahankan | FilterTabs + cards | submissions | form-actions | leader+ | Low | P3 |
| Form staf | `/staff/form` | `FormRenderer` | Layak Dipertahankan | Mobile form polish | `lib/forms.ts` | form-actions | staff | Low | P4 |
| Audit aktivitas | — | `lib/audit-log.ts` (API only) | Belum Ada | Audit log viewer | ring buffer / future DB | cloud-status | owner | Low | P4 |

---

## Menu & Pengaturan

| Modul | Route Saat Ini | Component Saat Ini | Kondisi | Target UI | Data Source | API/Service | Permission | Risiko | Prioritas |
|---|---|---|---|---|---|---|---|---|---|
| Product library | `/library/products` | `ProductLibraryClient` | Layak Dipertahankan | MenuProductCard admin | menu store | library actions | leader+ | Low | P4 |
| Resep/BOM | `/library/recipes` | `RecipeLibraryClient` | Layak Dipertahankan | Recipe editor | `recipe-service` | library actions | leader+ | Medium | P4 |
| KDS config | `/library/kds` | `KdsLibraryClient` | Layak Dipertahankan | Station config | KDS stations seed | library | leader+ | Low | P4 |
| Pengaturan kasir | `/settings/pos` | page | Layak Dipertahankan | Settings cards | register settings | settings actions | leader+ | Low | P4 |
| PIN kasir | `/settings/pins` | page | Layak Dipertahankan | PIN management | auth repo | settings | admin+ | Low | P4 |

---

## Route dengan business logic belum benar / belum ada

| Route / Modul | Masalah |
|---|---|
| `/checker` | Modul checker belum diimplementasi sama sekali |
| `/orders` | Tidak ada list pesanan terpusat; status order/payment/production bercampur di POS |
| Samtaro queue | Pay-before-produce & nomor antrean tidak ada UI |
| `/reports/owner` | KPI operasional POS (omzet, void, AOV) belum dominan — masih form/approval weighted |
| `/segera` | Menu navigasi menampilkan fitur palsu |
| KDS status label | "Diproses" bukan "Sedang Dibuat" per brief lokalisasi |
| Payment `refunded` | Status tidak first-class di UI |
| Role KITCHEN/BAR/CHECKER | Belum modeled — semua staf generic |

---

## Prioritas implementasi UI (ringkas)

1. **P0** — App Shell + navigasi sidebar (portal)
2. **P1** — POS layout 3-area + KDS polish + Dashboard owner KPI
3. **P2** — Pesanan list + Checker + Meja + Shift UI
4. **P3** — Finance, approval, inventory polish
5. **P4** — Library, audit viewer, reports
6. **P5** — Produksi batch, antrean Samtaro
