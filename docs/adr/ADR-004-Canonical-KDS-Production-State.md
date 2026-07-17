# ADR-004: Canonical KDS Production State

## Context

Saat ini ada dua model KDS:

- legacy ticket (`store().kdsTickets`, `lib/kds-service.ts`, persisted ke `nf3.kds_tickets`)
- board model baru (`store().kdsBoardTickets`, `lib/kds-board-service.ts`, bridge ke POS items)

Keduanya bisa mempengaruhi state operasional.

## Current Condition

- UI KDS utama membaca board (`listBoard`).
- Sinkron status item POS dilakukan dari board bridge (`syncPosItemsFromBoard`).
- Legacy tickets masih ada untuk flow tertentu dan persistence lama.

## Decision

Tetapkan **KDS board model sebagai canonical production state writer** untuk phase 0 transisi.  
Legacy tickets dipertahankan sebagai compatibility reader/adapter, bukan authoritative writer.

## Alternatives Considered

1. Jadikan legacy ticket canonical.  
   - Pro: sudah persisted lama.
   - Kontra: tidak align dengan UI operasional terbaru.
2. Biarkan dual writer sementara.  
   - Pro: minim perubahan.
   - Kontra: split-brain state, race, debugging sulit.

## Why This Decision

- Align dengan flow operasional yang sedang dipakai user.
- Mengurangi konflik status antara POS dan KDS.
- Mempermudah standarisasi item production lifecycle.

## Compatibility Impact

- Beberapa fungsi lama perlu adapter agar tidak menulis state authoritative.
- Persistence board perlu strategi durability bertahap.

## Migration Strategy

1. Lock writer path agar hanya board yang authoritative.
2. Legacy path jadi read-only adapter.
3. Tambah reconciliation check board vs POS item status.
4. Rencanakan persistence board canonical ke relational table yang disetujui.

## Rollback Strategy

- Feature flag canonical-writer mode.
- Fallback ke legacy writer jika incident operasional berat (sementara).

## Risks

- Jika durability board belum kuat, status bisa hilang saat restart.
- Adapter salah bisa menyebabkan mismatch readiness order.

## Acceptance Criteria

- Tidak ada dual authoritative write pada status produksi item.
- POS item status konsisten dengan KDS canonical source.
- Discrepancy status tercatat dan dapat direkonsiliasi.
