import { supabaseAdmin, isSupabaseConfigured } from "../supabase";
import type {
  MasterLokasi,
  MasterBahan,
  MasterSupplier,
  OpnameAwal,
  BarangMasuk,
  TransferStok,
  PemakaianOutlet,
  WasteSelisih
} from "@/types/inventory";
import type { DateRange } from "../sources/finance-source";

const num = (v: unknown): number => (v == null ? 0 : Number(v));

function inDateRange(tanggal: string, range?: DateRange): boolean {
  if (!range) return true;
  const d = tanggal.slice(0, 10);
  if (range.from && d < range.from) return false;
  if (range.to && d > range.to) return false;
  return true;
}

function filterByRange<T extends { tanggal: string }>(rows: T[], range?: DateRange): T[] {
  return range ? rows.filter((r) => inDateRange(r.tanggal, range)) : rows;
}

async function selectAll<T>(table: string): Promise<T[]> {
  const { data, error } = await supabaseAdmin().from(table).select("*");
  if (error) throw new Error(`inventory-sheets ${table}: ${error.message}`);
  return (data ?? []) as T[];
}

type RowLokasi = { kode: string; nama_lokasi: string; jenis: string };
type RowBahan = {
  kode_bahan: string;
  nama_baku: string;
  kategori: string;
  satuan_beli: string;
  satuan_pakai: string;
  konversi: number;
  harga_per_satuan_pakai: number;
  supplier_utama: string;
  stok_minimum: number;
  stok_aman: number;
  stok_maksimum: number;
  status_aktif: string;
  metode_stok: string;
};
type RowSupplier = { kode: string; nama: string; kategori: string; hari_order: string };

export function mapMasterLokasi(row: RowLokasi): MasterLokasi {
  return { kode: row.kode as MasterLokasi["kode"], namaLokasi: row.nama_lokasi, jenis: row.jenis };
}

export function mapMasterBahan(row: RowBahan): MasterBahan {
  return {
    kodeBahan: row.kode_bahan,
    namaBaku: row.nama_baku,
    kategori: row.kategori,
    satuanBeli: row.satuan_beli,
    satuanPakai: row.satuan_pakai,
    konversi: num(row.konversi),
    hargaPerSatuanPakai: num(row.harga_per_satuan_pakai),
    supplierUtama: row.supplier_utama,
    stokMinimum: num(row.stok_minimum),
    stokAman: num(row.stok_aman),
    stokMaksimum: num(row.stok_maksimum),
    statusAktif: row.status_aktif as MasterBahan["statusAktif"],
    metodeStok: row.metode_stok as MasterBahan["metodeStok"]
  };
}

export async function pullMasterLokasi(): Promise<MasterLokasi[]> {
  if (!isSupabaseConfigured()) return [];
  const rows = await selectAll<RowLokasi>("master_lokasi");
  return rows.map(mapMasterLokasi).sort((a, b) => a.kode.localeCompare(b.kode));
}

export function mapMasterSupplier(row: RowSupplier): MasterSupplier {
  return {
    kode: row.kode,
    nama: row.nama,
    kategori: row.kategori,
    hariOrder: row.hari_order
  };
}

export async function pullMasterSupplier(): Promise<MasterSupplier[]> {
  if (!isSupabaseConfigured()) return [];
  const rows = await selectAll<RowSupplier>("master_supplier");
  return rows.map(mapMasterSupplier).sort((a, b) => a.nama.localeCompare(b.nama, "id"));
}

export async function insertMasterSupplier(row: MasterSupplier) {
  const { error } = await supabaseAdmin().from("master_supplier").insert({
    kode: row.kode,
    nama: row.nama,
    kategori: row.kategori,
    hari_order: row.hariOrder
  } as never);
  if (error) throw new Error(error.message);
}

export async function updateMasterSupplier(row: MasterSupplier) {
  const { error } = await supabaseAdmin()
    .from("master_supplier")
    .update({
      nama: row.nama,
      kategori: row.kategori,
      hari_order: row.hariOrder
    } as never)
    .eq("kode", row.kode);
  if (error) throw new Error(error.message);
}

export async function deleteMasterSupplier(kode: string) {
  const { error } = await supabaseAdmin().from("master_supplier").delete().eq("kode", kode);
  if (error) throw new Error(error.message);
}

