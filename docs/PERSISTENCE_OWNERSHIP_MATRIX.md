# PERSISTENCE OWNERSHIP MATRIX

Scope verifikasi berdasarkan fungsi/tabel nyata di repository.  
Kolom `Current Write Source` dan `Current Read Source` menjelaskan praktik saat ini, bukan target ideal.

| Domain | Current Write Source | Current Read Source | Fallback Source | Sync Mechanism | Canonical Candidate | Risk | Recommended Canonical Source | Migration Difficulty |
|---|---|---|---|---|---|---|---|---|
| authentication/session | Supabase Auth + `auth_accounts` via `lib/auth-service.ts`, `lib/db/auth-repo.ts`; cookie via `lib/session.ts` | Cookie decode `getSession()` + `auth_accounts` lookup login-time | mock login fallback di `lib/auth.ts` saat path tertentu | none untuk session; auth profile read direct | `auth_accounts` + Supabase Auth user id | fallback mock memperbesar ambiguity identitas | Supabase Auth (`auth_user_id`) + `auth_accounts` sebagai profile canonical | Medium |
| outlet | `lib/mock-data.ts` (slug), `nf3.master_lokasi` (code), `nf3.outlets` (UUID, belum aktif penuh) | Banyak page/service baca `OUTLETS` (`mock-data`) | mapping helper `outletIdToLokasi()` (`lib/inventory-sheets-writer.ts`) | manual mapping slug->code; tidak ada registry tunggal | `nf3.outlets` UUID + compatibility map | cross-outlet join/filter rawan salah id | UUID canonical + registry mapping slug/code | Medium |
| catalog/menu | write dominan ke in-memory `store().menu*` via library actions/services, lalu push ke `nf3.menu_*` (`lib/db/pos-repo.ts`) | runtime dari in-memory store (`lib/pos-service.ts`) | restore dari cloud/relasional saat boot (`lib/store.ts` + `cloudLoadPos`) | autosave cloud/disk periodik | `nf3.menu_items` relational | drift antar instance saat in-memory jadi writer awal | Supabase relational `menu_*`, in-memory sebagai cache | Medium |
| POS order | write via `lib/pos-service.ts` (`createOrderFromCart`, `addPayment`, `splitOrder`, `mergeOrders`) ke in-memory, dipersist via `cloudSavePos`/`pushPos` | read dominan dari `store().posOrders` | cloud restore / `pullPos` | autosave 8s + restore boot | `nf3.pos_orders` | concurrency multi-instance + delay sync | `nf3.pos_orders` sebagai canonical transaction store | Medium |
| order item | embedded JSONB dalam `pos_orders.items` (write dari pos-service) | dari `store().posOrders[*].items` | restored from `pos_orders` JSONB | sama dengan POS order | `pos_orders.items` (sementara) | belum normalized, history status item terbatas | tetap JSONB sementara (stability-first), tambah shadow normalized nanti | Medium |
| payment | embedded JSONB `payments` via `addPayment` + finance side-effect `recordLedger` | `store().posOrders[*].payments`, checkout page | restored from `pos_orders` | sama dengan POS order + finance write-through | `pos_orders.payments` + `finance_ledger` | refund lifecycle belum full, event audit tidak seragam | `pos_orders.payments` sementara + finance ledger append-only | Medium |
| cashier shift | `openShift/closeShift` di in-memory lalu push ke `nf3.pos_shifts` | `store().posShifts` | restore dari `pullPos` | autosave pos snapshot | `nf3.pos_shifts` | shift state bisa stale jika sync delay | `nf3.pos_shifts` canonical | Low |
| KDS ticket | dua writer: legacy `lib/kds-service.ts` -> `store().kdsTickets`, dan board `lib/kds-board-service.ts` -> `store().kdsBoardTickets` | KDS UI baca board (`listBoard`), sebagian service baca legacy tickets | legacy tickets dipersist ke `nf3.kds_tickets`; board tidak relational penuh | bridge `syncKdsBoardFromPos` / `syncPosItemsFromBoard` | `kdsBoardTickets` (operasional UI) **atau** `kds_tickets` (persisted) | dual authoritative writer menyebabkan split-brain state | board state canonical writer + legacy sebagai adapter reader only | High |
| production item status | item status ditulis dari POS bridge (`syncPosItemsFromBoard`) ke `order.items[].status` | checkout/POS melihat status item dari order JSONB | recompute bridge saat refresh | polling + bridge sync | order item status in POS order JSONB | tidak ada status history table append-only | `order.items[].status` canonical sementara + add status history shadow | Medium |
| inventory | dual model: relasional (`inventory_items/stock_movements/stock_levels`) dan sheets model (`master_bahan` + movement tables) | dashboard saldo dominan dari sheets path (`inventory-overview`, `inventory-metrics`) | in-memory movement data fallback | source adapter (`INVENTORY_SOURCE`), cloud sync, repo pull | satu unified movement ledger | paling rawan mismatch stok | jadikan movement ledger tunggal (append-only) sebagai canonical | Very High |
| finance | `recordLedger` ke in-memory store lalu push ke `nf3.finance_ledger` (`lib/db/finance-repo.ts`) | summary/ledger pages baca `listLedger` dari store | restore from `pullFinance` | autosave cloud + relational pull | `nf3.finance_ledger` | jika write guard terlewat, service-role bypass RLS | `nf3.finance_ledger` canonical append-only | Low |
| approval | forms + approvals ditulis ke store (`addSubmission`, `addApproval`) lalu push ke `nf3.form_submissions`/`nf3.approvals` | inbox/approvals/report baca store list | restore from `pullForms` | cloud save forms module | `nf3.form_submissions` + `nf3.approvals` | race condition bila multiple writers sebelum sync | relational forms/approvals canonical | Medium |
| report | banyak report computed on-the-fly (`lib/reports.ts`, `lib/dashboard-source.ts`) dari store/domain service | read derived/computed dari runtime data | sebagian persisted (`ai_insights`, `customer_ratings`) | periodic pull reports module | derived + selective persisted tables | output report tergantung freshness source upstream | transactional domains canonical; report layer derived/materialized | Medium |

