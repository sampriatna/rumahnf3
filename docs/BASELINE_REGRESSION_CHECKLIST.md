# BASELINE REGRESSION CHECKLIST

Tujuan: mengunci flow yang **sudah berjalan** agar tidak rusak selama PHASE 0.

## Catatan umum

- **Fakta**: sebagian besar flow dijalankan lewat `app/pos-actions.ts` dan business logic `lib/pos-service.ts`.
- **Fakta**: KDS UI aktif memakai board model (`app/kds/page.tsx`, `lib/kds-board-service.ts`) dengan bridge ke POS (`lib/kds-pos-bridge.ts`).
- **Fakta**: test otomatis saat ini dominan utility-level; belum ada end-to-end UI flow penuh.

---

## Checklist per flow

| Flow | Actor | Precondition | Steps | Expected Database/State Change | Expected UI Result | Failure Indicators | Current Automated Test Coverage | Manual Test Requirement |
|---|---|---|---|---|---|---|---|---|
| Login owner | Owner | akun owner aktif di `auth_accounts` | login via `/api/auth/login-email` | session cookie `nf3_session` ter-set, context role owner | redirect ke dashboard owner | login loop, role salah, dashboard bukan owner | Tidak ada direct test | Wajib manual |
| Login kasir outlet | Cashier tablet | PIN kasir outlet valid (`outlet_cashier_pins`) | login via `/api/auth/login-pos` | session role staff + capability pos + outlet terisi | masuk POS outlet terpilih | outlet salah, tidak bisa akses POS | Tidak ada direct test | Wajib manual |
| Buka shift | Cashier | belum ada shift status open untuk outlet | submit `openShiftAction` | `pos_shifts` tambah record status open; cart shift init | POS tampil mode shift aktif | muncul “shift masih terbuka” saat seharusnya tidak | Coverage parsial fungsi `openShift` via unit domain implicit | Wajib manual |
| Buat order dine-in | Cashier | shift open, channel dine_in, meja tersedia | add item -> create order | `pos_orders` bertambah; order status open; item status pending | order muncul di checkout/floor | order gagal terbentuk, total salah | Tidak ada end-to-end test | Wajib manual |
| Buat order takeaway | Cashier | shift open, channel takeaway | add item -> create order | `pos_orders` bertambah channel takeaway | checkout menampilkan takeaway tanpa meja | order salah channel / wajib meja | Tidak ada end-to-end test | Wajib manual |
| Tambah order ke meja | Cashier | ada open bill dine-in meja X | tambah cart -> add to open bill | item baru ditambahkan ke order existing | satu bill meja terupdate | malah membuat order baru | Tidak ada end-to-end test | Wajib manual |
| Move table | Cashier/Leader | order open dine-in | move table action | `tableLabel` order berubah | floor/checkout tampil meja baru | meja tidak berubah / order hilang | Tidak ada end-to-end test | Wajib manual |
| Split bill | Cashier | order open, item > 1 line/qty | split action dengan selected line | source order qty/line berkurang; target order baru open dibuat | tampil dua bill berbeda | nominal line mismatch, line hilang | Tidak ada end-to-end test | Wajib manual |
| Merge bill | Cashier/Leader | open bill mode outlet, >=2 order open | merge action | source orders status merged, target order line gabung | satu bill gabungan tampil | duplikasi line/total tidak sinkron | Tidak ada end-to-end test | Wajib manual |
| Partial payment | Cashier | order open dengan outstanding > 0 | add payment nominal parsial | payment line bertambah; payment status partial | UI outstanding berkurang, belum complete | order malah complete / outstanding tidak berubah | Tidak ada end-to-end test | Wajib manual |
| Full payment | Cashier | order open/partial dengan sisa > 0 | add payment hingga lunas | payment status paid, order status complete, integrasi ledger dipicu | UI menandai lunas/completed | status tidak complete, ledger tidak tercatat | Coverage unit payment logic parsial saja | Wajib manual |
| Kirim item ke dapur/bar | Cashier | order berisi item pending | send to kitchen action | item pending -> fired; KDS ticket/board terbuat | item muncul di KDS station tepat | item tidak muncul / routing salah station | Ada test bridge KDS parsial (`kds-pos-bridge.test.ts`) | Wajib manual |
| Update status KDS | Kitchen/Bar | ticket board tersedia | proses -> siap -> selesai station | `kdsBoardTickets` dan item status order terupdate via bridge | KDS kolom status berubah sesuai aksi | status stuck, badge count tidak sinkron | Ada test utility KDS parsial | Wajib manual |
| Sinkron status KDS ke POS | Cashier/Checker | KDS item diproses/siap | refresh checkout/order detail | item status di order berubah (`cooking/ready/served`) | POS menampilkan progres item aktual | POS tetap pending walau KDS siap | Test bridge parsial | Wajib manual |
| Tutup shift | Cashier + approver | shift open, ada transaksi | close shift action + input fisik | shift status closed; setoran submission + approval record dibuat | halaman close sukses + ringkasan shift | shift tak tertutup / setoran tak terbentuk | Tidak ada end-to-end test | Wajib manual |

---

## Characterization test status

### Implemented (Phase 0)

| Test file | Coverage |
|---|---|
| `lib/phase0-baseline-characterization.test.ts` | open bill, split, merge, move table, payment, KDS fire + board proses/siap |
| `lib/kds-pos-bridge.test.ts` | bridge status sync (utility) |
| `lib/kds-service-phase0.test.ts` | canonical board writer flag behavior |
| `lib/outlet-identity.test.ts` | slug/code/uuid resolver |
| `lib/auth-guard.test.ts` / `lib/api-auth.test.ts` | authorization contract |
| `lib/audit-log.test.ts` | audit event payload contract |
| `lib/persistence-mismatch.test.ts` | mismatch compare logic |
| `lib/kds-discrepancy.test.ts` | board vs POS discrepancy detection |

Jalankan semua: `npm run test:phase0`

### Belum ada (tetap manual UAT)

- Login owner / login kasir PIN (e2e)
- Channel takeaway UI flow
- Tutup shift end-to-end dengan approval UI
- Full payment → ledger integration assertion

### Rekomendasi

- Manual UAT tetap gate utama sampai e2e harness siap (lihat `docs/PHASE_0_EXIT_GATE.md`).
