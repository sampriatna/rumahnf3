# PHASE 0 — Exit Gate Runbook

Dokumen operasional untuk menutup Phase 0 dan membuka Phase 1.

**Prinsip:** semua slice Phase 0 sudah *code-complete* dengan feature flag default OFF (konservatif). Gate ditutup setelah automated checks + manual UAT lulus di staging.

---

## 1. Automated gate (wajib lulus)

Jalankan dari root repo:

```bash
npm run test:phase0
npm run lint
```

Opsional (jika env staging tersedia):

```bash
npm run verify:deploy -- --skip-build
npm run verify:deploy -- --prod https://rumah.nf3.company --skip-build
```

**Pass criteria:**
- Semua test Phase 0 hijau
- Lint tanpa error baru
- `/api/cloud-status` merespons (dengan `CRON_SECRET` bila `NF3_FF_AUTHORIZATION_PIPELINE=true`)

---

## 2. Flag rollout staging (bertahap)

Urutan disarankan — aktifkan satu per satu, smoke test, baru lanjut:

| Urutan | Flag | Default | Staging | Tujuan verifikasi |
|---|---|---|---|---|
| 1 | `NF3_FF_CANONICAL_OUTLET_IDENTITY` | `true` | tetap `true` | Order number, transfer, report filter outlet konsisten |
| 2 | `NF3_FF_AUDIT_LOG_FOUNDATION` | `false` | `true` | Aksi sensitif menghasilkan event di `cloud-status.auditLog` |
| 3 | `NF3_FF_PERSISTENCE_MISMATCH_LOG` | `false` | `true` | `cloud-status.persistenceMismatch` tidak error; mismatch = 0 atau terdokumentasi |
| 4 | `NF3_FF_AUTHORIZATION_PIPELINE` | `false` | `true` | Unauthorized redirect/403; flow authorized tidak berubah |
| 5 | `NF3_FF_KDS_CANONICAL_BOARD_WRITER` | `false` | `true` (opsional) | KDS board sync POS; legacy advance/bump diblok; discrepancy log kosong/minimal |

**Jangan aktifkan di produksi tanpa UAT:**
- `NF3_FF_DUAL_WRITE_ENABLED`
- `NF3_FF_DUAL_WRITE_STRICT`

---

## 3. Manual UAT checklist

Checklist per-outlet (KBU pilot): **`docs/PHASE_0_UAT_KBU.md`**

Ringkasan minimal — gunakan `docs/BASELINE_REGRESSION_CHECKLIST.md` untuk referensi flow:

### Auth & scope
- [ ] Login owner → dashboard owner
- [ ] Login kasir PIN outlet KBU → POS outlet benar
- [ ] Leader outlet A tidak bisa approve request outlet B (dengan flag auth ON)

### POS core (outlet KBU)
- [ ] Buka shift
- [ ] Order dine-in + takeaway
- [ ] Tambah ke open bill
- [ ] Partial payment → full payment → order completed
- [ ] Split bill + merge bill + move table
- [ ] Tutup shift → setoran submission terbentuk

### KDS
- [ ] Kirim item ke dapur → muncul di board
- [ ] Proses → siap → selesai
- [ ] Status POS sinkron (cooking/ready)

### Sensitif + audit (flag audit ON)
- [ ] Void item (PIN leader) → event `pos.void_item` di cloud-status
- [ ] Void order lunas → event `pos.void_order`
- [ ] Diskon manual → event `pos.discount`
- [ ] Transfer antar dompet → event `finance.transfer`
- [ ] Stock in manual → event `inventory.stock_in`
- [ ] Approval decision → event `approval.decision`

### Rollback drill
- [ ] Matikan flag yang baru diaktifkan → flow baseline tetap jalan
- [ ] Tidak ada error 500 pada action kritikal

---

## 4. Sign-off criteria

Phase 0 **PASS** bila semua terpenuhi:

1. Automated `test:phase0` lulus
2. Manual UAT minimal (§3) lulus di staging
3. Tidak ada regresi blocker pada POS/KDS/payment/shift close
4. Feature flag rollback teruji (matikan → normal)
5. `docs/PHASE_0_GATE_STATUS.md` di-update ke **Gate Ready**

Setelah sign-off, tim boleh mulai Phase 1 (fitur bisnis baru) dengan guardrail dual-write tetap OFF sampai ada approval terpisah.

---

## 5. Rollback playbook (incident)

| Gejala | Aksi |
|---|---|
| 401/403 berlebihan setelah deploy | `NF3_FF_AUTHORIZATION_PIPELINE=false` |
| KDS status tidak sinkron | `NF3_FF_KDS_CANONICAL_BOARD_WRITER=false` |
| Audit memperlambat transaksi | `NF3_FF_AUDIT_LOG_FOUNDATION=false` |
| Mismatch log noise / timeout | `NF3_FF_PERSISTENCE_MISMATCH_LOG=false` |
| Dual-write error | `NF3_FF_DUAL_WRITE_ENABLED=false` (default) |

Redeploy/restart setelah ubah env. Tidak perlu migration rollback.

---

## 6. Artefak evidence

Simpan saat UAT:
- Screenshot/timestamp hasil `cloud-status` (auditLog, persistenceMismatch, kdsDiscrepancy)
- Catatan tester + outlet + tanggal
- Daftar flag aktif di staging saat UAT
