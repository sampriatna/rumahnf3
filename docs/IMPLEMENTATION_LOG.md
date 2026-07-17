# IMPLEMENTATION LOG — Rumah NF3

Catatan implementasi bertahap. Setiap fase UI dicatat terpisah.

---

## Phase UI-1 — App Shell & Design Tokens

**Tanggal:** 14 Juli 2026  
**Flag:** `NF3_FF_APP_SHELL_V1` (default `false`)  
**Status:** Selesai (kode)

### Ringkasan

Kerangka portal baru: sidebar role-based, top navigation, outlet switcher (owner/admin), design tokens, komponen status dasar, dan state UI (loading/empty/error/permission). POS, KDS, login, dan portal staf **tidak** dibungkus shell.

### File dibuat

| File | Peran |
|------|-------|
| `lib/ui-flags.ts` | Feature flag rollout UI |
| `lib/design-tokens.ts` | Token warna, radius, spacing, shell layout |
| `lib/ui-labels.ts` | Label tampilan ID (display only) |
| `lib/nav-items.ts` | Adapter navigasi dari `lib/rbac.ts` |
| `lib/nav-items.test.ts` | Tes nav per role + outlet switcher |
| `lib/portal-shell.ts` | Route yang memakai shell + judul halaman |
| `lib/shell-outlet.ts` | Baca cookie outlet aktif shell |
| `app/shell-actions.ts` | Server action set cookie outlet |
| `components/shell/AppShell.tsx` | Layout utama portal |
| `components/shell/ShellFrame.tsx` | Client frame (collapse + mobile drawer) |
| `components/shell/Sidebar.tsx` | Sidebar collapsible + drawer mobile |
| `components/shell/SidebarNav.tsx` | Nav item + active route |
| `components/shell/TopNavigation.tsx` | Top bar + shortcut operasional |
| `components/shell/OutletSwitcher.tsx` | Pilih outlet (owner/admin) |
| `components/shell/UserMenu.tsx` | Nama user + logout |
| `components/shell/PortalShellGate.tsx` | Gate flag + session + shell |
| `components/ui/Button.tsx` | Primitif tombol |
| `components/ui/Card.tsx` | Primitif kartu |
| `components/ui/OpStatusBadge.tsx` | Badge status operasional |
| `components/ui/LoadingState.tsx` | State loading |
| `components/ui/EmptyState.tsx` | State kosong |
| `components/ui/ErrorState.tsx` | State error |
| `components/ui/PermissionDenied.tsx` | State akses ditolak |
| `components/ui/Skeleton.tsx` | Skeleton loading section |
| `app/akses-ditolak/page.tsx` | Halaman permission denied |

### File diubah

| File | Perubahan |
|------|-----------|
| `app/layout.tsx` | Bungkus `PortalShellGate` |
| `app/globals.css` | CSS variables token NF3 |
| `middleware.ts` | Header `x-pathname` untuk judul shell |
| `app/dashboard/page.tsx` | Integrasi shell (grid menu disembunyikan saat shell on) |
| `app/dashboard/OwnerSummaryFallback.tsx` | Pakai `LoadingState` |
| `app/inventory/layout.tsx` | Padding disesuaikan saat shell aktif |
| `.env.example` | Dokumentasi `NF3_FF_APP_SHELL_V1` |

### Komponen lama dipertahankan

- `MenuCard`, `OwnerDashboardShell`, `StaffShell`, `InventorySidebar`
- `PageHeader`, `AlertBanner`, `Modal`, `StatusBadge` (form/request)
- `lib/rbac.ts` — sumber kebenaran menu
- Semua halaman POS/KDS/staf tanpa perubahan layout

### Komponen lama direfactor

- `app/layout.tsx` — dari minimal ke shell gate
- `OwnerSummaryFallback` — spinner inline → `LoadingState`

### Dependency baru

Tidak ada. Hanya `lucide-react` (sudah ada).

### Rollback

Set `NF3_FF_APP_SHELL_V1=false` di environment → layout lama (tanpa sidebar global).

### Hasil verifikasi

| Cek | Hasil |
|-----|-------|
| `npm run lint` | ✔ No ESLint warnings or errors |
| `npm run typecheck` | ✔ Pass |
| `npm run test:phase0` | ✔ 34/34 pass |
| `npx vitest run lib/nav-items.test.ts` | ✔ 8/8 pass |

### Acceptance criteria

- [x] Sidebar mengikuti role dan permission (`buildShellNav` ← `rbac`)
- [x] Owner/admin melihat outlet switcher (`canShowOutletSwitcher`)
- [x] Leader/staf tidak melihat outlet switcher
- [x] Route aktif terlihat (`aria-current`, bg navy-800)
- [x] Layout desktop + tablet landscape (sidebar lg+, collapse)
- [x] Sidebar dapat collapse (desktop) + drawer mobile
- [x] Tidak ada menu hardcoded by email
- [x] Tidak ada perubahan database
- [x] POS/KDS/inventori logic tidak diubah
- [x] Loading, empty, error, permission denied tersedia sebagai komponen
- [ ] Manual UAT staging — belum dilakukan

### Belum selesai (di luar scope UI-1)

- Storybook / dokumentasi visual interaktif
- Ganti semua redirect `?error=` ke `ErrorState` di setiap halaman
- Tooltip sidebar saat collapsed (ikon saja)
- Outlet switcher mempengaruhi scope data halaman (cookie hanya UI context saat ini)
- Fase UI-5 (inventori polish)

