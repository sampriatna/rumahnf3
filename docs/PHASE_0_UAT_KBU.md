# PHASE 0 — UAT Staging (Outlet KBU)

Checklist operasional untuk menutup exit gate Phase 0. **Outlet pilot: KBU** (`kbu` / code `KBU`).

Gunakan bersama `docs/PHASE_0_EXIT_GATE.md`. Centang tiap item; simpan evidence di §7.

---

## 0. Prasyarat

| Item | Nilai |
|---|---|
| Environment | Staging / pre-prod (bukan traffic live puncak) |
| Outlet | KBU — Kopi Buri Umah |
| Register | `reg-kbu-main` (atau register aktif di settings POS) |
| Tester POS | Akun kasir + PIN leader KBU |
| Tester approval | Leader/owner KBU |
| Base URL | `NEXT_PUBLIC_APP_URL` staging (contoh: `https://rumah.nf3.company`) |
| POS URL | `NEXT_PUBLIC_POS_URL` (contoh: `https://pos.nf3.company`) |
| KDS URL | `NEXT_PUBLIC_KDS_URL` (contoh: `https://kds.nf3.company`) |

**Sebelum mulai:**
```bash
npm run test:phase0
```

---

## 1. Env staging — Phase 0 flags

Salin blok ini ke env staging (Vercel / `.env.local` staging). **Jangan commit secret.**

### Tahap A — observability only (aman, mulai di sini)

```env
# Sudah default true di kode; tetap set eksplisit di staging
NF3_FF_CANONICAL_OUTLET_IDENTITY=true

# Observability — tidak mengubah rule bisnis
NF3_FF_AUDIT_LOG_FOUNDATION=true
NF3_FF_PERSISTENCE_MISMATCH_LOG=true

# Tetap OFF sampai Tahap B lulus
NF3_FF_AUTHORIZATION_PIPELINE=false
NF3_FF_KDS_CANONICAL_BOARD_WRITER=false
NF3_FF_DUAL_WRITE_ENABLED=false
NF3_FF_DUAL_WRITE_STRICT=false

# Wajib untuk /api/cloud-status saat auth pipeline ON nanti
CRON_SECRET=<string-acak-panjang>
```

Redeploy → smoke: buka `/pos?outlet=kbu`, pastikan tidak 500.

### Tahap B — setelah Tahap A lulus

```env
NF3_FF_AUTHORIZATION_PIPELINE=true
```

Uji unauthorized (staff outlet lain, role salah) harus redirect/403; flow kasir KBU normal.

### Tahap C — opsional setelah POS+KDS stabil

```env
NF3_FF_KDS_CANONICAL_BOARD_WRITER=true
```

Verifikasi `cloud-status.kdsDiscrepancy` — discrepancies minimal/kosong setelah flow KDS penuh.

### Verifikasi cloud-status

```bash
curl -s -H "Authorization: Bearer $CRON_SECRET" \
  https://rumah.nf3.company/api/cloud-status | jq '.auditLog,.persistenceMismatch,.kdsDiscrepancy'
```

Atau: `npm run verify:deploy -- --prod https://rumah.nf3.company --skip-build`

---

## 2. UAT — Auth & scope (KBU)

| # | Langkah | Expected | OK | Catatan |
|---|---|---|---|---|
| A1 | Login owner (`/login`) | Dashboard owner, bukan POS | [ ] | |
| A2 | Login kasir KBU (`/pos/login` + PIN) | Masuk POS outlet KBU | [ ] | |
| A3 | Kasir KBU coba URL `?outlet=kisamen` | Ditolak / redirect (Tahap B) | [ ] | Hanya jika auth ON |
| A4 | Leader KBU approve request KBU | Sukses | [ ] | |
| A5 | Leader KBU approve request outlet lain | Ditolak (Tahap B) | [ ] | |

---

## 3. UAT — POS core KBU

| # | Langkah | Expected | OK | Catatan |
|---|---|---|---|---|
| P1 | Buka shift (register KBU, float) | Shift status open | [ ] | |
| P2 | Order dine-in meja M1, 2 item | Order open, total benar | [ ] | |
| P3 | Order takeaway, 1 item | Channel takeaway, tanpa meja wajib | [ ] | |
| P4 | Tambah item ke open bill M1 | Satu bill, item bertambah | [ ] | |
| P5 | Partial payment cash | `paymentStatus=partial` | [ ] | |
| P6 | Bayar sisa → lunas | Order completed, paid | [ ] | |
| P7 | Split bill (2 line) | 2 order open, qty benar | [ ] | |
| P8 | Merge 2 open bill | Satu bill gabungan | [ ] | |
| P9 | Move table M1 → M2 | `tableLabel` berubah | [ ] | |
| P10 | Tutup shift | Shift closed + setoran submission | [ ] | |

**Order number check (outlet identity):** format `KBU-YYYYMMDD-###` — catat contoh: _______________

---

## 4. UAT — KDS KBU

| # | Langkah | Expected | OK | Catatan |
|---|---|---|---|---|
| K1 | Fire item ke dapur dari POS | Ticket muncul di KDS board | [ ] | |
| K2 | Proses → Siap di KDS | Kolom status berubah | [ ] | |
| K3 | Cek checkout POS | Item status cooking/ready | [ ] | |
| K4 | Selesai station | Item hilang dari board aktif | [ ] | |

*Tahap C only:* legacy bump/advance manual harus diblok — hanya flow board.

---

## 5. UAT — Aksi sensitif + audit (Tahap A)

Lakukan setelah `NF3_FF_AUDIT_LOG_FOUNDATION=true`. Cek `cloud-status.auditLog.recent`.

| # | Aksi | Action key | OK | Event ID |
|---|---|---|---|---|
| S1 | Void 1 item (PIN leader, alasan) | `pos.void_item` | [ ] | |
| S2 | Void order lunas (restock off) | `pos.void_order` | [ ] | |
| S3 | Diskon manual order | `pos.discount` | [ ] | |
| S4 | Tutup shift (jika belum di P10) | `pos.shift_close` | [ ] | |
| S5 | Transfer antar dompet (finance) | `finance.transfer` | [ ] | |
| S6 | Stock in manual (inventory) | `inventory.stock_in` | [ ] | |
| S7 | Approve/reject request KBU | `approval.decision` | [ ] | |

---

## 6. Rollback drill

| # | Langkah | Expected | OK |
|---|---|---|---|
| R1 | Matikan semua `NF3_FF_*` ke `false` (kecuali identity) | Redeploy | [ ] |
| R2 | Ulangi P2 + P6 + K1 | Flow normal, no 500 | [ ] |
| R3 | Nyalakan kembali Tahap A flags | Audit/mismatch aktif lagi | [ ] |

---

## 7. Evidence log (isi saat UAT)

| Field | Nilai |
|---|---|
| Tanggal | |
| Tester | |
| Build / deploy ID | |
| URL staging | |
| Flags aktif | |
| `test:phase0` | pass / fail |
| Screenshot cloud-status | path / link |
| Blocker ditemukan | tidak / deskripsi |
| Sign-off | pending / approved |

---

## 8. Sign-off

UAT KBU **PASS** jika:
- §3 minimal P1–P6, P10 lulus
- §4 K1–K3 lulus
- §5 minimal S1, S7 lulus (audit ON)
- §6 rollback lulus
- Tidak ada blocker POS payment / shift close / KDS sync

Setelah PASS → update `docs/PHASE_0_GATE_STATUS.md` baris **Exit gate UAT staging** ke **Done**, lalu boleh mulai Phase 1.