---

## Klasifikasi sumber data saat ini per domain (ringkas)

- **In-memory authoritative sekarang**: POS order/item/payment/shift, KDS board, approvals runtime.
- **Local disk fallback**: snapshot `.data/nf3-store.json` via `lib/store.ts`.
- **Supabase snapshot/JSONB**: `nf3.app_state` (`lib/cloud-persist.ts`).
- **Supabase relational**: `pos_*`, `finance_*`, `forms/approvals`, inventory dual tables.
- **Derived/computed**: report harian/outlet/owner, inventory saldo calculations.
- **Kombinasi**: hampir semua domain operasional inti masih kombinasi in-memory + relational + snapshot.

---

## Fakta, Asumsi, Rekomendasi

### Fakta hasil inspeksi

- `lib/store.ts` masih menjadi pusat runtime untuk banyak modul.
- Sinkronisasi periodik dilakukan ke disk + `app_state` + beberapa tabel relasional.
- Inventory memiliki dua jalur model aktif.
- KDS memiliki dua representasi state (`kdsTickets` vs `kdsBoardTickets`).
- Authorization memakai kombinasi guard action dan RLS, namun server write banyak lewat `supabaseAdmin()`.

### Asumsi (untuk phase 0 planning)

- Tim ingin meminimalkan risiko operasional POS saat jam sibuk.
- Perubahan phase 0 diprioritaskan additive dan backward compatible.

### Rekomendasi

- Tetapkan canonical ownership per domain sebelum refactor business logic.
- Implement observability mismatch sebelum dual-write/cutover lebih jauh.
- Pilih satu canonical writer untuk KDS production state.