---

## Phase UI-2 — POS Layout Profesional

**Tanggal:** 14 Juli 2026  
**Flag:** `NF3_FF_POS_LAYOUT_V2` (default `false`)  
**Status:** Selesai (kode)

### Ringkasan

Layout POS 3-area di `/pos`: toolbar atas, strip bill terbuka, katalog kiri, panel keranjang kanan (desktop) + bottom sheet (mobile/tablet). Logic order, payment, dan server actions **tidak diubah** — branch lama tetap ada saat flag off.

### File dibuat

| File | Peran |
|------|-------|
| `components/pos/PosShell.tsx` | Orkestrator layout 3-area |
| `components/pos/PosToolbar.tsx` | Toolbar shift, outlet, navigasi |
| `components/pos/PosAlerts.tsx` | Banner ok/error + register |
| `components/pos/PosOrderStrip.tsx` | Strip bill terbuka horizontal |
| `components/pos/CartPanel.tsx` | Keranjang + aksi order |
| `components/pos/OrderTypeSelector.tsx` | Pilih channel + input meja |
| `components/pos/PosCartSheet.tsx` | FAB + sheet keranjang (mobile) |
| `lib/ui-labels.test.ts` | Tes label ID operasional |

### File diubah

| File | Perubahan |
|------|-----------|
| `app/pos/page.tsx` | Branch `UI_FLAGS.posLayoutV2` → `PosShell` vs layout legacy |
| `lib/ui-flags.ts` | Flag `posLayoutV2` |
| `.env.example` | Dokumentasi flag |

### Komponen dipertahankan

- `PosMenuGrid` — katalog menu + modifier (tanpa rewrite logic)
- Semua `app/pos-actions.ts`, `lib/pos-service.ts`
- Halaman split, merge, void — tidak dirombak

### UI-2b — POS visual polish + wiring (14 Jul 2026)

**Masalah:** Layout 3-area ada tapi tampilan masih mirip legacy; bill terbuka dobel (strip + sidebar); checkout monolitik terpisah dari shell POS.

**Perbaikan (flag `NF3_FF_POS_LAYOUT_V2` sama):**

| Area | Perubahan |
|------|-----------|
| `app/globals.css` | Token `.pos-panel`, `.pos-menu-tile`, `.pos-qty-btn`, dll. |
| `PosToolbar` | Tombol ikon terkelompok, highlight online pending |
| `PosOrderStrip` | Kartu bill + aksi Split/Hold; satu sumber bill terbuka |
| `CartPanel` | Keranjang touch-friendly; `OpenBillsPanel` hanya Hold saat strip aktif |
| `PosMenuGrid` | Prop `variant="v2"` — tile lebih besar |
| `PaymentSummary.tsx` | Panel bayar terpisah (quick cash, metode, split) |
| `PosCheckoutShell.tsx` | Shell checkout konsisten dengan POS |
| `app/pos/checkout/[orderId]/page.tsx` | Layout 2-kolom: detail kiri + bayar kanan |

**Logic bisnis:** tidak diubah — hanya presentasi & pemisahan komponen.

### UI-2c — POS Indonesia full page (14 Jul 2026)

**Scope:** Hanya `/pos` (+ komponen POS). Tidak menyentuh Dashboard, KDS, Inventori, Loyalty, Absensi, Laporan.

**Route:** `GET /pos` (flag `NF3_FF_POS_LAYOUT_V2=true`)

**Layout:** ActiveOrderStrip atas · ProductGrid tengah · CartPanel kanan · PosCartSheet tablet

**Komponen baru / rename:**

| Komponen plan | File |
|---|---|
| ActiveOrderStrip | `ActiveOrderStrip.tsx` (alias `PosOrderStrip`) |
| OrderTypeSelector | `OrderTypeSelector.tsx` — label ID |
| TableSelector | `TableSelector.tsx` — denah meja / input |
| WaiterSelector | `WaiterSelector.tsx` — placeholder (debt) |
| CustomerSelector | `CustomerSelector.tsx` — placeholder (debt) |
| CategoryTabs | `CategoryTabs.tsx` |
| ProductSearch | `ProductSearch.tsx` |
| ProductGrid | `ProductGrid.tsx` (menggantikan `PosMenuGrid`) |
| ProductCard | `ProductCard.tsx` |
| ModifierDialog | `ModifierDialog.tsx` |
| CartPanel / CartItem | `CartPanel.tsx`, `CartItem.tsx` |
| OrderNote | `OrderNote.tsx` |
| DiscountSection | `DiscountSection.tsx` — checkout only (debt) |
| PaymentSummary | `PaymentSummary.tsx` — checkout |
| PlaceOrderButton / PaymentButton / DraftButton | `PosActionButtons.tsx` |
| PrintButton / VoidButton | `PosReceiptActions.tsx` |

**Service/API (existing, tidak diubah):**

- `lib/pos-service.ts` — menu, cart, shift, orders
- `lib/branch-menu-service.ts` — harga outlet, active, soldOut
- `lib/channel-service.ts` — tipe pesanan
- `lib/pos-floor.ts` — daftar meja
- `lib/price-schedule-service.ts` — harga spesial aktif
- `app/pos-actions.ts` — server actions
- `lib/pos-auth.ts` — outlet scope kasir