export async function pullMasterBahan(): Promise<MasterBahan[]> {
  if (!isSupabaseConfigured()) return [];
  const rows = await selectAll<RowBahan>("master_bahan");
  return rows.map(mapMasterBahan).sort((a, b) => a.kodeBahan.localeCompare(b.kodeBahan));
}

export async function pullOpnameAwal(range?: DateRange): Promise<OpnameAwal[]> {
  if (!isSupabaseConfigured()) return [];
  const rows = await selectAll<{
    id: string;
    tanggal: string;
    kode_bahan: string;
    lokasi: string;
    qty_awal: number;
  }>("opname_awal");
  const mapped = rows.map((r) => ({
    id: r.id,
    tanggal: r.tanggal,
    kodeBahan: r.kode_bahan,
    lokasi: r.lokasi,
    qtyAwal: num(r.qty_awal)
  }));
  return filterByRange(mapped, range);
}

export async function pullBarangMasuk(range?: DateRange): Promise<BarangMasuk[]> {
  if (!isSupabaseConfigured()) return [];
  const rows = await selectAll<{
    id: string;
    tanggal: string;
    kode_bahan: string;
    qty: number;
    satuan: string;
    total_harga: number;
    supplier: string;
    lokasi_tujuan: string;
    diterima_oleh: string;
  }>("barang_masuk");
  const mapped = rows.map((r) => ({
    id: r.id,
    tanggal: r.tanggal,
    kodeBahan: r.kode_bahan,
    qty: num(r.qty),
    satuan: r.satuan,
    totalHarga: num(r.total_harga),
    supplier: r.supplier,
    lokasiTujuan: r.lokasi_tujuan,
    diterimaOleh: r.diterima_oleh
  }));
  return filterByRange(mapped, range);
}

export async function pullTransferStok(range?: DateRange): Promise<TransferStok[]> {
  if (!isSupabaseConfigured()) return [];
  const rows = await selectAll<{
    id: string;
    tanggal: string;
    kode_bahan: string;
    qty: number;
    dari_lokasi: string;
    ke_lokasi: string;
    dikeluarkan_oleh: string;
    diterima_oleh: string;
  }>("transfer_stok");
  const mapped = rows.map((r) => ({
    id: r.id,
    tanggal: r.tanggal,
    kodeBahan: r.kode_bahan,
    qty: num(r.qty),
    dariLokasi: r.dari_lokasi,
    keLokasi: r.ke_lokasi,
    dikeluarkanOleh: r.dikeluarkan_oleh,
    diterimaOleh: r.diterima_oleh
  }));
  return filterByRange(mapped, range);
}

export async function pullPemakaianOutlet(range?: DateRange): Promise<PemakaianOutlet[]> {
  if (!isSupabaseConfigured()) return [];
  const rows = await selectAll<{
    id: string;
    tanggal: string;
    kode_bahan: string;
    qty: number;
    lokasi: string;
    jenis_pemakaian: string;
    pic: string;
  }>("pemakaian_outlet");
  const mapped = rows.map((r) => ({
    id: r.id,
    tanggal: r.tanggal,
    kodeBahan: r.kode_bahan,
    qty: num(r.qty),
    lokasi: r.lokasi,
    jenisPemakaian: r.jenis_pemakaian,
    pic: r.pic
  }));
  return filterByRange(mapped, range);
}

export async function pullWasteSelisih(range?: DateRange): Promise<WasteSelisih[]> {
  if (!isSupabaseConfigured()) return [];
  const rows = await selectAll<{
    id: string;
    tanggal: string;
    kode_bahan: string;
    lokasi: string;
    jenis: string;
    qty: number;
    alasan: string;
  }>("waste_selisih");
  const mapped = rows.map((r) => ({
    id: r.id,
    tanggal: r.tanggal,
    kodeBahan: r.kode_bahan,
    lokasi: r.lokasi,
    jenis: r.jenis,
    qty: num(r.qty),
    alasan: r.alasan
  }));
  return filterByRange(mapped, range);
}

/** Upsert batch — dipakai script import CSV. */
export async function upsertRows(table: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const { error } = await supabaseAdmin().from(table).upsert(rows as never[], { onConflict: "id" });
  if (error) throw new Error(`upsert ${table}: ${error.message}`);
}

