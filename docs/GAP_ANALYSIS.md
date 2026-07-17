# GAP ANALYSIS

| Requirement | Current Implementation | Status | Gap | Risk | Recommended Action | Priority |
|---|---|---|---|---|---|---|
| Company -> Outlet -> Production Area hierarchy | Outlet sudah ada di banyak modul; production area ada parsial (KDS station/area_id) | Partial | Belum ada hierarchy konsisten lintas modul | Data relation sulit dilacak | Bentuk canonical hierarchy registry + referensi tunggal | High |
| Semua transaksi punya `outlet_id` | Banyak transaksi sudah bawa outlet; beberapa flow masih nullable/indirect | Partial | Belum strict mandatory lintas domain | Cross-outlet reporting bias | Tambah validation contract di service + DB constraint bertahap | High |
| User punya role + outlet access + permission | `auth_accounts.role` + outlet + capabilities sederhana | Partial | Permission granular belum ada | Over/under privilege | Introduce permission matrix dan enforce backend | High |
| Owner lihat semua outlet | Sudah berjalan via role global di banyak guard | Complete | - | - | Pertahankan | Low |
| Staf hanya outlet assigned | Banyak flow sudah scoped; belum seragam semua action | Partial | Guard tersebar, belum centralized | Data leakage antar outlet | Standarisasi `requireOutletAccess` di semua action | High |
| Order status terpisah (`draft/confirmed/completed/cancelled`) | POS pakai status lain (`open/held/completed/void/merged`) | Incorrect Architecture | Semantic mismatch dengan target | Sulit orkestrasi lintas channel/outlet | Normalisasi order lifecycle via compatibility layer | High |
| Payment status terpisah (`unpaid/partially_paid/paid/refunded`) | `unpaid/partial/paid` ada; refund belum kuat | Partial | `refunded` belum first-class | Rekonsiliasi kas bermasalah | Tambah payment status model dan refund workflow | High |
| Item production status level order item | Item status ada di POS/KDS bridge | Partial | Masih ada dual model KDS legacy vs board | Sync gagal/ambiguous source | Consolidate ke single item status source | High |
| Routing item otomatis by production area | Ada rule routing dapur/bar basic | Partial | Rule masih cenderung outlet/menu seed tertentu | Salah routing jika katalog tumbuh | Pindah routing ke master mapping per item-per-outlet | High |
| Order siap jika semua item wajib siap / checker decision | Aggregasi readiness ada basic | Partial | Checker checkpoint eksplisit belum matang | Premature ready ke pelanggan | Tambah checker workflow formal | High |
| KBU: dine-in full ops (add order, move table, split, merge) | Mayoritas sudah ada di POS | Complete | Checker integration belum penuh | Error handoff service | Pertahankan + hubungkan checker | Medium |
| Kisamen: dine-in/takeaway sederhana | Config tersedia, flow basic jalan | Partial | Isolasi katalog/flow belum tegas | Inconsistent behavior outlet | Define outlet policy profile di backend | Medium |
| Samtaro: pay-before-produce + queue display | Ada config takeaway dan nomor order; queue display belum matang | Partial | Production/collected lifecycle belum penuh | Antrean operasional tidak reliable | Tambah dedicated Samtaro flow state | High |
| Inventory source of truth = stock ledger movement | Ada movement concept, namun model ganda | Incorrect Architecture | Dual ledger (`inventory-app` vs `inventory-sheets`) | Stok mismatch | Pilih satu ledger canonical + migration bridge | Critical |
| Movement types minimal lengkap | Sebagian movement ada | Partial | Beberapa tipe belum eksplisit unified enum | Tracking audit lemah | Definisikan enum movement tunggal lintas domain | High |
| Current stock dihitung dari mutasi | Terjadi di beberapa jalur; sebagian masih cache-like | Partial | Belum uniform | Perbedaan saldo antar halaman | Jadikan computed saldo dari ledger + materialized cache | High |
| BOM/recipe consumption saat order confirmed | Ada recipe & integrasi parsial | Partial | Timing/consumption policy belum konsisten | COGS dan stok salah | Tegaskan event konsumsi stok per outlet/channel | High |
| Cancellation reversal movement | Ada reversal sebagian | Partial | Tidak universal di semua jalur | Ledger tidak immutable | Wajib reversal-only policy | High |
| Transfer workflow lengkap + discrepancy | Transfer request ada | Partial | `received_with_discrepancy` belum matang | Selisih barang tidak terlacak | Tambah qty_sent vs qty_received + reason | High |
| Stok gudang berkurang saat shipped, outlet bertambah saat received | Implementasi campuran tergantung mode | Partial | Inconsistent semantics | Rekonsiliasi transfer sulit | Tetapkan satu keputusan arsitektur dan enforce | High |
| Production batch model | Belum tersedia penuh | Missing | Tidak ada batch entity core | Produksi pusat tak terukur | Tambah modul production batch phase 2 | High |
| Cashier shift immutable setelah approved | Shift ada, approval parsial | Partial | Immutable/audit enforcement belum ketat | Fraud/manual tamper | Lock approved shift + reopen via audited action | High |
| Roles dasar lengkap (OWNER..AUDITOR) | Role aktif hanya subset | Missing | Banyak role belum modeled | Sulit segregasi tugas | Tambah role/permission bertahap tanpa breaking existing | High |
| Sensitive actions butuh approval/audit trail lengkap | Beberapa sudah ada (void/discount PIN) | Partial | Belum konsisten semua aksi sensitif | Compliance risk | Unified audit log + approval policy engine | Critical |
| Audit log before/after + reason + outlet | Domain-specific log ada, global belum | Missing | Tidak ada standar lintas domain | Forensic sulit | Buat `audit_logs` append-only | Critical |
| QR table secure token & mode paid-first/pay-later | QR saat ini untuk shortcut internal form | Missing | Guest order flow belum ada | Abuse/fraud dan UX gap | Bangun QR order module phase 3 | High |
| Integrasi external via abstraction | Sebagian abstraction sudah ada (channel/method) | Partial | Payment gateway/marketplace/printer bridge belum kuat | Lock-in dan rework | Formalize provider interface layer | Medium |
| Backend enforcement (bukan hanya hide menu) | Ada RLS + action guard | Partial | Service-role bypass + guard tidak seragam | Privilege escalation | Central authz layer + DB policy hardening | Critical |
| Test coverage modul kritikal | Unit test ada untuk beberapa modul | Partial | End-to-end critical flows minim | Regressions tinggi | Tambah integration tests per phase | High |

## Ringkasan Status

- **Complete**: 3
- **Partial**: 23
- **Missing**: 5
- **Incorrect Architecture**: 2

## Fokus Perbaikan Tercepat

1. Konsolidasi inventory ledger canonical.
2. Standarisasi authorization backend (service + data scope).
3. Unifikasi status model order/payment/item production.
4. Audit log lintas domain append-only.
5. Konsistensi outlet identity dan scoping.