**Technical debt (tidak diperbaiki di slice ini):**

| ID | Gap |
|---|---|
| POS-TD-001 | `waiterId` tidak ada di model `PosOrder` |
| POS-TD-002 | Member attach hanya di checkout, bukan POS utama |
| POS-TD-003 | Diskon hanya di checkout |
| POS-TD-004 | Channel `delivery_own` (Pesan Antar) belum di seed KBU/Kisamen |
| POS-TD-005 | Validasi meja wajib per channel di `createOrderFromCart` belum di service (UI only) |
| POS-TD-006 | Loading menu async / error fetch — page server-render, belum Suspense |

**Rollback:** `NF3_FF_POS_LAYOUT_V2=false` → layout legacy `app/pos/page.tsx`

**Verifikasi:** lint ✔ · typecheck ✔ · test:phase0 34/34 ✔ · pos-channel-labels 2/2 ✔

### Deploy production — POS UI-2c (14 Jul 2026)

| Item | Nilai |
|------|--------|
| Deploy 2 (channel + validasi) | `dpl_2piEe2Upr7Vwdmowm6mtQ2RwduUq` |
| URL terbaru | https://rumah-nf3-l7a0e6voe-nf3-projects.vercel.app |
| Aliases | rumah/pos/kds/staff.nf3.company |
| Env sync | `NF3_FF_POS_LAYOUT_V2=true` + semua flag UI |
| Build | ✔ Compiled + lint + types |
| Smoke | `/api/health` 200 · `/pos/login` 200 |

### Post-deploy — lanjutan prompt (slice 2)

| Perbaikan | File |
|-----------|------|
| Channel **Pesan Antar** (`delivery_own`) seed + idempotent upsert | `channel-seed.ts`, `channel-service.ts` |
| Validasi meja wajib per channel | `app/pos-actions.ts` |
| Loading state kasir | `app/pos/loading.tsx` |
| Tes channel upsert | `lib/channel-service.test.ts` |

**Debt tersisa:** waiter (TD-001), customer di POS utama (TD-002), diskon di POS utama (TD-003).

**Resolved:** TD-004 Pesan Antar · TD-005 validasi meja di action · TD-006 loading.tsx

### UI-2d — Buka shift, outlet picker, form pesanan dinamis (14 Jul 2026)

**Scope:** Hanya POS (`/pos` + komponen terkait). Tidak menyentuh modul lain.

| Perubahan | File |
|-----------|------|
| Layar buka shift konsisten `pos-shell` | `PosOpenShiftScreen.tsx` |
| Pilih outlet owner/admin sebelum POS | `PosOutletPicker.tsx` |
| Form channel dinamis: meja wajib dine-in, nama pelanggan takeaway/delivery | `CartOrderForm.tsx` |
| Keranjang pakai form dinamis (ganti form statis) | `CartPanel.tsx` |
| Branch v2: open shift / outlet picker | `app/pos/page.tsx` |
| `CustomerSelector` re-export dari `CartOrderForm` | `CustomerSelector.tsx` |
| `customerName` opsional di create order / hold bill | `app/pos-actions.ts`, `lib/pos-service.ts` |
| Smoke route production | `scripts/pos-smoke-uat.mjs`, `npm run smoke:pos` |

**Debt partial:** TD-002 — nama pelanggan di POS utama (takeaway/delivery); member loyalty tetap checkout only.

**Verifikasi:** lint ✔ · typecheck ✔ · test:phase0 34/34 ✔ · channel + pos-channel-labels 3/3 ✔

### Deploy production — POS UI-2d (14 Jul 2026)

| Item | Nilai |
|------|--------|
| Deploy ID | `dpl_6MrYCh93uuXKkCuhPJn7xi9YyPtw` |
| URL deploy | https://rumah-nf3-7a65u8yqu-nf3-projects.vercel.app |
| Aliases | rumah/pos/kds/staff.nf3.company |
| Build Vercel | ✔ Compiled + lint + types |
| Smoke `npm run smoke:pos` | health 200 · pos/login 200 · /pos 307 (auth) |

**Manual UAT (belum sign-off):** login kasir outlet → buka shift → layout 3-area → ganti tipe pesanan → meja wajib hanya Makan di Tempat → isi nama pelanggan Bawa Pulang/Pesan Antar → buat order.

### UI-2e — Polish sub-halaman POS (14 Jul 2026)

**Scope:** `/pos/floor`, `/pos/close`, `/pos/drawer` — konsisten `pos-shell` saat `NF3_FF_POS_LAYOUT_V2=true`.

| Perubahan | File |
|-----------|------|
| Shell sub-halaman (header + back link) | `PosSubPageShell.tsx` |
| Alert error/success terpadu | `PosSubPageAlerts.tsx` |
| Form pay in/out + riwayat laci | `CashDrawerForm.tsx` |
| Denah meja / tutup shift / laci v2 | `app/pos/floor/page.tsx`, `close/page.tsx`, `drawer/page.tsx` |
| `pos-total-box` di ringkasan laci | `ShiftSummaryCard.tsx` |

**Verifikasi:** lint ✔ · typecheck ✔

### UI-2f — Koneksi gap POS & portal (15 Jul 2026)

