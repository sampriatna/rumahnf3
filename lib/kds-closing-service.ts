import type {
  MasterBahan,
  KdsClosingChecklistItem,
  ClosingOpnameRule,
  PemakaianOutlet,
  BarangMasuk,
  WasteSelisih,
  OpnameAwal,
  KodeLokasi
} from "@/types/inventory";
import {
  saldoLokasi,
  type InventoryMovementBundle
} from "./inventory-metrics";
import { isSameIsoDay, todayIso } from "./date-format";
import {
  appendSheetBarangMasuk,
  appendSheetOpnameLog,
  appendSheetPemakaian,
  appendSheetWaste,
  listClosingRulesForKds
} from "./inventory-sheet-store";
import { sheetsWriterActive } from "./inventory-sheets-writer";
import { getActiveInventorySource } from "./sources";

/** Pemetaan outlet app → kode lokasi inventory. */
export const OUTLET_TO_LOKASI: Record<string, KodeLokasi> = {
  kbu: "KBU",
  kisamen: "KSM",
  samtaro: "SMT"
};

export function outletToLokasi(outletId: string): KodeLokasi | undefined {
  return OUTLET_TO_LOKASI[outletId];
}

function mergeBundle(staticBundle: InventoryMovementBundle, runtime: InventoryMovementBundle): InventoryMovementBundle {
  return {
    opname: [...staticBundle.opname, ...runtime.opname],
    masuk: [...staticBundle.masuk, ...runtime.masuk],
    transfer: [...staticBundle.transfer, ...runtime.transfer],
    pemakaian: [...staticBundle.pemakaian, ...runtime.pemakaian],
    waste: [...staticBundle.waste, ...runtime.waste]
  };
}

function opnameSubmittedToday(
  kodeBahan: string,
  lokasi: string,
  opnameLogs: OpnameAwal[],
  pemakaian: PemakaianOutlet[],
  today: string
): boolean {
  const fromLog = opnameLogs.some(
    (o) => o.kodeBahan === kodeBahan && o.lokasi === lokasi && isSameIsoDay(o.tanggal, today)
  );
  const fromClosing = pemakaian.some(
    (p) =>
      p.kodeBahan === kodeBahan &&
      p.lokasi === lokasi &&
      p.jenisPemakaian === "Closing Opname" &&
      isSameIsoDay(p.tanggal, today)
  );
  return fromLog || fromClosing;
}

export function buildClosingChecklist(
  rules: ClosingOpnameRule[],
  bahanList: MasterBahan[],
  bundle: InventoryMovementBundle,
  today: string,
  onlyWajib = true
): KdsClosingChecklistItem[] {
  const filtered = onlyWajib ? rules.filter((r) => r.wajibOpname) : rules;
  return filtered.map((rule) => {
    const bahan = bahanList.find((b) => b.kodeBahan === rule.kodeBahan);
    const stokSistem = saldoLokasi(
      rule.kodeBahan,
      rule.lokasiStok,
      bundle.opname,
      bundle.masuk,
      bundle.transfer,
      bundle.pemakaian,
      bundle.waste
    );
    return {
      ruleId: rule.id,
      kodeBahan: rule.kodeBahan,
      label: rule.label,
      namaBaku: bahan?.namaBaku ?? rule.kodeBahan,
      satuanPakai: bahan?.satuanPakai ?? "—",
      lokasi: rule.lokasiStok,
      stokSistem,
      sudahOpnameHariIni: opnameSubmittedToday(
        rule.kodeBahan,
        rule.lokasiStok,
        bundle.opname,
        bundle.pemakaian,
        today
      )
    };
  });
}

export type ClosingOpnameResult = {
  sistem: number;
  fisik: number;
  delta: number;
  pemakaian?: PemakaianOutlet;
  barangMasuk?: BarangMasuk;
  opnameLog: OpnameAwal;
};

