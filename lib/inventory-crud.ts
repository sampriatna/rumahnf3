import { isSupabaseConfigured } from "./supabase";
import {
  pullMasterLokasi,
  pullMasterBahan,
  pullMasterSupplier,
  pullBarangMasuk,
  pullTransferStok,
  pullPemakaianOutlet,
  pullWasteSelisih,
  pullOpnameAwal,
  insertMasterBahan,
  updateMasterBahan,
  deleteMasterBahan,
  insertMasterLokasi,
  updateMasterLokasi,
  deleteMasterLokasi,
  insertMasterSupplier,
  updateMasterSupplier,
  deleteMasterSupplier,
  insertBarangMasuk,
  updateBarangMasuk,
  deleteBarangMasuk,
  insertTransferStok,
  updateTransferStok,
  deleteTransferStok,
  insertPemakaianOutlet,
  updatePemakaianOutlet,
  deletePemakaianOutlet,
  insertWasteSelisih,
  updateWasteSelisih,
  deleteWasteSelisih,
  insertOpnameAwal,
  updateOpnameAwal,
  deleteOpnameAwal
} from "./db/inventory-sheets-repo";
import {
  validateBarangMasuk,
  validateTransferStok,
  validatePemakaianOutlet,
  validateWasteSelisih
} from "./inventory-validate";
import type {
  MasterBahan,
  MasterLokasi,
  MasterSupplier,
  BarangMasuk,
  TransferStok,
  PemakaianOutlet,
  WasteSelisih,
  OpnameAwal
} from "@/types/inventory";

export function assertInventoryDb() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase belum dikonfigurasi. Set env & jalankan inventory-sheets.sql.");
  }
}

export function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function toIsoDate(dateStr: string): string {
  const d = dateStr.trim();
  if (d.includes("T")) return d;
  return `${d}T08:00:00Z`;
}

export async function listInventoryMaster() {
  assertInventoryDb();
  const [lokasi, bahan] = await Promise.all([pullMasterLokasi(), pullMasterBahan()]);
  return { lokasi, bahan };
}

export async function saveMasterBahan(row: MasterBahan, mode: "create" | "update") {
  assertInventoryDb();
  if (!row.kodeBahan?.trim()) throw new Error("Kode bahan wajib.");
  if (mode === "create") await insertMasterBahan(row);
  else await updateMasterBahan(row);
}

export async function removeMasterBahan(kode: string) {
  assertInventoryDb();
  await deleteMasterBahan(kode);
}

export async function saveMasterLokasi(row: MasterLokasi, mode: "create" | "update") {
  assertInventoryDb();
  if (mode === "create") await insertMasterLokasi(row);
  else await updateMasterLokasi(row);
}

export async function removeMasterLokasi(kode: string) {
  assertInventoryDb();
  await deleteMasterLokasi(kode);
}

export async function saveMasterSupplier(row: MasterSupplier, mode: "create" | "update") {
  assertInventoryDb();
  if (!row.kode?.trim()) throw new Error("Kode supplier wajib.");
  if (!row.nama?.trim()) throw new Error("Nama supplier wajib.");
  if (mode === "create") await insertMasterSupplier(row);
  else await updateMasterSupplier(row);
}

export async function removeMasterSupplier(kode: string) {
  assertInventoryDb();
  await deleteMasterSupplier(kode);
}

async function bahanForValidate() {
  return pullMasterBahan();
}

export async function saveBarangMasuk(row: BarangMasuk, mode: "create" | "update") {
  assertInventoryDb();
  const bahan = await bahanForValidate();
  const v = validateBarangMasuk(row, bahan);
  if (!v.ok) throw new Error(v.message);
  if (mode === "create") await insertBarangMasuk({ ...row, id: row.id ?? newId("bm") });
  else await updateBarangMasuk(row);
}

export async function removeBarangMasuk(id: string) {
  assertInventoryDb();
  await deleteBarangMasuk(id);
}

export async function saveTransferStok(row: TransferStok, mode: "create" | "update") {
  assertInventoryDb();
  const bahan = await bahanForValidate();
  const v = validateTransferStok(row, bahan);
  if (!v.ok) throw new Error(v.message);
  if (mode === "create") await insertTransferStok({ ...row, id: row.id ?? newId("tr") });
  else await updateTransferStok(row);
}

export async function removeTransferStok(id: string) {
  assertInventoryDb();
  await deleteTransferStok(id);
}

export async function savePemakaianOutlet(row: PemakaianOutlet, mode: "create" | "update") {
  assertInventoryDb();
  const bahan = await bahanForValidate();
  const v = validatePemakaianOutlet(row, bahan);
  if (!v.ok) throw new Error(v.message);
  if (mode === "create") await insertPemakaianOutlet({ ...row, id: row.id ?? newId("pk") });
  else await updatePemakaianOutlet(row);
}

export async function removePemakaianOutlet(id: string) {
  assertInventoryDb();
  await deletePemakaianOutlet(id);
}

export async function saveWasteSelisih(row: WasteSelisih, mode: "create" | "update") {
  assertInventoryDb();
  const bahan = await bahanForValidate();
  const v = validateWasteSelisih(row, bahan);
  if (!v.ok) throw new Error(v.message);
  if (mode === "create") await insertWasteSelisih({ ...row, id: row.id ?? newId("ws") });
  else await updateWasteSelisih(row);
}

export async function removeWasteSelisih(id: string) {
  assertInventoryDb();
  await deleteWasteSelisih(id);
}

export async function saveOpnameAwal(row: OpnameAwal, mode: "create" | "update") {
  assertInventoryDb();
  const bahan = await bahanForValidate();
  if (!bahan.some((b) => b.kodeBahan === row.kodeBahan)) {
    throw new Error(`kodeBahan "${row.kodeBahan}" tidak ada di MasterBahan.`);
  }
  if (row.qtyAwal < 0) throw new Error("qty awal tidak boleh negatif.");
  if (mode === "create") await insertOpnameAwal({ ...row, id: row.id ?? newId("op") });
  else await updateOpnameAwal(row);
}

export async function removeOpnameAwal(id: string) {
  assertInventoryDb();
  await deleteOpnameAwal(id);
}

export {
  pullMasterLokasi,
  pullMasterBahan,
  pullMasterSupplier,
  pullBarangMasuk,
  pullTransferStok,
  pullPemakaianOutlet,
  pullWasteSelisih,
  pullOpnameAwal
};