| Perbaikan | File / area |
|-----------|-------------|
| Outlet switcher → scope data | `lib/portal-outlet-scope.ts` · `/orders` `/checker` `/inventory` `/reports/outlet` |
| Validasi meja di service layer | `lib/pos-order-validation.ts` · `pos-service.ts` |
| Pelayan (`waiterId`/`waiterName`) | `pos-kds-roadmap.ts` · `pos-waiter-service.ts` · `WaiterSelector` |
| Diskon/member hint di keranjang | `DiscountSection.tsx` |
| Selisih kas fisik tutup shift | `closeShift` · `/pos/close` |
| Label refund pembayaran | `ui-labels.ts` · `PaymentSummary.tsx` |
| POS v2 shell merge/split/void/online | `app/pos/merge` `split` `void` `online` |
| `/pos/add-item` redirect ke POS v2 | `app/pos/add-item/page.tsx` |
| Audit log viewer | `/settings/audit` · menu owner/admin |
| KDS canonical writer default on | `phase0-flags.ts` · audit default on |

**Masih eksternal / fase berikutnya:** QRIS gateway, API GoFood/Grab, antrean Samtaro, produksi batch, unifikasi inventori dual-model, role KITCHEN/BAR/CHECKER, checker mark-complete.

### UI-2g — Library scope, member attach, checker links (15 Jul 2026)

| Perbaikan | File / area |
|-----------|-------------|
| Library ikut shell outlet switcher | `resolveLibraryOutletId` · 14 halaman `/library/*` + branch-menu + copy |
| Kode member di keranjang → attach order | `MemberCodeField` · `createOrderAction` · `addToOpenBillAction` |
| Deep link `?item=` buka modifier | `ProductGrid` · `PosShell` · `app/pos/page.tsx` |
| Checker → POS checkout & KDS | `CheckerBoard.tsx` · `app/checker/page.tsx` |
| Owner report scope omzet POS | `app/reports/owner/page.tsx` · shell cookie |

**Verifikasi:** lint ✔ · typecheck ✔ · test:phase0 34/34 ✔ · portal-outlet + validation 8/8 ✔

### UI-2h — Drawer navigasi POS (audit Section 1) (15 Jul 2026)

| Item | File / area |
|------|-------------|
| Flag `NF3_FF_POS_DRAWER_NAV_V1` | `lib/ui-flags.ts` |
| Menu drawer 8 item + aksi cepat | `lib/pos-nav.ts` · `PosDrawerNav.tsx` |
| Header global (outlet, user, shift, device, online) | `PosGlobalHeader.tsx` |
| Banner sync pending | `PosSyncBanner.tsx` · `lib/pos-sync-status.ts` (Fase C: `lib/pos-sync-queue.ts`) |
| Layout shell | `PosDrawerLayout.tsx` · wire `PosShell` / `PosSubPageShell` |
| Halaman hub & placeholder | `/pos/sync` `history` `shift` `member-deposit` `recap` `attendance` |
| Hub Ganti Shift / Hari | `/pos/shift` — kartu kas + link laci/tutup shift |

**Aktifkan:** `NF3_FF_POS_DRAWER_NAV_V1=true` (+ `NF3_FF_POS_LAYOUT_V2=true`)

**Deploy:** live — `dpl_22wJW4sKJzHA5UJPauQ421K6pwQR` → **live** (lihat Deploy UI-2h–2l di bawah)

### UI-2j — Fase B: Riwayat & rekapitulasi (15 Jul 2026)

| Item | File / area |
|------|-------------|
| Query penjualan per tanggal | `lib/pos-sales-history.ts` |
| Filter status / bayar / cari | `PosSalesHistoryFilters` · `/pos/history` |
| Rekap rentang tanggal | `buildSalesRecap` · `/pos/recap` |
| Agregasi bayar, channel, pengeluaran | `PosSalesRecapPanel` |

**Verifikasi:** typecheck ✔ · lint ✔ · `pos-sales-history.test` 4/4 ✔

**Deploy:** belum

**Deploy:** belum

**Deploy:** belum → **live** (lihat Deploy UI-2h–2l di bawah)

### UI-2l — Fase D: Member deposit & absen (15 Jul 2026)

| Item | File / area |
|------|-------------|
| Saldo deposit + ledger | `depositBalance` di Customer · `memberDepositTxns` · `lib/pos-member-deposit.ts` |
| Top-up deposit (leader+) | `/pos/member-deposit` · `PosMemberDepositPanel` · `topUpMemberDepositAction` |
| Absen clock-in/out | `posAttendanceRecords` · `lib/pos-attendance.ts` · `/pos/attendance` |
| UI absen outlet | `PosAttendancePanel` · rekap harian per outlet |
| Badge Fase D di drawer | Dihapus dari nav member & attendance |

**Verifikasi:** typecheck · lint · `pos-phase-d.test`

**Deploy:** belum → **live** (lihat Deploy UI-2h–2l di bawah)

### UI-2k — Fase C: Sync queue, device ID, connectivity (15 Jul 2026)

| Item | File / area |
|------|-------------|
| Flag `NF3_FF_POS_SYNC_V1` (default on) | `lib/ui-flags.ts` |
| Antrean sync + `syncStatus` order | `lib/pos-sync-queue.ts` · `posSyncQueue` di store |
| Hook create/bayar/void/tutup shift | `lib/pos-service.ts` · `lib/pos-integration.ts` |
| Device ID cookie tablet | `lib/pos-device-cookie.ts` · `PosDeviceBootstrap.tsx` |
| Badge online/offline | `PosConnectivityBadge.tsx` · `PosGlobalHeader.tsx` |
| Halaman sinkronkan | `/pos/sync` · `PosSyncPanel` · `syncPosAction` |
| Banner pending nyata | `lib/pos-sync-status.ts` → `getPendingSyncCount` |

