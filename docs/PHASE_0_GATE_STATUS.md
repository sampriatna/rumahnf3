# PHASE 0 — Stabilization Gate Status

Dokumen ini adalah checkpoint wajib sebelum masuk Phase 1.

**Status keseluruhan:** Code Complete — **menunggu UAT staging** (lihat `docs/PHASE_0_EXIT_GATE.md`).

## Gate Checklist

| Gate | Status | Evidence | Catatan |
|---|---|---|---|
| Tetapkan sumber data utama untuk setiap domain | Done | `docs/PERSISTENCE_OWNERSHIP_MATRIX.md`, ADR-003/004/005/007 | Ownership matrix + canonical recommendation sudah ditetapkan per domain kritikal. |
| Tetapkan satu identitas outlet | Code Complete | `lib/outlet-identity.ts`, `lib/outlet-identity.test.ts`, `docs/adr/ADR-001-Canonical-Outlet-Identity.md` | Resolver aktif di jalur lib + server actions kritikal. UAT: login/transfer/report per outlet. |
| Tetapkan satu mekanisme authorization backend | Code Complete | `lib/auth-guard.ts`, `lib/api-auth.ts`, semua server actions sensitif, `lib/auth-guard.test.ts`, `lib/api-auth.test.ts` | Flag default OFF. UAT: unauthorized blocked, authorized unchanged. |
| Tetapkan satu sumber status produksi KDS | Code Complete | `lib/kds-service.ts`, `lib/kds-discrepancy.ts`, `lib/kds-service-phase0.test.ts` | Flag default OFF. UAT opsional dengan canonical writer ON. |
| Fondasi audit log aksi sensitif | Code Complete | `lib/audit-log.ts`, instrumentasi lintas domain, `lib/audit-log.test.ts` | Flag default OFF. UAT: event tercatat di cloud-status. |
| Baseline regression guard | Done | `lib/phase0-baseline-characterization.test.ts`, `docs/BASELINE_REGRESSION_CHECKLIST.md` | Characterization test POS/KDS inti. |
| Feature flag + rollback | Code Complete | `lib/phase0-flags.ts`, `lib/dual-write.ts`, `docs/PHASE_0_EXIT_GATE.md` | Dual-write default OFF. Rollback playbook terdokumentasi. |
| **Exit gate UAT staging** | **Pending** | `docs/PHASE_0_EXIT_GATE.md` | Wajib manual UAT + flag rollout bertahap sebelum Phase 1. |

## Automated verification

```bash
npm run test:phase0
```

Test files: outlet-identity, auth-guard, api-auth, audit-log, persistence-mismatch, kds-discrepancy, kds-service-phase0, phase0-baseline-characterization.

## Slice 0.1 — Outlet identity

| Item | Status | Evidence |
|---|---|---|
| Resolver slug/code/uuid | Done | `lib/outlet-identity.ts` |
| Lib layer migration | Done | pos, finance paths, inventory, ops, auth |
| Server actions | Done | `pos-actions`, `form-actions` |
| Unit tests | Done | `lib/outlet-identity.test.ts` |
| Manual UAT | Pending | Exit gate §3 |

## Slice 0.2 — Auth pipeline

| Item | Status | Evidence |
|---|---|---|
| `requireAuthz` / `requireApiAuthz` | Done | `lib/auth-guard.ts`, `lib/api-auth.ts` |
| POS/KDS actions | Done | `app/pos-actions.ts`, `app/kds-actions.ts` |
| Finance/inventory actions | Done | `app/finance-actions.ts`, `app/inventory-actions.ts` |
| Forms/approval actions | Done | `app/form-actions.ts`, `app/approval-actions.ts` |
| API routes | Done | `cloud-status`, `library/upload-image` |
| Contract tests | Done | `lib/auth-guard.test.ts`, `lib/api-auth.test.ts` |
| Manual UAT | Pending | Exit gate §3 |

## Slice 0.4 — KDS canonical state

