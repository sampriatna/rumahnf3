# ADR-003: Canonical POS Order Persistence

## Context

POS flow aktif berjalan stabil pada `lib/pos-service.ts` dengan runtime in-memory store (`store().posOrders`) dan sinkronisasi ke `nf3.pos_orders` (JSONB items/payments) via repo/cloud persist.

Terdapat desain normalized POS lain di SQL (`pos-kds.sql`), namun belum menjadi jalur aktif.

## Current Condition

- Writer utama operasional: in-memory.
- Persisted representation: `nf3.pos_orders` JSONB.
- Read banyak route/page masih dari in-memory.
- Restart/concurrency berisiko bila in-memory dianggap authoritative.

## Decision

Untuk phase 0, tetapkan **`nf3.pos_orders` sebagai canonical persistence source** (stability-first), dengan in-memory sebagai cache/working state.

Normalisasi penuh `orders/order_items/payments` **ditunda** sampai phase setelah stabilization gate.

## Alternatives Considered

1. Langsung normalisasi penuh POS sekarang.  
   - Pro: desain data ideal.
   - Kontra: risiko tinggi merusak flow kasir aktif.
2. Tetap jadikan in-memory authoritative.  
   - Pro: minim perubahan immediate.
   - Kontra: restart/concurrency risk tetap tinggi.

## Why This Decision

- Menjaga flow kasir tetap berjalan.
- Menurunkan risiko data loss saat restart instance.
- Membuka jalur gradual dual-write terkontrol ke model normalized nanti.

## Compatibility Impact

- Action/service existing tetap dipertahankan.
- Perlu adapter read/write ordering agar persisted source dianggap utama.

## Migration Strategy

1. Tandai ownership: transaction record canonical di `pos_orders`.
2. Tambah observability mismatch store vs DB.
3. Tambah idempotent write policy.
4. Setelah stabil, baru introduce normalized shadow write.

## Rollback Strategy

- Feature flag untuk read-preference canonical DB.
- Jika issue, fallback read sementara ke cache in-memory dengan reconciliation.

## Risks

- Jika write ordering tidak atomic, mismatch tetap mungkin.
- JSONB complex query/report jadi terbatas jangka panjang.

## Acceptance Criteria

- Transaksi POS permanen dapat direcover dari DB tanpa ketergantungan disk lokal.
- Restart instance tidak kehilangan order tersimpan.
- Reconciliation mismatch rate terukur dan menurun.
