# UI/UX AUDIT — Rumah NF3

**Tanggal audit:** 14 Juli 2026  
**Metode:** Baca dokumen arsitektur + inspeksi langsung `app/`, `components/`, `lib/rbac.ts`, `middleware.ts`, `globals.css`, `tailwind.config.ts`.  
**Catatan:** `docs/IMPLEMENTATION_LOG.md` **tidak ditemukan** di repository.

---

## 1. Stack UI saat ini

| Layer | Implementasi aktual |
|---|---|
| Framework | Next.js 14 App Router, React 18, TypeScript |
| Styling | Tailwind CSS 3 + utility classes kustom di `app/globals.css` |
| Font | Inter via `next/font/google` (`app/layout.tsx`) |
| Ikon | `lucide-react` + `components/icon-map.tsx` |
| Komponen UI | Tidak ada shadcn/Radix kit; pola kustom (`panel`, `btn-primary`, `nf3-*`) |
| State UI | Mayoritas Server Components + Server Actions; sedikit client (`"use client"`) |
| Routing | Multi-subdomain: `rumah.nf3.company` (portal), `pos.`, `kds.`, `staff.` (`middleware.ts`) |
| PWA | `manifest-pos.json`, `manifest-kds.json` pada layout POS/KDS |

**Kesimpulan:** Stack layak dipertahankan. Modernisasi UI = evolusi design system + shell, bukan ganti framework.

---

## 2. Daftar halaman dan route (aktual)

### Portal utama (`rumah.nf3.company`)

| Area | Route | Keterangan |
|---|---|---|
| Auth | `/login` | Email/password |
| Ringkasan | `/dashboard` | Menu grid per role; owner punya tab ringkasan |
| Approval | `/approvals` | Approval center |
| Inbox | `/inbox` | Request & form |
| Finance | `/finance`, `/finance/ledger` | Kas & buku besar |
| Inventory | `/inventory`, `/inventory/*` | Sidebar kiri (satu-satunya shell mirip target) |
| Purchasing | `/purchasing` | PO |
| Library | `/library/*` | Menu, resep, floor, KDS config, dll. |
| Reports | `/reports/owner`, `/outlet`, `/loyalty`, `/ratings` | Terpisah dari dashboard |
| Members | `/members`, `/members/[id]` | Loyalty |
| Settings | `/settings/*` | Akun, PIN, POS, system |
| AI | `/ai` | Insight panel |
| Placeholder | `/segera?fitur=...` | Fitur belum ada |
| Staff (di portal) | `/staff/*` | Redirect ke subdomain staf untuk role staff |

### POS (`pos.nf3.company` → `/pos/*`)

| Route | Fungsi |
|---|---|
| `/pos/login` | PIN kasir |
| `/pos` | Kasir utama (menu + cart + bill list) |
| `/pos/floor` | Denah meja (KBU) |
| `/pos/checkout/[orderId]` | Pembayaran |
| `/pos/add-item` | Tambah item ke bill |
| `/pos/split`, `/merge`, `/void`, `/close`, `/drawer`, `/online`, `/reports`, `/receipt/*` | Sub-flow |

### KDS (`kds.nf3.company` → `/kds`)

| Route | Fungsi |
|---|---|
| `/kds` | Board kanban per station (dapur/bar/packing) |

### Staf (`staff.nf3.company`)

| Route | Fungsi |
|---|---|
| `/dashboard`, `/staff/form`, `/staff/status`, `/sop`, slip gaji | Portal pribadi staf |

### **Belum ada (vs target produk)**

- `/orders` — daftar pesanan terpusat
- `/checker` — checkpoint kelengkapan order
- `/tables` — manajemen meja standalone (ada `/pos/floor` + `/library/floor`)
- `/audit` — audit aktivitas UI
- KDS Bar terpisah route (station filter saja)
- Layar antrean pelanggan (Samtaro)
- Produksi batch UI

---

## 3. Component yang sudah tersedia

### Layout / shell (parsial)

