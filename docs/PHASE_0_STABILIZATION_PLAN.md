# PHASE 0 — STABILIZATION GATE PLAN

Tujuan phase ini: mengamankan aplikasi berjalan dan menetapkan source-of-truth ownership sebelum refactor fitur phase 1.

## Guardrail Phase 0

- Tidak rewrite framework.
- Tidak migration eksekusi tanpa approval.
- Tidak menambah fitur bisnis baru.
- Tidak mengubah flow kasir existing secara fungsional.
- Fokus pada identity, authorization, observability, canonical writer decision.

---

## Slice 0.1 — Canonical outlet identity registry + compatibility resolver

### Objective

Menyediakan resolver outlet identity tunggal (UUID/slug/code) tanpa memutus flow existing.

### Exact files affected (planned)

- `lib/data-scope.ts`
- `lib/mock-data.ts`
- `lib/inventory-sheets-writer.ts`
- `lib/inventory-overview.ts`
- `lib/transfer-service.ts`
- `lib/reports.ts`
- `app/pos-actions.ts`
- `app/form-actions.ts`
- `app/inventory/transfers/page.tsx`
- `app/dashboard/page.tsx`

### Database impact

- Additive only (opsional): table/view mapping registry outlet (tanpa drop/rename tabel lama).

### Backward compatibility impact

- Slug/code lama tetap diterima melalui resolver.

### Feature flag

- `FF_OUTLET_IDENTITY_RESOLVER_V1`

### Migration strategy

1. Introduce resolver read-only.
2. Replace hardcoded mapping calls bertahap.
3. Enable mismatch logging.

### Rollback strategy

- Disable feature flag, kembali ke mapping lama.

### Automated tests

- Unit tests untuk resolver (slug/code/uuid roundtrip).

### Manual tests

- Login dan akses menu tiap outlet.
- Buat order per outlet.
- Transfer gudang ke outlet.
- Report filter outlet.

### Acceptance criteria

- Semua modul kritikal memakai resolver yang sama.
- Tidak ada mismatch outlet identity pada flow baseline.

### Stop condition

- Jika ditemukan outlet mismatch di flow kasir/kds produksi.

---

## Slice 0.2 — Canonical session/auth context + outlet access guard

### Objective

Menyatukan pipeline authz backend agar guard tidak ad hoc.

### Exact files affected (planned)

- `lib/session.ts`
- `lib/session-token.ts`
- `lib/auth-service.ts`
- `lib/auth-guard.ts`
- `lib/data-scope.ts`
- `app/pos-actions.ts`
- `app/inventory-actions.ts`
- `app/approval-actions.ts`
- `app/finance-actions.ts`
- `app/api/auth/*/route.ts`

### Database impact

- Tidak wajib schema change pada tahap awal.

### Backward compatibility impact

- Session cookie format tetap kompatibel; context builder additive.

### Feature flag

- `FF_AUTHZ_PIPELINE_V1`

### Migration strategy

1. Build canonical auth context helper.
2. Migrate critical actions ke pipeline.
3. Keep fallback guard lama sementara.

### Rollback strategy

- Toggle flag off, fallback ke guard lama per module.

### Automated tests

- Unauthorized/forbidden matrix tests per role-outlet.

### Manual tests

- Owner access global.
- Leader/staff blocked cross-outlet.
- Sensitive action denied tanpa approval.

### Acceptance criteria

- Server actions kritikal menggunakan pipeline guard seragam.
- Akses URL/API langsung tanpa hak -> consistently denied.

### Stop condition

- Jika false-deny memblokir flow baseline kasir.

---

## Slice 0.3 — Persistence ownership observability + mismatch logging

### Objective

Membuat visibilitas mismatch source (in-memory vs relational/snapshot) sebelum dual-write lanjut.

### Exact files affected (planned)

- `lib/store.ts`
- `lib/cloud-persist.ts`
- `lib/db/pos-repo.ts`
- `lib/db/inventory-repo.ts`
- `lib/db/finance-repo.ts`
- `app/api/cloud-status/route.ts`
- `lib/prod-readiness.ts`
- `scripts/verify-deploy.mjs`

### Database impact

- Opsional additive: table mismatch log atau append ke existing diagnostics.

