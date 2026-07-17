# ADR-001: Canonical Outlet Identity

## Context

Sistem saat ini memakai tiga representasi outlet:

- slug app (`kbu`, `kisamen`, `samtaro`) di `lib/mock-data.ts` dan banyak page/service.
- code lokasi inventory (`KBU`, `KSM`, `SMT`, `GDG`) di `nf3.master_lokasi`.
- UUID outlet/area di `supabase/schema.sql` (`nf3.outlets`, `nf3.areas`) yang belum jadi jalur aktif utama.

## Current Condition

- Resolver mapping dilakukan manual di beberapa tempat (`outletIdToLokasi`).
- Tidak ada registry identity tunggal yang dipakai lintas domain.
- Join/filter lintas inventory/POS/report berisiko mismatch.

## Decision

Gunakan **UUID outlet sebagai canonical internal identity** untuk target architecture.  
Pada phase transisi, sediakan **compatibility resolver** yang memetakan:

- UUID <-> slug
- UUID <-> code lokasi

tanpa mengganti seluruh code sekaligus.

## Alternatives Considered

1. Menjadikan slug sebagai canonical permanen.  
   - Pro: minim perubahan jangka pendek.
   - Kontra: lemah untuk relasi DB, sulit scaling multi-company.
2. Menjadikan code lokasi inventory sebagai canonical.  
   - Pro: cocok inventory lama.
   - Kontra: tidak cocok domain non-inventory.

## Why This Decision

- UUID paling aman untuk integritas relasi DB.
- Slug/code tetap dibutuhkan sebagai business/external identifier.
- Cocok untuk incremental refactor tanpa rewrite.

## Compatibility Impact

- Existing flow tetap jalan jika resolver compatibility disiapkan.
- Query lama berbasis slug/code tetap bisa dipertahankan sementara.

## Migration Strategy

1. Tambah outlet registry mapping (tanpa drop tabel lama).
2. Update read path penting agar lewat resolver.
3. Tambah telemetry mismatch mapping.
4. Cutover write path domain inti bertahap.

## Rollback Strategy

- Feature flag untuk resolver baru.
- Fallback ke mapping lama bila mismatch tinggi.

## Risks

- Mapping salah dapat menyebabkan cross-outlet data leak.
- Domain lama yang hardcoded slug bisa luput.

## Acceptance Criteria

- Satu fungsi resolver outlet identity dipakai lintas service layer.
- Semua transaksi baru menyimpan referensi outlet yang bisa ditrace ke UUID canonical.
- Mismatch mapping tercatat dan bisa diobservasi.
