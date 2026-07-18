# UI Reference Index — Rumah NF3

Referensi struktural (bukan aset visual kompetitor). Warna/brand tetap navy/gold NF3; copy Bahasa Indonesia.

| ID | Sumber | Pola yang diadaptasi | Target NF3 |
|---|---|---|---|
| **REF-001** | DreamsPOS Restaurant POS (`pos.html`) | Layout **2-pane**: katalog/menu kiri + panel order/checkout kanan | `/pos` — `PosShell` + `CartPanel` |
| **REF-006** | DreamsPOS Restaurant POS — Recent Orders + Payment Summary | **Strip order aktif** horizontal; **checkout sticky** dengan **satu CTA Bayar** primer | `PosOrderStrip` / `ActiveOrderStrip`, `PaymentSummary` |

## Aturan adaptasi

1. Ambil **struktur & hierarki aksi**, bukan warna/logo DreamsPOS.
2. Token: `navy-*` + `gold-*` (`tailwind.config.ts` / `DESIGN_SYSTEM_PROPOSAL.md`).
3. Label operasional: Bahasa Indonesia (`lib/ui-labels.ts`).
4. **Jangan ubah business logic** — hanya presentasi & wiring UI.

## Aset

- `dreamspos-pos-reference.png` — tangkapan layout referensi (opsional; demo live: DreamsPOS restaurant POS).