### Backward compatibility impact

- Tidak mengubah business flow; observability only.

### Feature flag

- `FF_PERSISTENCE_MISMATCH_LOG_V1`

### Migration strategy

1. Instrument compare points.
2. Emit mismatch logs terstruktur.
3. Add reconciliation query docs/runbook.

### Rollback strategy

- Disable mismatch logging instrumentation.

### Automated tests

- Unit test payload mismatch serializer.

### Manual tests

- Simulasi restart + verifikasi data POS/finance/approval tetap konsisten.

### Acceptance criteria

- Mismatch rate terukur dan terlihat di diagnostics.
- Tidak ada performance degradation signifikan.

### Stop condition

- Jika instrumentation menambah latensi kritikal pada checkout.

---

## Slice 0.4 — KDS canonical state decision + compatibility adapter

### Objective

Menetapkan satu canonical writer untuk production item status.

### Exact files affected (planned)

- `lib/kds-board-service.ts`
- `lib/kds-pos-bridge.ts`
- `lib/kds-service.ts`
- `app/kds-actions.ts`
- `app/pos-actions.ts`
- `app/kds/page.tsx`
- `lib/store.ts`
- `lib/db/pos-repo.ts`

### Database impact

- Pada phase 0 bisa tanpa schema change; fokus writer ownership + adapter.

### Backward compatibility impact

- Legacy ticket path tetap ada sebagai compatibility reader.

### Feature flag

- `FF_KDS_CANONICAL_BOARD_WRITER_V1`

### Migration strategy

1. Mark board as canonical write path.
2. Disable legacy authoritative writes.
3. Keep adapter read for legacy dependencies.
4. Log discrepancy board vs POS items.

### Rollback strategy

- Switch flag kembali ke mode lama sementara.

### Automated tests

- Characterization tests status sync POS<->KDS.

### Manual tests

- Send item kitchen/bar, proses siap, cek status di POS.
- Verifikasi tidak ada status split-brain.

### Acceptance criteria

- Hanya satu path writer authoritative.
- Status item POS konsisten dengan KDS canonical state.

### Stop condition

- Jika status item di POS tidak mengikuti KDS pada baseline flow.

---

## Slice 0.5 — Audit log foundation untuk aksi sensitif

### Objective

Menyediakan fondasi audit event yang konsisten tanpa mengubah rule bisnis.

### Exact files affected (planned)

- `app/pos-actions.ts`
- `app/finance-actions.ts`
- `app/inventory-actions.ts`
- `app/approval-actions.ts`
- `lib/pos-service.ts`
- `lib/finance-service.ts`
- `lib/transfer-service.ts`
- `lib/db/*-repo.ts` (jika menulis audit table)
- `supabase/*` (DDL additive, setelah approval)

### Database impact

- Additive `audit_logs` table (jika disetujui), tanpa ubah tabel lama.

### Backward compatibility impact

- Tidak mengubah output UI utama; hanya menambah logging side-effect.

### Feature flag

- `FF_AUDIT_LOG_FOUNDATION_V1`

### Migration strategy

1. Define event schema.
2. Instrument sensitive actions:
   - void/refund/discount/stock adjustment/shift reopen/recipe change.
3. Verify before/after payload safety.

### Rollback strategy

- Disable audit write; actions tetap berjalan.

### Automated tests

- Event payload contract tests.

### Manual tests

- Lakukan aksi sensitif dan verifikasi audit event tercatat lengkap.

### Acceptance criteria

- Semua aksi sensitif baseline menghasilkan audit event minimal.
- Event menyimpan actor/action/entity/entity_id/reason/outlet/timestamp.

### Stop condition

- Jika audit write menghambat transaksi kritikal (timeout/lock).

---

## Sequence eksekusi yang direkomendasikan

1. Slice 0.1
2. Slice 0.2
3. Slice 0.3
4. Slice 0.4
5. Slice 0.5

## Exit criteria Phase 0

- Source-of-truth ownership sudah terdokumentasi dan dipakai.
- Authorization pipeline backend konsisten pada jalur kritikal.
- Canonical writer KDS diputuskan dan diuji.
- Mismatch observability aktif.
- Baseline flow kasir/kds tidak regresi.