**Verifikasi:** typecheck · lint · `pos-sync-queue.test`

**Deploy:** belum

### UI-2i — Fase A: Pengeluaran, Total Kas Akhir, Tutup Toko (15 Jul 2026)

| Item | File / area |
|------|-------------|
| Pengeluaran outlet per shift | `lib/pos-outlet-expense.ts` · `/pos/expenses` |
| Formula Total Kas Akhir | `getCashDrawerSummary` — kas awal + tunai − pengeluaran |
| Tutup / Buka toko | `lib/pos-store-day.ts` · `closeStoreDay` / `openStoreDay` |
| Guard buka shift | `openShift` + `PosStoreClosedScreen` |
| Hub shift kartu audit | `/pos/shift` · `ShiftSummaryCard` |

**Verifikasi:** typecheck ✔ · lint ✔ · `pos-phase-a.test` 3/3 ✔

**Deploy:** belum

| Route smoke drawer | sync · history · shift · attendance · member-deposit · recap → 307 (auth) |

### UAT production otomatis — UI-2h + Fase A/B/C/D (15 Jul 2026)

Script: `npm run smoke:pos-uat` · **22/22 lulus**

| Role | Cek |
|------|-----|
| Kasir PIN (kbu+1234) | Login · drawer · sync · history · shift · absen · recap/deposit ditolak |
| Leader 0802 | Member deposit UI · rekapitulasi |
| Owner 0800 | Dashboard · POS drawer · halaman sync |

**Belum diotomasi (perlu browser):** buka shift, buat order, top-up deposit, clock-in/out tombol submit.

### Deploy production — UI-2g (15 Jul 2026)

| Item | Nilai |
|------|--------|
| Deploy ID | `dpl_2TQUGEwsWHZfAj1RHY3eiHViq5Z2` |
| URL deploy | https://rumah-nf3-d00mbide5-nf3-projects.vercel.app |
| Aliases | rumah/pos/kds/staff.nf3.company |
| Build Vercel | ✔ Compiled + lint + types |
| Smoke `npm run smoke:pos` | health 200 · pos/login 200 · /pos 307 · /pos?outlet=kbu 307 |

### Deploy production — POS UI-2e (14 Jul 2026)

| Item | Nilai |
|------|--------|
| Deploy ID | `dpl_D6pirr7WNzWMsB2MkwhiBZjWShcH` |
| URL deploy | https://rumah-nf3-cw993b6g8-nf3-projects.vercel.app |
| Aliases | rumah/pos/kds/staff.nf3.company |
| Build Vercel | ✔ Compiled + lint + types |
| Smoke `npm run smoke:pos` | health 200 · pos/login 200 · /pos 307 |

### Rollback

`NF3_FF_POS_LAYOUT_V2=false` → render layout lama di `app/pos/page.tsx`.

### Hasil verifikasi

| Cek | Hasil |
|-----|-------|
| `npm run lint` | ✔ No ESLint warnings or errors |
| `npm run typecheck` | ✔ Pass |
| `npm run test:phase0` | ✔ 34/34 pass |
| `lib/ui-labels.test.ts` | ✔ 4/4 pass |

### Acceptance criteria

- [x] Buka shift → katalog + cart tampil (`PosShell`)
- [x] Channel selector (`OrderTypeSelector`)
- [x] Modifier/variant via `PosMenuGrid` (unchanged)
- [x] Open bill + hold + resume (`CartPanel`, `OpenBillsPanel`)
- [x] Kirim dapur + checkout path unchanged (same actions)
- [x] Label ID via `lib/ui-labels.ts` di strip & daftar order
- [x] Responsive: cart kanan `lg+`, sheet FAB di bawah `lg`
- [ ] Manual UAT kasir jam sibuk — belum dilakukan

### Belum selesai (di luar scope UI-2)

- `PaymentSummary` terpisah di halaman checkout (checkout masih inline)
- `ModifierDialog` rename dari `Modal`
- Gabung `/pos/add-item` ke modal

---

## Phase UI-3 — Pesanan, KDS Polish, Checker

**Tanggal:** 14 Juli 2026  
**Flag:**
- `NF3_FF_ORDERS_PAGE_V1`
- `NF3_FF_CHECKER_READ_V1`
- `NF3_FF_KDS_SUMMARY_V1`

(default `false` masing-masing)  
**Status:** Selesai (kode)

### Ringkasan

Halaman **Pesanan** terpusat (`/orders`), **Checker** read-only (`/checker`), dan **ringkasan KDS** di board. Semua read-only — tidak ada write checker. Navigasi shell + shortcut POS saat flag aktif.

### File dibuat

| File | Peran |
|------|-------|
| `app/orders/page.tsx` | Daftar pesanan shift + filter |
| `app/checker/page.tsx` | Board kesiapan lintas dapur/bar |
| `lib/orders-service.ts` | Read service filter pesanan shift |
| `lib/orders-service.test.ts` | Tes filter channel/payment/status |
| `lib/checker-service.ts` | Agregasi readiness dari KDS board + fallback POS |
| `lib/checker-service.test.ts` | Tes smoke checker board |
| `components/orders/OrderCard.tsx` | Kartu pesanan + badge status |
| `components/orders/OrderItemRow.tsx` | Baris item produksi |
| `components/checker/CheckerBoard.tsx` | 2-kolom antrian + detail item |
| `components/kds/KdsBoardSummary.tsx` | Bar ringkasan baru/dibuat/siap/terlambat |
| `components/ui/FilterTabs.tsx` | Tab filter URL query |

