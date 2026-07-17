import type {
  MasterBahan,
  BarangMasuk,
  TransferStok,
  PemakaianOutlet,
  WasteSelisih,
  OpnameAwal
} from "@/types/inventory";
import { isSupabaseConfigured } from "./supabase";
import { isSupabaseInventoryEnabled } from "./inventory-sheets-enabled";
import {
  pullMasterBahan,
  insertWasteSelisih,
  insertBarangMasuk,
  insertTransferStok,
  insertPemakaianOutlet,
  insertOpnameAwal
} from "./db/inventory-sheets-repo";
import { toOutletCode, WAREHOUSE_LOCATION_CODE } from "./outlet-identity";
import { getItem } from "./inventory-service";
import { todayIso } from "./date-format";
import type { ClosingOpnameResult } from "./kds-closing-service";

export function outletIdToLokasi(outletId?: string): string {
  if (!outletId) return WAREHOUSE_LOCATION_CODE;
  return toOutletCode(outletId);
}

export function resolveKodeBahan(
  input: { itemId?: string; itemName?: string; kodeBahan?: string },
  bahanList: MasterBahan[]
): string | null {
  if (input.kodeBahan) {
    const byKode = bahanList.find((b) => b.kodeBahan === input.kodeBahan);
    if (byKode) return byKode.kodeBahan;
  }

  let name = input.itemName?.trim();
  if (!name && input.itemId) {
    const item = getItem(input.itemId);
    name = item?.itemName;
  }
  if (!name) return null;

  const lower = name.toLowerCase();
  const exact = bahanList.find((b) => b.namaBaku.toLowerCase() === lower);
  if (exact) return exact.kodeBahan;

  const byKode = bahanList.find((b) => b.kodeBahan.toLowerCase() === lower);
  if (byKode) return byKode.kodeBahan;

  const partial = bahanList.find(
    (b) => lower.includes(b.namaBaku.toLowerCase()) || b.namaBaku.toLowerCase().includes(lower)
  );
  return partial?.kodeBahan ?? null;
}

export function sheetsWriterActive(): boolean {
  return isSupabaseConfigured() && isSupabaseInventoryEnabled();
}

async function getBahanList(): Promise<MasterBahan[]> {
  return pullMasterBahan();
}

/** Waste dari form staff → waste_selisih. */
export async function writeWasteFromForm(input: {
  itemName: string;
  qty: number;
  outletId?: string;
  sourceDocId: string;
  createdBy: string;
  note?: string;
  jenis?: string;
}): Promise<boolean> {
  if (!sheetsWriterActive() || !(input.qty > 0)) return false;

  const bahanList = await getBahanList();
  const kodeBahan = resolveKodeBahan({ itemName: input.itemName }, bahanList);
  if (!kodeBahan) return false;

  const row: WasteSelisih = {
    id: `ws-form-${input.sourceDocId}`,
    tanggal: todayIso(),
    kodeBahan,
    lokasi: outletIdToLokasi(input.outletId),
    jenis: input.jenis ?? "Form Staff",
    qty: input.qty,
    alasan: input.note ?? "—"
  };
  await insertWasteSelisih(row);
  return true;
}

/** Barang masuk dari form staff → barang_masuk. */
export async function writeBarangMasukFromForm(input: {
  itemName: string;
  qty: number;
  unit?: string;
  outletId?: string;
  sourceDocId: string;
  createdBy: string;
  supplier?: string;
  note?: string;
}): Promise<boolean> {
  if (!sheetsWriterActive() || !(input.qty > 0)) return false;

  const bahanList = await getBahanList();
  const kodeBahan = resolveKodeBahan({ itemName: input.itemName }, bahanList);
  if (!kodeBahan) return false;

  const bahan = bahanList.find((b) => b.kodeBahan === kodeBahan);
  const row: BarangMasuk = {
    id: `bm-form-${input.sourceDocId}`,
    tanggal: todayIso(),
    kodeBahan,
    qty: input.qty,
    satuan: input.unit || bahan?.satuanPakai || "pcs",
    totalHarga: 0,
    supplier: input.supplier ?? "Form Staff",
    lokasiTujuan: outletIdToLokasi(input.outletId),
    diterimaOleh: input.createdBy
  };
  await insertBarangMasuk(row);
  return true;
}

/** Transfer workflow gudang → outlet → transfer_stok (satu record atomik). */
export async function writeTransferFromWorkflow(input: {
  transferId: string;
  itemId?: string;
  itemName: string;
  qty: number;
  toOutletId: string;
  senderName: string;
  receiverName?: string;
}): Promise<boolean> {
  if (!sheetsWriterActive() || !(input.qty > 0)) return false;

  const bahanList = await getBahanList();
  const kodeBahan = resolveKodeBahan(
    { itemId: input.itemId, itemName: input.itemName },
    bahanList
  );
  if (!kodeBahan) return false;

  const row: TransferStok = {
    id: `tr-wf-${input.transferId}-${kodeBahan}`,
    tanggal: todayIso(),
    kodeBahan,
    qty: input.qty,
    dariLokasi: "GDG",
    keLokasi: outletIdToLokasi(input.toOutletId),
    dikeluarkanOleh: input.senderName,
    diterimaOleh: input.receiverName ?? "—"
  };
  await insertTransferStok(row);
  return true;
}

/** KDS closing opname → opname_awal + pemakaian/barang_masuk koreksi. */
export async function writeClosingOpnameToSheets(result: ClosingOpnameResult): Promise<boolean> {
  if (!sheetsWriterActive()) return false;

  await insertOpnameAwal(result.opnameLog);
  if (result.pemakaian) await insertPemakaianOutlet(result.pemakaian);
  if (result.barangMasuk) await insertBarangMasuk(result.barangMasuk);
  return true;
}

/** KDS closing waste → waste_selisih. */
export async function writeClosingWasteToSheets(row: WasteSelisih): Promise<boolean> {
  if (!sheetsWriterActive()) return false;
  await insertWasteSelisih(row);
  return true;
}