export async function upsertMasterLokasi(rows: MasterLokasi[]) {
  if (!rows.length) return;
  const payload = rows.map((r) => ({
    kode: r.kode,
    nama_lokasi: r.namaLokasi,
    jenis: r.jenis
  }));
  const { error } = await supabaseAdmin()
    .from("master_lokasi")
    .upsert(payload as never[], { onConflict: "kode" });
  if (error) throw new Error(`upsert master_lokasi: ${error.message}`);
}

export async function upsertMasterBahan(rows: MasterBahan[]) {
  if (!rows.length) return;
  const payload = rows.map((r) => ({
    kode_bahan: r.kodeBahan,
    nama_baku: r.namaBaku,
    kategori: r.kategori,
    satuan_beli: r.satuanBeli,
    satuan_pakai: r.satuanPakai,
    konversi: r.konversi,
    harga_per_satuan_pakai: r.hargaPerSatuanPakai,
    supplier_utama: r.supplierUtama,
    stok_minimum: r.stokMinimum,
    stok_aman: r.stokAman,
    stok_maksimum: r.stokMaksimum,
    status_aktif: r.statusAktif,
    metode_stok: r.metodeStok
  }));
  const { error } = await supabaseAdmin()
    .from("master_bahan")
    .upsert(payload as never[], { onConflict: "kode_bahan" });
  if (error) throw new Error(`upsert master_bahan: ${error.message}`);
}

function rowMasterBahan(r: MasterBahan) {
  return {
    kode_bahan: r.kodeBahan,
    nama_baku: r.namaBaku,
    kategori: r.kategori,
    satuan_beli: r.satuanBeli,
    satuan_pakai: r.satuanPakai,
    konversi: r.konversi,
    harga_per_satuan_pakai: r.hargaPerSatuanPakai,
    supplier_utama: r.supplierUtama,
    stok_minimum: r.stokMinimum,
    stok_aman: r.stokAman,
    stok_maksimum: r.stokMaksimum,
    status_aktif: r.statusAktif,
    metode_stok: r.metodeStok
  };
}

export async function insertMasterBahan(row: MasterBahan) {
  const { error } = await supabaseAdmin().from("master_bahan").insert(rowMasterBahan(row) as never);
  if (error) throw new Error(error.message);
}

export async function updateMasterBahan(row: MasterBahan) {
  const { error } = await supabaseAdmin()
    .from("master_bahan")
    .update(rowMasterBahan(row) as never)
    .eq("kode_bahan", row.kodeBahan);
  if (error) throw new Error(error.message);
}

export async function deleteMasterBahan(kodeBahan: string) {
  const { error } = await supabaseAdmin().from("master_bahan").delete().eq("kode_bahan", kodeBahan);
  if (error) throw new Error(error.message);
}

export async function insertBarangMasuk(row: BarangMasuk) {
  const { error } = await supabaseAdmin().from("barang_masuk").insert({
    id: row.id!,
    tanggal: row.tanggal,
    kode_bahan: row.kodeBahan,
    qty: row.qty,
    satuan: row.satuan,
    total_harga: row.totalHarga,
    supplier: row.supplier,
    lokasi_tujuan: row.lokasiTujuan,
    diterima_oleh: row.diterimaOleh
  } as never);
  if (error) throw new Error(error.message);
}

export async function updateBarangMasuk(row: BarangMasuk) {
  const { error } = await supabaseAdmin()
    .from("barang_masuk")
    .update({
      tanggal: row.tanggal,
      kode_bahan: row.kodeBahan,
      qty: row.qty,
      satuan: row.satuan,
      total_harga: row.totalHarga,
      supplier: row.supplier,
      lokasi_tujuan: row.lokasiTujuan,
      diterima_oleh: row.diterimaOleh
    } as never)
    .eq("id", row.id!);
  if (error) throw new Error(error.message);
}