### File diubah

| File | Perubahan |
|------|-----------|
| `lib/nav-items.ts` | Inject Pesanan + Checker ke sidebar/shortcut |
| `lib/portal-shell.ts` | Route `/orders`, `/checker` |
| `middleware.ts` | Portal prefix orders/checker |
| `components/pos/PosToolbar.tsx` | Link Pesanan/Checker |
| `app/kds/page.tsx` + `KdsBoardClient` | `showSummary` flag |
| `components/kds/KdsOrderCard.tsx` | Modifier bar highlight (station=bar) |

### Komponen dipertahankan

- `KdsTabletShell`, `KdsBoardClient` logic
- `lib/pos-service.ts`, `app/kds-actions.ts`, `app/pos-actions.ts`
- KDS dark theme

### Rollback

Matikan flag masing-masing → halaman redirect ke dashboard; KDS summary hilang; nav item tidak muncul.

### Hasil verifikasi

| Cek | Hasil |
|-----|-------|
| `npm run lint` | ✔ No ESLint warnings or errors |
| `npm run typecheck` | ✔ Pass |
| `npm run test:phase0` | ✔ 34/34 pass |
| `lib/orders-service.test.ts` | ✔ 3/3 pass |
| `lib/checker-service.test.ts` | ✔ 2/2 pass |

### Acceptance criteria

- [x] `/orders` list shift + filter channel/status bayar
- [x] KDS summary: baru / sedang dibuat / siap / terlambat
- [x] Checker item per area dapur/bar + progress station
- [x] KDS bar modifier ditonjolkan (`stationId === "bar"`)
- [x] Label bahasa Indonesia (`lib/ui-labels.ts`)
- [x] Checker read-only (banner "segera hadir" untuk aksi)
- [ ] Manual UAT 3 order aktif — belum dilakukan

### Belum selesai (di luar scope UI-3)

- Checker mark complete (butuh approval bisnis)
- `TimerIndicator` komponen terpisah
- Pagination `/orders` untuk shift panjang

---

## Phase UI-4 — Meja, Shift Kasir, Laporan Dasar

**Tanggal:** 14 Juli 2026  
**Flag:** `NF3_FF_UI_OPS_V1` (default `false`)  
**Status:** Selesai (kode)

### Ringkasan

Polish operasional POS: denah meja visual, tutup shift + laci kas dengan ringkasan netral, panel omzet POS di laporan outlet/owner. Logic `closeShift`, `moveOrderTable`, `buildDailyReport` **tidak diubah**.

### File dibuat

| File | Peran |
|------|-------|
| `lib/pos-report-snapshot.ts` | Snapshot omzet POS hari ini (read-only) |
| `lib/pos-report-snapshot.test.ts` | Tes agregasi omzet |
| `components/pos/TableCard.tsx` | Kartu meja + legend + stat grid |
| `components/pos/FloorTableTile.tsx` | Meja + form pindah |
| `components/pos/MoveTableForm.tsx` | Pindah meja + `ConfirmationDialog` |
| `components/pos/ShiftSummaryCard.tsx` | Ringkasan tutup shift / laci |
| `components/ui/StatCard.tsx` | KPI card |
| `components/ui/ConfirmationDialog.tsx` | Dialog konfirmasi aksi sensitif |
| `components/reports/PosSalesPanel.tsx` | Panel omzet POS di laporan |

### File diubah

| File | Perubahan |
|------|-----------|
| `app/pos/floor/page.tsx` | Layout baru: `FloorTableTile`, stats, legend |
| `app/pos/close/page.tsx` | `ShiftSummaryCard` saat flag on |
| `app/pos/drawer/page.tsx` | `ShiftSummaryCard` variant drawer |
| `app/reports/outlet/page.tsx` | `PosSalesPanel` per outlet |
| `app/reports/owner/page.tsx` | `PosSalesPanel` global |
| `lib/ui-flags.ts` | Flag `uiOpsV1` |

### Komponen dipertahankan

- `lib/pos-floor.ts` — `TABLE_STATUS_STYLE`, `buildFloorState`
- `closeShiftAction`, `moveOrderTableAction`, `cashDrawerEntryAction`
- Halaman merge/split/void POS

### Rollback

`NF3_FF_UI_OPS_V1=false` → layout lama floor/close/drawer + laporan tanpa panel POS.

### Hasil verifikasi

| Cek | Hasil |
|-----|-------|
| `npm run lint` | ✔ No ESLint warnings or errors |
| `npm run typecheck` | ✔ Pass |
| `npm run test:phase0` | ✔ 34/34 pass |
| `lib/pos-report-snapshot.test.ts` | ✔ 1/1 pass |

### Acceptance criteria

- [x] Meja status warna + label ID (`TABLE_STATUS_STYLE`, `OpStatusBadge`)
- [x] Tutup shift dengan ringkasan wallet + daftar order
- [x] Selisih kas ditampilkan netral (copy panduan, bukan menyalahkan)
- [x] Owner/outlet report omzet POS (`buildPosSalesSnapshot`)
- [x] Pindah meja wajib konfirmasi (`ConfirmationDialog`)
- [ ] Manual UAT tutup shift + setoran — belum dilakukan

