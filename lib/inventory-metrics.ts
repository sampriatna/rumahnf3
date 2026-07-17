import type {
  MasterBahan,
  MasterLokasi,
  BarangMasuk,
  TransferStok,
  PemakaianOutlet,
  WasteSelisih,
  OpnameAwal,
  StatusStok,
  StokKritisItem,
  AnomaliStokItem
} from "@/types/inventory";
import { isSameIsoDay } from "./date-format";

export type InventoryMovementBundle = {
  opname: OpnameAwal[];
  masuk: BarangMasuk[];
  transfer: TransferStok[];
  pemakaian: PemakaianOutlet[];
  waste: WasteSelisih[];
};

/** Saldo per lokasi + total — setara `hitungSaldo()` di prototipe owner dashboard. */
export type SaldoPerLokasi = {
  [lokasi: string]: number;
  total: number;
};

/** Baseline opname: qty terakhir per bahan+lokasi (tanggal terbaru). */
function qtyAwalOpname(kodeBahan: string, lokasi: string, opname: OpnameAwal[]): number {
  const rows = opname
    .filter((o) => o.kodeBahan === kodeBahan && o.lokasi === lokasi)
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  return rows[0]?.qtyAwal ?? 0;
}

/** Saldo qty di satu lokasi (rumus sheet). */
export function saldoLokasi(
  kodeBahan: string,
  lokasi: string,
  opname: OpnameAwal[],
  masuk: BarangMasuk[],
  transfer: TransferStok[],
  pemakaian: PemakaianOutlet[],
  waste: WasteSelisih[]
): number {
  let saldo = qtyAwalOpname(kodeBahan, lokasi, opname);

  for (const m of masuk) {
    if (m.kodeBahan === kodeBahan && m.lokasiTujuan === lokasi) saldo += m.qty;
  }
  for (const t of transfer) {
    if (t.kodeBahan !== kodeBahan) continue;
    if (t.keLokasi === lokasi) saldo += t.qty;
    if (t.dariLokasi === lokasi) saldo -= t.qty;
  }
  for (const p of pemakaian) {
    if (p.kodeBahan === kodeBahan && p.lokasi === lokasi) saldo -= p.qty;
  }
  for (const w of waste) {
    if (w.kodeBahan === kodeBahan && w.lokasi === lokasi) saldo -= w.qty;
  }

  return saldo;
}

/** Peta saldo {kodeBahan → {GDG, KBU, …, total}} dari semua mutasi. */
export function buildSaldoMap(
  bahanList: MasterBahan[],
  lokasiList: MasterLokasi[],
  bundle: InventoryMovementBundle
): Record<string, SaldoPerLokasi> {
  const map: Record<string, SaldoPerLokasi> = {};

  for (const bahan of bahanList) {
    const entry: SaldoPerLokasi = { total: 0 };
    for (const loc of lokasiList) {
      const qty = saldoLokasi(
        bahan.kodeBahan,
        loc.kode,
        bundle.opname,
        bundle.masuk,
        bundle.transfer,
        bundle.pemakaian,
        bundle.waste
      );
      entry[loc.kode] = qty;
      entry.total += qty;
    }
    map[bahan.kodeBahan] = entry;
  }

  return map;
}

/** Σ saldo semua lokasi untuk satu bahan. */
export function saldoTotal(
  kodeBahan: string,
  lokasiList: MasterLokasi[],
  bundle: InventoryMovementBundle
): number {
  return lokasiList.reduce(
    (sum, loc) =>
      sum +
      saldoLokasi(
        kodeBahan,
        loc.kode,
        bundle.opname,
        bundle.masuk,
        bundle.transfer,
        bundle.pemakaian,
        bundle.waste
      ),
    0
  );
}

export function statusStok(saldo: number, bahan: MasterBahan): StatusStok {
  if (saldo <= bahan.stokMinimum) return "BELI";
  if (saldo <= bahan.stokAman) return "WASPADA";
  return "AMAN";
}

function estimasiKekuranganNilai(saldo: number, bahan: MasterBahan): number {
  const kurang = Math.max(0, bahan.stokMinimum - saldo);
  return kurang * bahan.hargaPerSatuanPakai;
}

/** Bahan kritis — hanya Aktif + Distok; sort BELI dulu, lalu nilai kekurangan terbesar. */
export function stokKritisList(
  bahanList: MasterBahan[],
  lokasiList: MasterLokasi[],
  bundle: InventoryMovementBundle
): StokKritisItem[] {
  const items: StokKritisItem[] = [];

  for (const bahan of bahanList) {
    if (bahan.statusAktif !== "Aktif" || bahan.metodeStok !== "Distok") continue;
    const total = saldoTotal(bahan.kodeBahan, lokasiList, bundle);
    const st = statusStok(total, bahan);
    if (st === "BELI" || st === "WASPADA") {
      items.push({
        kodeBahan: bahan.kodeBahan,
        namaBaku: bahan.namaBaku,
        saldoTotal: total,
        status: st,
        estimasiKekuranganNilai: estimasiKekuranganNilai(total, bahan)
      });
    }
  }

  return items.sort((a, b) => {
    if (a.status !== b.status) return a.status === "BELI" ? -1 : 1;
    return b.estimasiKekuranganNilai - a.estimasiKekuranganNilai;
  });
}

