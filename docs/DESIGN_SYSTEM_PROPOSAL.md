# DESIGN SYSTEM PROPOSAL — Rumah NF3

**Tanggal:** 14 Juli 2026  
**Prinsip:** Evolusi dari token Tailwind existing (`navy`, `gold`, `surface`); tidak ganti font (Inter); tidak tambah library komponen berat.

---

## 1. Color tokens

### Primary (aksi utama)

| Token | Nilai | Pemakaian |
|---|---|---|
| `--color-primary-50` | `#f2f6fb` (navy-50) | Hover bg ringan |
| `--color-primary-500` | `#214f7c` (navy-500) | Link aktif |
| `--color-primary-700` | `#12365c` (navy-700) | Sidebar active |
| `--color-primary-800` | `#0b2745` (navy-800) | Tombol utama, sidebar bg |
| `--color-primary-900` | `#071b31` (navy-900) | Heading |

### Neutral

| Token | Nilai | Pemakaian |
|---|---|---|
| `--color-surface` | `#f5f8fb` | App background |
| `--color-surface-raised` | `#ffffff` | Card, panel |
| `--color-border` | `#e2e8f0` (slate-200) | Border tipis |
| `--color-text` | `#0f172a` (slate-900) | Body |
| `--color-text-muted` | `#64748b` (slate-500) | Subtitle |
| `--color-text-subtle` | `#94a3b8` (slate-400) | Hint |

### Accent (brand sekunder)

| Token | Nilai | Pemakaian |
|---|---|---|
| `--color-accent-400` | `#d9af4a` (gold-400) | Highlight, badge premium |
| `--color-accent-500` | `#c99a2e` (gold-500) | Accent border hover |

### Status (operasional)

| Semantik | Background | Text | Border | Istilah ID |
|---|---|---|---|---|
| `status-new` | blue-50 | blue-900 | blue-200 | Baru / Menunggu |
| `status-active` | sky-50 | sky-900 | sky-200 | Aktif / Dikonfirmasi |
| `status-progress` | amber-50 | amber-900 | amber-200 | Sedang Diproses / Sedang Dibuat |
| `status-ready` | emerald-50 | emerald-900 | emerald-200 | Siap |
| `status-success` | emerald-50 | emerald-900 | emerald-300 | Selesai / Lunas |
| `status-danger` | rose-50 | rose-900 | rose-300 | Dibatalkan / Void / Terlambat |
| `status-muted` | slate-100 | slate-600 | slate-200 | Nonaktif / Draft / Lama |

**Aturan:** Setiap badge status wajib punya **ikon + label teks**, tidak warna saja.

### Domain-specific: KDS (tetap dark)

KDS mempertahankan skema gelap (`kds-shell`, navy-950) untuk kontras dapur — **tidak dipaksakan putih** seperti portal. Token terpisah `--kds-*` agar tidak bercampur.

---

## 2. Typography

**Font family:** Inter (existing `--font-inter`)

| Token | Size | Weight | Line height | Pemakaian |
|---|---|---|---|---|
| `text-display` | 32px | 800 | 1.2 | Nilai KPI dashboard |
| `text-h1` | 24px | 800 | 1.25 | Judul halaman |
| `text-h2` | 18px | 700 | 1.3 | Judul section/card |
| `text-h3` | 16px | 700 | 1.35 | Subsection |
| `text-body` | 15px | 500 | 1.5 | Body operasional (tablet) |
| `text-body-sm` | 14px | 500 | 1.45 | Tabel, secondary |
| `text-caption` | 12px | 600 | 1.4 | Label field, meta |
| `text-overline` | 11px | 700 | 1.3 | Section label uppercase |

**Minimum operasional tablet:** 14px body, 14–16px tombol (sesuai brief).

---

## 3. Spacing

Skala 4px base (Tailwind default):

| Token | px | Pemakaian |
|---|---|---|
| `space-1` | 4 | Gap icon-text |
| `space-2` | 8 | Padding chip |
| `space-3` | 12 | Card padding compact |
| `space-4` | 16 | Card padding default |
| `space-5` | 20 | Section gap |
| `space-6` | 24 | Page padding mobile |
| `space-8` | 32 | Section margin |
| `space-10` | 40 | Desktop section |

**Card density:** padding minimal `space-4`; jangan `< space-3` untuk card operasional.

---

## 4. Radius

| Token | Value | Pemakaian |
|---|---|---|
| `radius-sm` | 8px (`rounded-lg`) | Input, chip |
| `radius-md` | 12px (`rounded-xl`) | Card, panel |
| `radius-lg` | 16px (`rounded-2xl`) | Modal, hero card |
| `radius-full` | 9999px | Badge, avatar |

---

## 5. Shadow

| Token | Value | Pemakaian |
|---|---|---|
| `shadow-none` | — | Flat table row |
| `shadow-sm` | Tailwind sm | Card default |
| `shadow-soft` | existing `soft` | Elevated card, dropdown |
| `shadow-md` | Tailwind md | Modal |

Hindari shadow berat di dashboard — brief minta "sangat lembut".

---

## 6. Icon usage

- Library: **lucide-react** (existing)
- Mapping menu: `components/icon-map.tsx` (existing)
- Ukuran: 16px inline, 20px nav sidebar, 24px card header, 32px empty state
- Setiap item sidebar: ikon + label (collapse mode: ikon saja + tooltip)

---

## 7. Status colors — mapping domain

### Order status (UI display)