### Belum selesai (di luar scope UI-4)

- Zoom/pan denah meja
- Floor plan editor polish
- Selisih kas input di UI tutup shift (masih form setoran terpisah)

---

## Phase UI-5 — Inventori & Gudang Polish

**Tanggal:** 14 Juli 2026  
**Flag:** `NF3_FF_UI_INVENTORY_V1` (default `false`)  
**Status:** Selesai (kode)

### Ringkasan

Polish modul inventori: banner sumber data mutasi, alert stok kritis KPI, transfer pipeline + badge status, tabel riwayat mutasi. **Tidak ada** edit stok langsung; `inventory-service` / `transfer-service` tidak diubah. Produksi batch (`/production`) **tidak disentuh**.

### File dibuat

| File | Peran |
|------|-------|
| `lib/inventory-ui.ts` | Label sumber, tone transfer/mutasi |
| `lib/inventory-ui.test.ts` | Tes label & source resolver |
| `components/inventory/StockAlertCard.tsx` | KPI kritis + banner sumber + notice mutasi |
| `components/inventory/TransferStatusBadge.tsx` | Badge status transfer |
| `components/inventory/TransferCard.tsx` | Kartu daftar transfer + `TransferPipeline` |
| `components/inventory/MovementDataTable.tsx` | Tabel riwayat mutasi |

### File diubah

| File | Perubahan |
|------|-----------|
| `app/inventory/page.tsx` | Banner + `StockAlertCard` saat flag on |
| `app/inventory/transfers/page.tsx` | Pipeline + `TransferCard` |
| `app/inventory/transfers/[id]/page.tsx` | `TransferStatusBadge` |
| `app/inventory/movements/page.tsx` | `MovementDataTable` ganti timeline |
| `app/inventory/layout.tsx` | Integrasi app shell |
| `components/inventory/InventorySidebar.tsx` | Catatan mutasi; sembunyikan Dashboard jika shell on |
| `lib/ui-flags.ts` | Flag `inventoryUiV1` |
| `.env.example` | Dokumentasi flag |

### Komponen dipertahankan

- `InventorySaldoTable`, `InventoryOwnerDashboard`, `InventoryDataNav`
- Semua server actions mutasi/transfer
- Logic saldo dari `inventory-overview`

### Rollback

`NF3_FF_UI_INVENTORY_V1=false` → banner/tabel/kartu lama (inline banner kritis, timeline mutasi).

### Hasil verifikasi

| Cek | Hasil |
|-----|-------|
| `npm run lint` | ✔ No ESLint warnings or errors |
| `npm run typecheck` | ✔ Pass |
| `npm run test:phase0` | ✔ 34/34 pass |
| `lib/inventory-ui.test.ts` | ✔ 7/7 pass |
| **Total tes UI** | ✔ 25/25 pass |

### Acceptance criteria

- [x] Tidak ada input edit stok langsung (banner + notice mutasi)
- [x] Transfer status visual jelas (`TransferStatusBadge`, pipeline 3 langkah)
- [x] Stock alert dari saldo engine (`StockAlertCard` + KPI)
- [x] Label sumber data inventori aktif
- [ ] Manual UAT transfer end-to-end — belum dilakukan

### Belum selesai (di luar scope UI-5)

- Produksi batch UI (`/production`) — blocked
- Purchasing polish terpisah
- Data master `DataTable` polish (UI-5b)

---

## Ringkasan program UI (UI-1 s/d UI-5)

| Flag | Fase |
|------|------|
| `NF3_FF_APP_SHELL_V1` | UI-1 App shell |
| `NF3_FF_POS_LAYOUT_V2` | UI-2 POS layout |
| `NF3_FF_ORDERS_PAGE_V1` | UI-3 Pesanan |
| `NF3_FF_CHECKER_READ_V1` | UI-3 Checker |
| `NF3_FF_KDS_SUMMARY_V1` | UI-3 KDS summary |
| `NF3_FF_UI_OPS_V1` | UI-4 Meja/shift/laporan |
| `NF3_FF_UI_INVENTORY_V1` | UI-5 Inventori |

Semua default `false`. Aktifkan di `.env.local` untuk UAT lokal; rollback per flag.

### UAT manual per role (production)

**Base URL:** https://rumah.nf3.company · POS: https://pos.nf3.company · KDS: https://kds.nf3.company

Centang `[ ]` saat lulus. Jika gagal, catat flag yang dicurigai.

#### Owner / Admin (email login atau 0800/0801 PIN `1234`)

| # | Langkah | Harapan | ✓ |
|---|---------|---------|---|
| O1 | Login → `/dashboard` | Sidebar kiri + top bar + **outlet switcher** | [ ] |
| O2 | Ganti outlet di switcher → buka `/inventory` | Label outlet berubah / scope konsisten | [ ] |
| O3 | Collapse sidebar (ikon panel) | Menu jadi ikon; route aktif tetap jelas | [ ] |
| O4 | Buka `/orders?outlet=kbu` | Daftar pesanan + filter status/bayar/channel | [ ] |
| O5 | Buka `/checker?outlet=kbu` | Antrian + detail item per dapur/bar | [ ] |
| O6 | Buka `/inventory` | Banner sumber mutasi + KPI stok kritis (jika ada) | [ ] |
| O7 | Buka `/reports/owner` | Panel **Penjualan POS hari ini** | [ ] |
| O8 | Deep link `/finance` dari bookmark | Shell tetap ada, tidak error | [ ] |

