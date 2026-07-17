# ADR-007: Dual-Write and Reconciliation Policy

## Context

Transisi dari model lama ke canonical source kemungkinan membutuhkan dual-write sementara.  
Saat ini sudah ada pola multi-target persist (in-memory + snapshot + relational), namun belum memiliki policy dual-write yang ketat per domain.

## Current Condition

- Tidak semua write path membawa idempotency key formal.
- Reconciliation query dan mismatch log belum distandardisasi lintas domain.
- Retry/cutover/rollback policy belum terdokumentasi sebagai kontrak.

## Decision

Dual-write **hanya boleh dilakukan** jika mekanisme berikut tersedia:

1. idempotency key
2. source record ID mapping
3. synchronization status
4. reconciliation query
5. mismatch logging
6. retry strategy
7. cutover condition
8. rollback switch

Tanpa 8 komponen ini, dual-write tidak diaktifkan.

## Alternatives Considered

1. Big-bang cutover tanpa dual-write.  
   - Pro: sederhana.
   - Kontra: high blast radius.
2. Dual-write tanpa observability formal.  
   - Pro: cepat mulai.
   - Kontra: mismatch tidak terdeteksi.

## Why This Decision

- Mengurangi risiko silent data corruption saat transisi.
- Membuat cutover/rollback bisa diukur, bukan asumsi.
- Menjamin stabilitas operasional POS/KDS saat refactor backend.

## Compatibility Impact

- Menambah metadata write path (idempotency/source id/status).
- Tidak mengubah UI bisnis pada phase 0.

## Migration Strategy

1. Definisikan schema/log untuk sync status.
2. Instrument write path domain target.
3. Jalankan dual-write terbatas (pilot domain).
4. Monitor mismatch hingga threshold aman.
5. Cutover read path bertahap.

## Rollback Strategy

- Toggle rollback untuk mematikan writer baru.
- Writer lama tetap aktif sampai cutover selesai.
- Reconciliation run pasca rollback.

## Risks

- Overhead performa write path.
- Kompleksitas observability jika instrumentasi tidak disiplin.

## Acceptance Criteria

- Semua dual-write domain punya idempotency + sync status.
- Reconciliation report tersedia dan actionable.
- Cutover dilakukan hanya saat mismatch berada di bawah threshold yang disepakati.