export async function deleteBarangMasuk(id: string) {
  const { error } = await supabaseAdmin().from("barang_masuk").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function insertTransferStok(row: TransferStok) {
  const { error } = await supabaseAdmin().from("transfer_stok").insert({
    id: row.id!,
    tanggal: row.tanggal,
    kode_bahan: row.kodeBahan,
    qty: row.qty,
    dari_lokasi: row.dariLokasi,
    ke_lokasi: row.keLokasi,
    dikeluarkan_oleh: row.dikeluarkanOleh,
    diterima_oleh: row.diterimaOleh
  } as never);
  if (error) throw new Error(error.message);
}

export async function updateTransferStok(row: TransferStok) {
  const { error } = await supabaseAdmin()
    .from("transfer_stok")
    .update({
      tanggal: row.tanggal,
      kode_bahan: row.kodeBahan,
      qty: row.qty,
      dari_lokasi: row.dariLokasi,
      ke_lokasi: row.keLokasi,
      dikeluarkan_oleh: row.dikeluarkanOleh,
      diterima_oleh: row.diterimaOleh
    } as never)
    .eq("id", row.id!);
  if (error) throw new Error(error.message);
}

export async function deleteTransferStok(id: string) {
  const { error } = await supabaseAdmin().from("transfer_stok").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function insertPemakaianOutlet(row: PemakaianOutlet) {
  const { error } = await supabaseAdmin().from("pemakaian_outlet").insert({
    id: row.id!,
    tanggal: row.tanggal,
    kode_bahan: row.kodeBahan,
    qty: row.qty,
    lokasi: row.lokasi,
    jenis_pemakaian: row.jenisPemakaian,
    pic: row.pic
  } as never);
  if (error) throw new Error(error.message);
}

export async function updatePemakaianOutlet(row: PemakaianOutlet) {
  const { error } = await supabaseAdmin()
    .from("pemakaian_outlet")
    .update({
      tanggal: row.tanggal,
      kode_bahan: row.kodeBahan,
      qty: row.qty,
      lokasi: row.lokasi,
      jenis_pemakaian: row.jenisPemakaian,
      pic: row.pic
    } as never)
    .eq("id", row.id!);
  if (error) throw new Error(error.message);
}

export async function deletePemakaianOutlet(id: string) {
  const { error } = await supabaseAdmin().from("pemakaian_outlet").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function insertWasteSelisih(row: WasteSelisih) {
  const { error } = await supabaseAdmin().from("waste_selisih").insert({
    id: row.id!,
    tanggal: row.tanggal,
    kode_bahan: row.kodeBahan,
    lokasi: row.lokasi,
    jenis: row.jenis,
    qty: row.qty,
    alasan: row.alasan
  } as never);
  if (error) throw new Error(error.message);
}

export async function updateWasteSelisih(row: WasteSelisih) {
  const { error } = await supabaseAdmin()
    .from("waste_selisih")
    .update({
      tanggal: row.tanggal,
      kode_bahan: row.kodeBahan,
      lokasi: row.lokasi,
      jenis: row.jenis,
      qty: row.qty,
      alasan: row.alasan
    } as never)
    .eq("id", row.id!);
  if (error) throw new Error(error.message);
}

export async function deleteWasteSelisih(id: string) {
  const { error } = await supabaseAdmin().from("waste_selisih").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function insertOpnameAwal(row: OpnameAwal) {
  const { error } = await supabaseAdmin().from("opname_awal").insert({
    id: row.id!,
    tanggal: row.tanggal,
    kode_bahan: row.kodeBahan,
    lokasi: row.lokasi,
    qty_awal: row.qtyAwal
  } as never);
  if (error) throw new Error(error.message);
}

export async function updateOpnameAwal(row: OpnameAwal) {
  const { error } = await supabaseAdmin()
    .from("opname_awal")
    .update({
      tanggal: row.tanggal,
      kode_bahan: row.kodeBahan,
      lokasi: row.lokasi,
      qty_awal: row.qtyAwal
    } as never)
    .eq("id", row.id!);
  if (error) throw new Error(error.message);
}

export async function deleteOpnameAwal(id: string) {
  const { error } = await supabaseAdmin().from("opname_awal").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function insertMasterLokasi(row: MasterLokasi) {
  const { error } = await supabaseAdmin().from("master_lokasi").insert({
    kode: row.kode,
    nama_lokasi: row.namaLokasi,
    jenis: row.jenis
  } as never);
  if (error) throw new Error(error.message);
}

export async function updateMasterLokasi(row: MasterLokasi) {
  const { error } = await supabaseAdmin()
    .from("master_lokasi")
    .update({ nama_lokasi: row.namaLokasi, jenis: row.jenis } as never)
    .eq("kode", row.kode);
  if (error) throw new Error(error.message);
}

export async function deleteMasterLokasi(kode: string) {
  const { error } = await supabaseAdmin().from("master_lokasi").delete().eq("kode", kode);
  if (error) throw new Error(error.message);
}