| Component | Lokasi | Peran |
|---|---|---|
| `OwnerDashboardShell` | `components/dashboard/` | Tab Ringkasan / Menu owner |
| `StaffShell` + `StaffPage` | `components/staff/` | Shell portal staf |
| `InventorySidebar` | `components/inventory/` | Sidebar kiri inventory |
| `InventoryDataPageShell` | `components/inventory/` | Header + nav data |
| `KdsTabletShell` | `components/kds/` | Tab bar bawah KDS tablet |
| `LibraryCatalogBanner` | `components/library/` | Banner library |

**Tidak ada:** `AppShell`, `Sidebar` global, `TopNavigation`, `OutletSwitcher` reusable.

### Operasional

| Component | Lokasi | Peran |
|---|---|---|
| `PosMenuGrid` | `components/pos/` | Grid menu + modal modifier |
| `KdsBoardClient` | `components/kds/` | Kanban 3 kolom |
| `KdsOrderCard` | `components/kds/` | Kartu tiket KDS |
| `KdsAlertMonitor` | `components/kds/` | Alert suara/timer |
| `quick-cash`, `split-equal` | `components/pos/` | Checkout helpers |
| `FormRenderer` | `components/` | Form staff |

### UI primitives

| Component | Lokasi | Peran |
|---|---|---|
| `PageHeader` | `components/` | Breadcrumb + judul |
| `AlertBanner` | `components/ui/` | Success/info/warning/danger |
| `Modal` | `components/ui/` | Dialog dasar |
| `PasswordInput` | `components/ui/` | Input password |
| `StatusBadge` | `components/` | **Hanya** status form/request |
| `MenuCard` | `components/` | Kartu navigasi dashboard |
| `RoleBadge` | `components/` | Badge role |
| `MetricLabel` | `components/` | Hint metrik |
| `SaveToast` | `components/` | Feedback simpan |

### Dashboard / laporan

| Component | Lokasi |
|---|---|
| `DashboardOwnerSummary` | `components/` |
| `DashboardMenuGrid` | `components/` |
| `CatatinDailyReportsPanel` | `components/reports/` |
| `InventoryOwnerDashboard` | `components/inventory/` |

---

## 4. Component yang dapat dipertahankan

| Component | Alasan |
|---|---|
| `PosMenuGrid` | Sudah terhubung data menu, modifier, variant, package, layout; refactor visual, bukan rewrite |
| `KdsBoardClient` + `KdsOrderCard` | Pola kanban sudah benar; perlu polish timer/status/typography |
| `KdsTabletShell` | Tab operasional KDS (order/habis/closing) sudah cocok tablet |
| `InventorySidebar` | Pola sidebar terbaik di codebase; jadi referensi AppShell |
| `PageHeader` | Reusable, aksesibel (breadcrumb, back link) |
| `AlertBanner` + class `nf3-alert-*` | Status feedback konsisten |
| `Modal` | Basis dialog modifier/approval |
| `MenuCard` + `lib/rbac.ts` | Sumber navigasi permission-aware (perlu dipindah ke sidebar, bukan dihapus) |
| `OwnerDashboardShell` | Tab ringkasan/menu owner — fondasi dashboard baru |
| `FormRenderer` | Form operasional staf sudah production |
| Tailwind tokens `navy` / `gold` / `surface` | Brand NF3 sudah map ke primary neutral |

---

## 5. Component yang perlu direfactor

| Component / pola | Masalah | Arah refactor |
|---|---|---|
| Navigasi dashboard (`MenuCard` grid) | Bukan sidebar; tidak ada top bar operasional | Ekstrak ke `AppShell` + `Sidebar` dari data `lib/rbac.ts` |
| `app/pos/page.tsx` (monolith ~540 baris) | Layout belum 3-area profesional; cart + bills campur | Split layout components; pertahankan server data fetch |
| `StatusBadge` | Scope terlalu sempit (form saja) | Generalisasi `StatusBadge` order/payment/production |
| `app/layout.tsx` | Hanya `<body>{children}</body>` | Wrapper shell per segment (portal vs POS vs KDS) |
| KDS visual (`kds-shell`, dark red) | Beda dari brief "putih bersih" — **sengaja** untuk dapur | Pertahankan dark mode KDS; terapkan clean white ke portal/POS/dashboard |
| `Owner Report` page | Bahasa campur EN/ID; bukan dashboard operasional POS | Gabung KPI operasional + konsistensi istilah ID |
| Inventory vs portal styling | Gradient berbeda-beda | Unifikasi token, pertahankan variasi layout per modul |
| Placeholder `/segera` | Dead-end UX | Ganti `EmptyState` + sembunyikan dari nav jika `ready: false` |

