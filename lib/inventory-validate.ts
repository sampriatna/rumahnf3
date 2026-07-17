import type {
  MasterBahan,
  BarangMasuk,
  TransferStok,
  PemakaianOutlet,
  WasteSelisih
} from "@/types/inventory";

export type ValidationResult = { ok: true } | { ok: false; message: string };

function bahanMap(bahan: MasterBahan[]): Map<string, MasterBahan> {
  return new Map(bahan.map((b) => [b.kodeBahan, b]));
}

function rejectKodeBahan(kode: string, map: Map<string, MasterBahan>): ValidationResult {
  if (!kode?.trim()) return { ok: false, message: "kodeBahan wajib diisi." };
  if (!map.has(kode)) {
    return { ok: false, message: `kodeBahan "${kode}" tidak ada di MasterBahan.` };
  }
  return { ok: true };
}

function rejectQty(qty: number): ValidationResult {
  if (qty <= 0 || Number.isNaN(qty)) {
    return { ok: false, message: "qty harus lebih dari 0." };
  }
  return { ok: true };
}

/** Validasi barang masuk — lokasiTujuan wajib, kodeBahan valid, qty > 0. */
export function validateBarangMasuk(row: BarangMasuk, bahan: MasterBahan[]): ValidationResult {
  const map = bahanMap(bahan);
  const q = rejectQty(row.qty);
  if (!q.ok) return q;
  const k = rejectKodeBahan(row.kodeBahan, map);
  if (!k.ok) return k;
  if (!row.lokasiTujuan?.trim()) {
    return {
      ok: false,
      message: `Barang masuk ${row.kodeBahan}: lokasiTujuan kosong — REJECT (isi GDG/KBU/KSM/SMT).`
    };
  }
  return { ok: true };
}

/** Validasi transfer — lokasi beda, kode valid, qty > 0. */
export function validateTransferStok(row: TransferStok, bahan: MasterBahan[]): ValidationResult {
  const map = bahanMap(bahan);
  const q = rejectQty(row.qty);
  if (!q.ok) return q;
  const k = rejectKodeBahan(row.kodeBahan, map);
  if (!k.ok) return k;
  if (row.dariLokasi === row.keLokasi) {
    return { ok: false, message: "Transfer: dariLokasi dan keLokasi tidak boleh sama." };
  }
  if (!row.dariLokasi?.trim() || !row.keLokasi?.trim()) {
    return { ok: false, message: "Transfer: dariLokasi dan keLokasi wajib diisi." };
  }
  return { ok: true };
}

export function validatePemakaianOutlet(row: PemakaianOutlet, bahan: MasterBahan[]): ValidationResult {
  const map = bahanMap(bahan);
  const q = rejectQty(row.qty);
  if (!q.ok) return q;
  return rejectKodeBahan(row.kodeBahan, map);
}

export function validateWasteSelisih(row: WasteSelisih, bahan: MasterBahan[]): ValidationResult {
  const map = bahanMap(bahan);
  const q = rejectQty(row.qty);
  if (!q.ok) return q;
  return rejectKodeBahan(row.kodeBahan, map);
}

/** Batch validate — untuk import Sheets → Supabase nanti. */
export function validateBarangMasukBatch(rows: BarangMasuk[], bahan: MasterBahan[]) {
  return rows.map((row, i) => {
    const r = validateBarangMasuk(row, bahan);
    return r.ok ? r : { ok: false as const, message: `Baris ${i + 1}: ${r.message}` };
  });
}
