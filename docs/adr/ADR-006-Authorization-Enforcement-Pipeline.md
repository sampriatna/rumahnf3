# ADR-006: Authorization Enforcement Pipeline

## Context

Authorization saat ini tersebar:

- guard di page/action per file,
- helper `lib/data-scope.ts`,
- helper `lib/auth-guard.ts` belum menjadi jalur tunggal,
- RLS ada, tetapi server write banyak lewat service-role (`supabaseAdmin()`).

## Current Condition

- Frontend visibility sering berperan besar untuk UX, tapi bukan security boundary.
- Tidak semua server action melewati pipeline guard konsisten.
- Potensi bypass jika satu action lupa check outlet/permission/entity.

## Decision

Bangun satu pipeline authorization backend standar (nama final mengikuti style repo), secara konseptual:

1. `requireSession()`
2. `requirePermission()` / role gate
3. `requireOutletAccess()`
4. `requireEntityAccess()`
5. `requireSensitiveActionApproval()`

Pipeline ini wajib dipakai di:

- server action,
- route handler,
- service entry point kritikal,
- dan didukung DB policy jika memungkinkan.

## Alternatives Considered

1. Tetap ad hoc guard per file.  
   - Pro: cepat.
   - Kontra: inconsistent, rawan miss.
2. Mengandalkan RLS saja.  
   - Pro: DB-level kuat.
   - Kontra: service-role bypass membuat ini tidak cukup.

## Why This Decision

- Menurunkan attack surface akibat guard yang tidak seragam.
- Memudahkan review security dan audit perubahan.
- Membuka jalan policy-as-code yang bisa dites.

## Compatibility Impact

- Banyak action perlu refactor ringan untuk pakai wrapper guard.
- UI tidak wajib berubah pada phase 0.

## Migration Strategy

1. Definisikan auth context canonical.
2. Implement pipeline helper.
3. Migrate actions bertahap berdasarkan criticality.
4. Tambah contract tests unauthorized scenarios.

## Rollback Strategy

- Feature flag per module untuk pipeline baru.
- Jika ada false-deny, rollback ke guard lama sementara.

## Risks

- Salah mapping permission bisa memblokir operasi.
- Refactor guard massal tanpa staging bisa mengganggu layanan.

## Acceptance Criteria

- Semua endpoint/action kritikal melewati pipeline yang sama.
- Unauthorized access via URL/API ditolak konsisten.
- Sensitive actions membutuhkan approval/audit sesuai policy.