| Internal (`pos-service`) | Label ID UI |
|---|---|
| `open` | Menunggu |
| `held` | Simpan Draft |
| `completed` | Selesai |
| `void` | Dibatalkan |
| `merged` | Digabung |

### Payment status

| Internal | Label ID UI |
|---|---|
| `unpaid` | Belum Dibayar |
| `partial` | Dibayar Sebagian |
| `paid` | Lunas |

### Production / item status

| Internal | Label ID UI |
|---|---|
| `pending` | Menunggu |
| `fired` | Dikirim Dapur |
| `cooking` | Sedang Dibuat |
| `ready` | Siap |
| `served` | Sudah Disajikan |
| `void` | Dibatalkan |

### KDS board column

| Internal | Label ID UI |
|---|---|
| `baru` | Pesanan Baru |
| `diproces` | Sedang Dibuat |
| `siap` | Siap |

Implementasi: `lib/ui-labels.ts` (baru, fase UI-1) — **display only**, tidak ubah enum backend.

---

## 8. Button variants

| Variant | Class basis | Min height | Pemakaian |
|---|---|---|---|
| `primary` | `btn-primary` / navy-800 | 44px tablet | Kirim Pesanan, Bayar, Simpan |
| `secondary` | `btn-secondary` | 44px | Batal, Kembali |
| `ghost` | border transparent | 40px | Nav sekunder |
| `danger` | rose-600 bg | 44px | Void, Batalkan Transaksi |
| `icon` | square 44px | 44px | Qty +/- |

States: `disabled:opacity-60`, loading spinner inline, focus ring existing.

---

## 9. Form components

| Component | Basis existing | Enhancement |
|---|---|---|
| `Input` | `.nf3-input` | Tambah `error`, `hint`, `disabled` props |
| `Select` | `.nf3-select` | Idem |
| `Textarea` | `.nf3-textarea` | Idem |
| `FieldLabel` | `.nf3-field-label` | Wajib `htmlFor` |
| `SearchInput` | baru | Icon search + debounce |
| `FilterTabs` | `.nf3-chip` / `.nf3-chip-active` | Extract component |

---

## 10. Card variants

| Variant | Pemakaian |
|---|---|
| `Card` | Generic `panel` wrapper |
| `StatCard` | KPI dashboard (nilai besar + delta) |
| `OrderCard` | List pesanan |
| `MenuProductCard` | Katalog POS |
| `KDSCard` | Tiket KDS (wrap `KdsOrderCard`) |
| `TableCard` | Meja floor plan |
| `StockAlertCard` | Inventory kritis |

---

## 11. Table variants

| Variant | Pemakaian |
|---|---|
| `DataTable` | Finance ledger, audit log |
| `SimpleTable` | Inventory saldo |
| Responsive: horizontal scroll tablet, sticky header |

---

## 12. Dialog patterns

| Dialog | Trigger | Wajib |
|---|---|---|
| `ConfirmationDialog` | aksi destructive ringan | Ya/Tidak |
| `ApprovalDialog` | approve/reject | catatan opsional |
| `AuditReasonDialog` | void, discount, selisih kas | alasan wajib + PIN bila perlu |
| `ModifierDialog` | tambah menu POS | existing Modal di PosMenuGrid → rename |

Semua dialog: focus trap, ESC close, `aria-labelledby`.

---

## 13. Responsive breakpoints

| Nama | Min width | Perilaku |
|---|---|---|
| `tablet` | 768px | Sidebar → drawer |
| `tablet-lg` | 1024px | POS cart tetap kanan |
| `desktop` | 1366px | Sidebar fixed 240px |
| `wide` | 1536px | Max content 1440px centered |

### POS layout breakpoints

- `≥1024px`: menu 60% + cart 40%
- `768–1023px`: menu full + cart bottom sheet toggle
- `<768px`: banner "gunakan tablet landscape"

### KDS

- `≥1024px landscape`: 3 kolom kanban (existing)
- portrait: 2 kolom + scroll horizontal warning

---

## 14. Loading / empty / error patterns

| State | Component | Contoh copy ID |
|---|---|---|
| Loading page | `LoadingState` | Memuat data… |
| Loading section | `Skeleton` | Card skeleton 3 baris |
| Empty | `EmptyState` | Belum ada pesanan aktif |
| Error | `ErrorState` | Gagal memuat. [Coba lagi] |
| Permission | `PermissionDenied` | Anda tidak memiliki akses ke halaman ini |
| Offline | `ReconnectingBanner` | Koneksi terputus. Mencoba menghubungkan… |
| Success | inline banner + data refresh | Bukan toast saja |

---

## 15. Implementasi token (teknis)

**Fase 1 — tanpa breaking change:**

1. Tambah `lib/design-tokens.ts` — export class name maps
2. Tambah `components/ui/*` primitives yang wrap class existing
3. Dokumentasikan di Storybook optional (bukan wajib fase 1)
4. **Jangan** ganti semua halaman sekaligus — migrate per slice

**File sentuh pertama (UI-1):**

- `app/globals.css` — tambah CSS variables mirror Tailwind
- `components/ui/Button.tsx`, `Card.tsx`, `StatusBadge.tsx` (generalized)
- `components/shell/*` — AppShell baru

---

## 16. Larangan desain

- Jangan salin logo/warna/aset referensi POS kompetitor
- Jangan terlalu banyak warna cerah di dashboard owner
- Jangan hardcode outlet name di UI shell
- Jangan ganti KDS ke light mode tanpa uji dapur
- Jangan tambah font eksternal tanpa kebutuhan