/** Nilai stok (Rp) di satu lokasi = Σ (saldo × harga per satuan pakai). */
export function nilaiStokPerLokasi(
  lokasi: string,
  bahanList: MasterBahan[],
  lokasiList: MasterLokasi[],
  bundle: InventoryMovementBundle
): number {
  return bahanList
    .filter((b) => b.statusAktif === "Aktif")
    .reduce((sum, bahan) => {
      const qty = saldoLokasi(
        bahan.kodeBahan,
        lokasi,
        bundle.opname,
        bundle.masuk,
        bundle.transfer,
        bundle.pemakaian,
        bundle.waste
      );
      return sum + qty * bahan.hargaPerSatuanPakai;
    }, 0);
}

/** Bahan dengan saldo negatif di lokasi mana pun — indikator error input. */
export function anomaliStok(
  bahanList: MasterBahan[],
  lokasiList: MasterLokasi[],
  bundle: InventoryMovementBundle
): AnomaliStokItem[] {
  const out: AnomaliStokItem[] = [];
  for (const bahan of bahanList) {
    for (const loc of lokasiList) {
      const saldo = saldoLokasi(
        bahan.kodeBahan,
        loc.kode,
        bundle.opname,
        bundle.masuk,
        bundle.transfer,
        bundle.pemakaian,
        bundle.waste
      );
      if (saldo < 0) {
        out.push({
          kodeBahan: bahan.kodeBahan,
          namaBaku: bahan.namaBaku,
          lokasi: loc.kode,
          saldo
        });
      }
    }
  }
  return out;
}

export function countTransferHariIni(transfer: TransferStok[], today: string): number {
  return transfer.filter((t) => isSameIsoDay(t.tanggal, today)).length;
}

export type InventoryMetrics = {
  stokKritisBeli: number;
  stokKritisWaspada: number;
  transferHariIni: number;
  anomaliCount: number;
  nilaiStokGudang: number;
  kritisList: StokKritisItem[];
  anomaliList: AnomaliStokItem[];
};

export function countStatusStok(
  bahanList: MasterBahan[],
  lokasiList: MasterLokasi[],
  bundle: InventoryMovementBundle
): { beli: number; waspada: number; aman: number } {
  let beli = 0;
  let waspada = 0;
  let aman = 0;

  for (const bahan of bahanList) {
    if (bahan.statusAktif !== "Aktif" || bahan.metodeStok !== "Distok") continue;
    const total = saldoTotal(bahan.kodeBahan, lokasiList, bundle);
    const st = statusStok(total, bahan);
    if (st === "BELI") beli += 1;
    else if (st === "WASPADA") waspada += 1;
    else aman += 1;
  }

  return { beli, waspada, aman };
}

/** Total nilai stok bisnis = Σ (saldo total × harga per satuan pakai). */
export function totalNilaiStok(
  bahanList: MasterBahan[],
  lokasiList: MasterLokasi[],
  bundle: InventoryMovementBundle
): number {
  return bahanList
    .filter((b) => b.statusAktif === "Aktif")
    .reduce((sum, bahan) => {
      const qty = saldoTotal(bahan.kodeBahan, lokasiList, bundle);
      return sum + qty * bahan.hargaPerSatuanPakai;
    }, 0);
}

/** Item kritis diurutkan prioritas nilai (harga × stok aman) — seperti prototipe dashboard. */
export function stokKritisByPrioritas(
  bahanList: MasterBahan[],
  lokasiList: MasterLokasi[],
  bundle: InventoryMovementBundle,
  limit = 12
) {
  const saldoMap = buildSaldoMap(bahanList, lokasiList, bundle);

  return bahanList
    .filter((b) => b.statusAktif === "Aktif" && b.metodeStok === "Distok")
    .map((bahan) => {
      const saldo = saldoMap[bahan.kodeBahan] ?? { total: 0 };
      const st = statusStok(saldo.total, bahan);
      return {
        bahan,
        saldo,
        status: st,
        nilai: saldo.total * bahan.hargaPerSatuanPakai,
        prioritasNilai: bahan.hargaPerSatuanPakai * Math.max(1, bahan.stokAman)
      };
    })
    .filter((row) => row.status === "BELI" || row.status === "WASPADA")
    .sort((a, b) => b.prioritasNilai - a.prioritasNilai)
    .slice(0, limit);
}

export function computeInventoryMetrics(
  bahanList: MasterBahan[],
  lokasiList: MasterLokasi[],
  bundle: InventoryMovementBundle,
  today: string
): InventoryMetrics {
  const kritis = stokKritisList(bahanList, lokasiList, bundle);
  const anomali = anomaliStok(bahanList, lokasiList, bundle);
  return {
    stokKritisBeli: kritis.filter((k) => k.status === "BELI").length,
    stokKritisWaspada: kritis.filter((k) => k.status === "WASPADA").length,
    transferHariIni: countTransferHariIni(bundle.transfer, today),
    anomaliCount: anomali.length,
    nilaiStokGudang: nilaiStokPerLokasi("GDG", bahanList, lokasiList, bundle),
    kritisList: kritis,
    anomaliList: anomali
  };
}
