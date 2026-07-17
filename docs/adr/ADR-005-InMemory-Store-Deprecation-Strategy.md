# ADR-005: In-Memory Store Deprecation Strategy

## Context

`lib/store.ts` saat ini memegang banyak state transaksi runtime (POS, KDS, approvals, finance, inventory) dengan autosave ke disk dan cloud.

Pada environment multi-instance/serverless, in-memory tidak cocok sebagai source of truth permanen.

## Current Condition

Penggunaan store dapat diklasifikasikan menjadi:

- **authoritative state (saat ini, tapi tidak ideal)**: POS orders/items/payments/shifts, approvals runtime.
- **cache**: data yang sudah ada di relasional dan dipull ke memory.
- **temporary workflow state**: cart/session-like transient.
- **development fallback**: saat Supabase path gagal.
- **legacy dependency**: modul lama yang belum dimigrasi read/write ownership.

## Decision

Jalankan **deprecation bertahap**, bukan hapus langsung:

1. tandai fungsi store berdasarkan kategori di atas,
2. pindahkan domain transaksi permanen ke canonical persisted source,
3. store dipertahankan sebagai cache/workflow sementara.

## Alternatives Considered

1. Hapus store sekaligus.  
   - Pro: arsitektur bersih cepat.
   - Kontra: hampir pasti merusak flow operasional.
2. Biarkan store jadi source utama.  
   - Pro: minim usaha.
   - Kontra: data loss/concurrency risk tetap tinggi.

## Why This Decision

- Menjaga zero-downtime untuk operasi kasir/kitchen.
- Menurunkan risiko data loss saat restart.
- Memungkinkan migration modul per modul.

## Compatibility Impact

- Existing service tetap bisa jalan dengan adapter.
- Tambah observability layer untuk mendeteksi mismatch.

## Migration Strategy

1. Buat deprecation map fungsi store (authoritative vs cache).
2. Domain critical write diarahkan ke canonical persisted store.
3. Store update jadi projection/cache.
4. Matikan authoritative writes setelah confidence tinggi.

## Rollback Strategy

- Per-domain feature flag.
- Jika mismatch/latency tinggi, temporary rollback ke mode lama domain tersebut.

## Risks

- Partial migration dapat menambah kompleksitas sementara.
- Cache invalidation bug bisa menampilkan UI stale.

## Acceptance Criteria

- Transaksi permanen tidak bergantung pada in-memory sebagai source final.
- Restart instance tidak menyebabkan kehilangan transaksi permanen.
- Multi-instance tidak menghasilkan state konflik yang tidak terdeteksi.