---

## 6. Inkonsistensi design system

1. **Tiga dialect visual:** portal putih (`panel`), KDS gelap (`kds-shell`), staff gradient (`staff-app`).
2. **Button naming:** `btn-primary` (navy) vs inline Tailwind di POS/KDS.
3. **Radius:** `rounded-lg` vs `rounded-xl` vs `rounded-2xl` tanpa skala formal.
4. **Typography:** `font-black` judul vs `font-bold` body — tidak terdokumentasi.
5. **Status color:** KDS pakai sky/amber/emerald header; form pakai `STATUS_META`; POS pakai alert banner — tidak satu peta status.
6. **Istilah UI:** campur "Hold Bill", "Owner Report", "Diproses" vs brief ID ("Simpan Draft", "Ringkasan", "Sedang Diproses").
7. **Spacing:** POS `max-w-6xl`; inventory `max-w-7xl`; reports `max-w-4xl` — tidak harmonis desktop lebar.

---

## 7. Masalah responsive

| Area | Temuan |
|---|---|
| POS | Grid `lg:grid-cols-3` — cart di mobile stack bawah; belum bottom sheet drawer |
| KDS | `KdsBoardClient` grid 3 kolom — layak landscape tablet; portrait belum diuji |
| Dashboard | Menu grid 1–3 kolom; owner summary sticky sudah ada (perbaikan P2) |
| Inventory | Sidebar hidden di mobile? — perlu cek `InventorySidebar` (kemungkinan tidak collapsible) |
| Library | Banyak halaman admin desktop-first |
| POS `viewport` | `maximumScale: 1, userScalable: false` — tablet OK, aksesibilitas zoom terbatas |

**Target brief:** desktop 1366+, tablet landscape 1024 — POS/KDS sudah mendekati, portal perlu shell responsive.

---

## 8. Masalah usability

1. **Navigasi tidak persisten** — kembali ke dashboard via link tersebar, bukan sidebar.
2. **POS cognitive load** — open bills, held bills, cart, menu dalam satu halaman panjang.
3. **Tidak ada halaman Pesanan terpusat** — kasir/leader harus navigasi dari POS.
4. **Checker tidak ada** — handoff dapur→pelanggan tidak divisualkan.
5. **Outlet switcher** — hanya query `?outlet=` di POS/KDS; tidak ada komponen global owner.
6. **Feedback sukses** — banyak `searchParams.ok` banner; sedikit revalidate visual inline.
7. **Subdomain confusion** — user bisa tidak paham rumah vs pos vs kds (ada bookmark di settings, tapi tidak di shell).
8. **Placeholder menu** — item `ready: false` masih tampil di grid owner → `/segera`.

---

## 9. Masalah aksesibilitas

| Aspek | Status |
|---|---|
| Focus ring | Ada di `globals.css` (`ring-navy-500`) |
| Tab roles | `OwnerDashboardShell` pakai `role="tablist"` ✓ |
| Label form | POS/KDS sebagian pakai `<label>`; tidak universal |
| Color-only status | Meja floor pakai warna + label ✓; KDS header color-only count |
| Touch target | `pos-touch-btn` min-h-10 — di bawah ideal 44px tablet |
| KDS zoom | `userScalable: false` di POS viewport |
| Dialog | `Modal` ada; belum audit focus trap / ESC konsisten |

---

## 10. Masalah loading / error / empty state