| Item | Status | Evidence |
|---|---|---|
| Board sebagai canonical writer | Done (flagged) | `lib/kds-service.ts` |
| Legacy writer diblok | Done | `advanceTicket`/`bumpTicket` + `kds-actions` |
| Discrepancy log board vs POS | Done | `lib/kds-discrepancy.ts` |
| POS sync split/merge/move | Done | `lib/pos-service.ts` |
| Diagnostics | Done | `app/api/cloud-status/route.ts` → `kdsDiscrepancy` |
| Tests | Done | `lib/kds-discrepancy.test.ts`, baseline characterization |
| Buat baseline test untuk flow yang sudah bekerja | Done | `docs/BASELINE_REGRESSION_CHECKLIST.md`, `lib/phase0-baseline-characterization.test.ts` | Characterization test inti POS/KDS tersedia sebagai regression guard. |
| Pasang feature flag dan rollback sebelum dual-write | Done | `lib/phase0-flags.ts`, `lib/dual-write.ts`, `lib/persistence-mismatch.ts`, `docs/PHASE_0_EXIT_GATE.md` | Guard dual-write + rollback playbook; default OFF. |

## Slice 0.3 — Persistence mismatch observability

| Item | Status | Evidence |
|---|---|---|
| Compare memory vs relational vs app_state | Done (on-demand) | `lib/persistence-mismatch.ts` |
| Mismatch log ring buffer | Done | `appendMismatchLog()` / `recentMismatchLog()` |
| Diagnostics endpoint | Done | `app/api/cloud-status/route.ts` → `persistenceMismatch` |
| Unit tests | Done | `lib/persistence-mismatch.test.ts` |

## Feature Flags (PHASE 0)

- `NF3_FF_CANONICAL_OUTLET_IDENTITY` (default: `true`)
- `NF3_FF_AUTHORIZATION_PIPELINE` (default: `false`)
- `NF3_FF_KDS_CANONICAL_BOARD_WRITER` (default: `false`)
- `NF3_FF_DUAL_WRITE_ENABLED` (default: `false`)
- `NF3_FF_DUAL_WRITE_STRICT` (default: `false`)
- `NF3_FF_PERSISTENCE_MISMATCH_LOG` / `FF_PERSISTENCE_MISMATCH_LOG_V1` (default: `false`)
- `NF3_FF_AUDIT_LOG_FOUNDATION` / `FF_AUDIT_LOG_FOUNDATION_V1` (default: `false`)

## Slice 0.5 — Audit log foundation

| Item | Status | Evidence |
|---|---|---|
| Event schema + contract validation | Done | `lib/audit-log.ts` |
| Ring buffer in-memory store | Done | `recordAuditEvent()` / `recentAuditLog()` |
| POS: void item/order, discount, shift close | Done | `lib/pos-service.ts`, `lib/pos-integration.ts` |
| Finance: transfer antar dompet | Done | `lib/finance-service.ts` |
| Inventory: stock in, opname, PO receive, transfer | Done | `lib/inventory-service.ts`, `lib/transfer-service.ts` |
| Recipe change | Done | `lib/recipe-service.ts`, `app/library/actions.ts` |
| Approval decision | Done | `app/approval-actions.ts` |
| Diagnostics | Done | `app/api/cloud-status/route.ts` → `auditLog` |
| Unit tests | Done | `lib/audit-log.test.ts` |

## Rollback Posture

- Rollback default untuk dual-write adalah **off** (`NF3_FF_DUAL_WRITE_ENABLED=false`).
- Jika incident: matikan flag domain terkait, kembali ke jalur writer lama (lihat `docs/PHASE_0_EXIT_GATE.md` §5).
- Cutover hanya dilakukan setelah regression checklist dan characterization test lulus.

## Next step

1. Jalankan `npm run test:phase0`
2. Ikuti `docs/PHASE_0_EXIT_GATE.md` + **`docs/PHASE_0_UAT_KBU.md`** untuk UAT staging
3. Update baris **Exit gate UAT staging** ke **Done** setelah sign-off
4. Baru mulai Phase 1