/** Hitung selisih & baris inventory dari opname closing. */
export function computeClosingOpnameRows(input: {
  kodeBahan: string;
  lokasi: string;
  stokFisik: number;
  pic: string;
  satuanPakai: string;
  bundle: InventoryMovementBundle;
  now?: string;
}): ClosingOpnameResult {
  const now = input.now ?? new Date().toISOString();
  const sistem = saldoLokasi(
    input.kodeBahan,
    input.lokasi,
    input.bundle.opname,
    input.bundle.masuk,
    input.bundle.transfer,
    input.bundle.pemakaian,
    input.bundle.waste
  );
  const fisik = Math.max(0, input.stokFisik);
  const delta = sistem - fisik;

  const opnameLog: OpnameAwal = {
    id: `op-cl-${Date.now()}`,
    tanggal: now,
    kodeBahan: input.kodeBahan,
    lokasi: input.lokasi,
    qtyAwal: fisik
  };

  let pemakaian: PemakaianOutlet | undefined;
  let barangMasuk: BarangMasuk | undefined;

  if (delta > 0) {
    pemakaian = {
      id: `pk-cl-${Date.now()}`,
      tanggal: now,
      kodeBahan: input.kodeBahan,
      qty: delta,
      lokasi: input.lokasi,
      jenisPemakaian: "Closing Opname",
      pic: input.pic
    };
  } else if (delta < 0) {
    barangMasuk = {
      id: `bm-cl-${Date.now()}`,
      tanggal: now,
      kodeBahan: input.kodeBahan,
      qty: -delta,
      satuan: input.satuanPakai,
      totalHarga: 0,
      supplier: "Koreksi Opname Closing",
      lokasiTujuan: input.lokasi,
      diterimaOleh: input.pic
    };
  }

  return { sistem, fisik, delta, pemakaian, barangMasuk, opnameLog };
}

export function persistClosingOpname(result: ClosingOpnameResult) {
  if (!sheetsWriterActive()) {
    appendSheetOpnameLog(result.opnameLog);
    if (result.pemakaian) appendSheetPemakaian(result.pemakaian);
    if (result.barangMasuk) appendSheetBarangMasuk(result.barangMasuk);
  }
}

export async function persistClosingOpnameAsync(result: ClosingOpnameResult) {
  const { writeClosingOpnameToSheets } = await import("./inventory-sheets-writer");
  if (sheetsWriterActive()) {
    await writeClosingOpnameToSheets(result);
    return;
  }
  persistClosingOpname(result);
}

export function persistClosingWaste(row: WasteSelisih) {
  if (!sheetsWriterActive()) {
    appendSheetWaste(row);
  }
}

export async function persistClosingWasteAsync(row: WasteSelisih) {
  const { writeClosingWasteToSheets } = await import("./inventory-sheets-writer");
  if (sheetsWriterActive()) {
    await writeClosingWasteToSheets(row);
    return;
  }
  persistClosingWaste(row);
}

export type KdsClosingContext = {
  today: string;
  checklist: KdsClosingChecklistItem[];
  optionalChecklist: KdsClosingChecklistItem[];
  wasteOptions: Array<{ kodeBahan: string; namaBaku: string; satuanPakai: string }>;
  lokasi: string;
};

/** Muat konteks closing untuk panel KDS. */
export async function getKdsClosingContext(
  outletId: string,
  stationId: string
): Promise<KdsClosingContext> {
  const source = getActiveInventorySource();
  const bahanList = await source.getMasterBahan();
  const bundle = await loadInventoryBundleForClosing();

  const today = todayIso();
  const rules = listClosingRulesForKds(outletId, stationId);
  const lokasi = outletToLokasi(outletId) ?? "KBU";

  const wasteOptions = bahanList
    .filter((b) => b.statusAktif === "Aktif" && b.metodeStok === "Distok")
    .map((b) => ({
      kodeBahan: b.kodeBahan,
      namaBaku: b.namaBaku,
      satuanPakai: b.satuanPakai
    }));

  return {
    today,
    checklist: buildClosingChecklist(rules, bahanList, bundle, today, true),
    optionalChecklist: buildClosingChecklist(
      rules.filter((r) => !r.wajibOpname),
      bahanList,
      bundle,
      today,
      false
    ),
    wasteOptions,
    lokasi
  };
}

/** Bundle lengkap untuk submit (static + runtime lokal bila perlu). */
export async function loadInventoryBundleForClosing(): Promise<InventoryMovementBundle> {
  const source = getActiveInventorySource();

  const [opname, masuk, transfer, pemakaian, waste] = await Promise.all([
    source.getOpnameAwal(),
    source.getBarangMasuk(),
    source.getTransferStok(),
    source.getPemakaianOutlet(),
    source.getWasteSelisih()
  ]);

  if (sheetsWriterActive()) {
    return { opname, masuk, transfer, pemakaian, waste };
  }

  const { getInventorySheetRuntime } = await import("./inventory-sheet-store");
  const runtime = getInventorySheetRuntime();

  return mergeBundle(
    { opname, masuk, transfer, pemakaian, waste },
    {
      opname: runtime.opnameLogs,
      masuk: runtime.barangMasuk,
      transfer: [],
      pemakaian: runtime.pemakaian,
      waste: runtime.waste
    }
  );
}