#### Leader KBU (0802, PIN `1234`)

| # | Langkah | Harapan | ✓ |
|---|---------|---------|---|
| L1 | Login → dashboard | Sidebar **tanpa** outlet switcher; label outlet KBU | [ ] |
| L2 | Shortcut top bar **POS** | Buka `pos.nf3.company` | [ ] |
| L3 | POS: buka shift → layout 3-area | Toolbar, strip bill, menu kiri, keranjang kanan | [ ] |
| L4 | POS: tambah item + modifier | Masuk keranjang; qty +/- jalan | [ ] |
| L5 | POS: buat order dine-in / takeaway | Channel selector; checkout path sama | [ ] |
| L6 | POS: hold bill → resume | Bill muncul di strip + panel Hold | [ ] |
| L7 | `/pos/floor?outlet=kbu` (via POS subdomain) | Grid meja + warna status; tap meja terisi → checkout | [ ] |
| L8 | Pindah meja | Dialog konfirmasi muncul sebelum submit | [ ] |
| L9 | `/orders?outlet=kbu` | Hanya pesanan outlet KBU | [ ] |
| L10 | Tutup shift (jika tidak ada bill terbuka) | Ringkasan wallet + form setoran | [ ] |

#### Kasir / Staf POS (0803 atau PIN kasir outlet)

| # | Langkah | Harapan | ✓ |
|---|---------|---------|---|
| S1 | Login POS `pos.nf3.company/pos/login` | PIN pad + masuk kasir | [ ] |
| S2 | Layout POS v2 tablet landscape | Keranjang kanan (≥1024px) atau FAB keranjang (<1024px) | [ ] |
| S3 | Item sold out | Tidak bisa ditambah | [ ] |
| S4 | Kirim dapur → buka KDS | Tiket muncul kolom Baru | [ ] |
| S5 | Proses → Siap di KDS | Status item POS ikut (tidak desync visual) | [ ] |
| S6 | Bayar partial lalu full | Status bayar terpisah dari status order | [ ] |

#### Dapur / KDS (staf dengan akses kds)

| # | Langkah | Harapan | ✓ |
|---|---------|---------|---|
| K1 | Buka `/kds?outlet=kbu&station=dapur` | Board 3 kolom + **bar ringkasan** atas | [ ] |
| K2 | Buka `station=bar` | Modifier minuman ditonjolkan | [ ] |
| K3 | Proses → Siap | Tombol aksi tetap seperti sebelumnya | [ ] |

#### Inventori (owner/admin atau leader)

| # | Langkah | Harapan | ✓ |
|---|---------|---------|---|
| I1 | `/inventory/transfers` | Pipeline Ajukan→Kirim→Terima + kartu transfer | [ ] |
| I2 | Detail transfer | Badge status (bukan teks mentah) | [ ] |
| I3 | `/inventory/movements` | Tabel mutasi (bukan timeline) | [ ] |
| I4 | Tidak ada form "edit qty langsung" | Hanya mutasi/transfer | [ ] |

#### Regresi kritis (semua role)

| # | Cek | ✓ |
|---|-----|---|
| R1 | Login/logout tidak loop redirect | [ ] |
| R2 | POS jam sibuk: buat 3 order tanpa error | [ ] |
| R3 | Void/split/merge bill masih jalan | [ ] |
| R4 | Staf `0803` tidak melihat menu owner di portal | [ ] |

**Sign-off:** _______________ · Tanggal: _______________

---

## Production deploy — 14 Juli 2026 (terbaru: UI-2e)

| Item | Hasil |
|------|-------|
| Build Vercel | ✔ Compiled |
| Deploy ID (UI-2e) | `dpl_D6pirr7WNzWMsB2MkwhiBZjWShcH` |
| URL deploy | https://rumah-nf3-cw993b6g8-nf3-projects.vercel.app |
| Deploy sebelumnya | UI-2d `dpl_6MrYCh93uuXKkCuhPJn7xi9YyPtw` |
| Aliases | rumah.nf3.company, pos/kds/staff.nf3.company, rumah-nf3.vercel.app |
| `/api/health` | ✔ 200 |
| `npm run smoke:pos` | ✔ 4/4 route checks |
| UI flags production | Semua `NF3_FF_*` UI disync via `npm run sync:vercel-env` |

**Rollback cepat:** set flag `false` di Vercel env → redeploy (tanpa revert kode).

### UAT production smoke (14 Juli 2026, owner login)

| Cek | Hasil |
|-----|-------|
| Login email owner | ✔ 303 → `/dashboard` |
| App shell `/dashboard` | ✔ 200 |
| `/orders?outlet=kbu` | ✔ 200 |
| `/checker?outlet=kbu` | ✔ 200 |
| `/inventory` (UI-5 banner) | ✔ 200 |
| `/reports/owner` (omzet POS) | ✔ 200 |
| `/kds?outlet=kbu` (summary bar) | ✔ 200 |
| `pos.nf3.company/pos` (layout v2) | ✔ 200 |
| `/pos/floor` | Redirect ke subdomain POS (expected) |