| Pola | Temuan |
|---|---|
| Loading | Sedikit `Suspense` (dashboard owner summary); mayoritas blocking server render |
| Skeleton | **Tidak ada** komponen skeleton standar |
| Empty | KDS "Kosong" di kolom; `staff-empty` class; tidak konsisten di POS/finance |
| Error | `AlertBanner tone="warning"` + redirect query `?error=` |
| Permission denied | Redirect `/dashboard` — tidak ada halaman "Akses ditolak" |
| Offline | Tidak ada indikator koneksi (KDS polling `KdsAutoRefresh` saja) |

---

## 11. Ketidaksesuaian UI dengan business logic

1. **Order vs payment status** — UI sering menampilkan "lunas" bersamaan dengan order completed; brief minta pemisahan visual eksplisit.
2. **Production status** — POS item status vs KDS board status (dual model Phase 0) — UI tidak menjelaskan sumber kebenaran.
3. **Samtaro pay-before-produce** — tidak ada UI antrean/nomor antrian pelanggan.
4. **Void item vs void order** — ada halaman terpisah; tidak ada `AuditReasonDialog` standar (PIN + alasan ad-hoc).
5. **Shift close** — UI ada; selisih kas tidak prominent seperti brief.
6. **Inventory** — UI tidak menampilkan movement ledger sebagai satu-satunya sumber (beberapa view masih count langsung).
7. **Stok habis** — `soldOut` badge di menu ada; KDS panel habis terpisah.

---

## 12. Ketidaksesuaian UI dengan role dan permission

| Temuan | Detail |
|---|---|
| Menu RBAC | `lib/rbac.ts` + `getRoleConfig` — **frontend source of truth navigasi** |
| Backend guard | `requireAuthz`, `requirePosSession`, layout role check — **tidak seragam** |
| Capability | POS/KDS pakai `staff-capability`; portal pakai role saja |
| Inventory layout | Hard check `VIEW_ROLES` di layout — baik, tapi duplikat dengan rbac |
| Missing roles | Tidak ada role KITCHEN/BAR/CHECKER/WAREHOUSE terpisah — semua `staff` + capability |
| Outlet scope UI | Leader tidak melihat outlet switcher (benar); owner/admin pakai `?outlet=` manual |

**Risiko:** Modernisasi shell harus membaca **permission yang sama** dengan backend, bukan membuat nav baru.

---

## 13. Risiko jika UI langsung dirombak

| Risiko | Dampak |
|---|---|
| Break POS flow jam sibuk | Revenue loss |
| KDS desync visual | Dapur salah prioritas |
| Navigasi role salah | Akses modul tidak sesuai |
| Rewrite `pos/page.tsx` sekaligus | Regression split/merge/hold |
| Ganti subdomain routing | Session/cookie cross-domain rusak |
| Halaman statis tanpa data | User trust turun |
| Inkonsistensi istilah | Training ulang seluruh outlet |

---

## 14. Bukti route (referensi inspeksi)

| Route | Bukti kondisi |
|---|---|
| `/dashboard` | `app/dashboard/page.tsx` — MenuCard grid, StaffShell, OwnerDashboardShell |
| `/pos` | `app/pos/page.tsx` — `lg:grid-cols-3`, PosMenuGrid + cart panel |
| `/kds` | `app/kds/page.tsx` + `KdsBoardClient` — kanban baru/diproses/siap |
| `/pos/floor` | `app/pos/floor/page.tsx` — TableCard grid, TABLE_STATUS_STYLE |
| `/inventory` | `app/inventory/layout.tsx` — InventorySidebar |
| `/reports/owner` | `app/reports/owner/page.tsx` — KPI form/approval, bukan omzet POS |
| `/segera` | Placeholder dari menu `ready: false` |
| Checker | **Tidak ada file** di `app/` atau `components/` |

---

## Ringkasan audit

Aplikasi **fungsional** dengan fondasi komponen POS/KDS/inventory yang layak, tetapi **belum memiliki App Shell unified**, **navigasi sidebar**, **halaman Pesanan/Checker**, dan **design system terdokumentasi**. Visual terfragmentasi antar subdomain. Modernisasi aman dimulai dari shell + token, lalu POS layout, tanpa menyentuh business logic.
