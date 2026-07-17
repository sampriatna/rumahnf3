"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import {
  saveMasterBahan,
  removeMasterBahan,
  saveMasterLokasi,
  removeMasterLokasi,
  saveMasterSupplier,
  removeMasterSupplier,
  saveBarangMasuk,
  removeBarangMasuk,
  saveTransferStok,
  removeTransferStok,
  savePemakaianOutlet,
  removePemakaianOutlet,
  saveWasteSelisih,
  removeWasteSelisih,
  saveOpnameAwal,
  removeOpnameAwal,
  toIsoDate
} from "@/lib/inventory-crud";
import type { KodeLokasi, MetodeStok, StatusAktifBahan } from "@/types/inventory";

const ROLES = ["owner", "admin"];

const REVALIDATE = [
  "/inventory",
  "/inventory/data",
  "/dashboard",
  "/kds",
  "/settings/inventory-closing"
];

function guard() {
  const session = getSession();
  if (!session || !ROLES.includes(session.role)) redirect("/dashboard");
  return session;
}

function revalidateInventory() {
  for (const p of REVALIDATE) revalidatePath(p);
}

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function num(v: FormDataEntryValue | null) {
  return Number(v ?? 0);
}

function str(v: FormDataEntryValue | null) {
  return String(v ?? "").trim();
}

export async function saveBahanAction(formData: FormData) {
  guard();
  const mode = str(formData.get("mode")) as "create" | "update";
  const path = "/inventory/data/bahan";
  try {
    await saveMasterBahan(
      {
        kodeBahan: str(formData.get("kodeBahan")).toUpperCase(),
        namaBaku: str(formData.get("namaBaku")),
        kategori: str(formData.get("kategori")),
        satuanBeli: str(formData.get("satuanBeli")),
        satuanPakai: str(formData.get("satuanPakai")),
        konversi: num(formData.get("konversi")) || 1,
        hargaPerSatuanPakai: num(formData.get("hargaPerSatuanPakai")),
        supplierUtama: str(formData.get("supplierUtama")),
        stokMinimum: num(formData.get("stokMinimum")),
        stokAman: num(formData.get("stokAman")),
        stokMaksimum: num(formData.get("stokMaksimum")),
        statusAktif: (str(formData.get("statusAktif")) || "Aktif") as StatusAktifBahan,
        metodeStok: (str(formData.get("metodeStok")) || "Distok") as MetodeStok
      },
      mode
    );
    revalidateInventory();
    redirect(`${path}?saved=1`);
  } catch (e) {
    fail(path, e instanceof Error ? e.message : "Gagal simpan master bahan.");
  }
}

export async function deleteBahanAction(formData: FormData) {
  guard();
  const path = "/inventory/data/bahan";
  const kode = str(formData.get("kodeBahan"));
  try {
    await removeMasterBahan(kode);
    revalidateInventory();
    redirect(`${path}?saved=1`);
  } catch (e) {
    fail(path, e instanceof Error ? e.message : "Gagal hapus — mungkin masih dipakai di transaksi.");
  }
}

export async function saveLokasiAction(formData: FormData) {
  guard();
  const mode = str(formData.get("mode")) as "create" | "update";
  const path = "/inventory/data/lokasi";
  try {
    await saveMasterLokasi(
      {
        kode: str(formData.get("kode")).toUpperCase() as KodeLokasi,
        namaLokasi: str(formData.get("namaLokasi")),
        jenis: str(formData.get("jenis"))
      },
      mode
    );
    revalidateInventory();
    redirect(`${path}?saved=1`);
  } catch (e) {
    fail(path, e instanceof Error ? e.message : "Gagal simpan lokasi.");
  }
}

export async function deleteLokasiAction(formData: FormData) {
  guard();
  const path = "/inventory/data/lokasi";
  try {
    await removeMasterLokasi(str(formData.get("kode")));
    revalidateInventory();
    redirect(`${path}?saved=1`);
  } catch (e) {
    fail(path, e instanceof Error ? e.message : "Gagal hapus lokasi.");
  }
}

export async function saveSupplierAction(formData: FormData) {
  guard();
  const mode = str(formData.get("mode")) as "create" | "update";
  const path = "/inventory/data/supplier";
  try {
    await saveMasterSupplier(
      {
        kode: str(formData.get("kode")).toUpperCase(),
        nama: str(formData.get("nama")),
        kategori: str(formData.get("kategori")),
        hariOrder: str(formData.get("hariOrder"))
      },
      mode
    );
    revalidateInventory();
    redirect(`${path}?saved=1`);
  } catch (e) {
    fail(path, e instanceof Error ? e.message : "Gagal simpan supplier.");
  }
}

export async function deleteSupplierAction(formData: FormData) {
  guard();
  const path = "/inventory/data/supplier";
  try {
    await removeMasterSupplier(str(formData.get("kode")));
    revalidateInventory();
    redirect(`${path}?saved=1`);
  } catch (e) {
    fail(path, e instanceof Error ? e.message : "Gagal hapus supplier.");
  }
}

export async function saveBarangMasukAction(formData: FormData) {
  guard();
  const mode = str(formData.get("mode")) as "create" | "update";
  const path = "/inventory/data/barang-masuk";
  const id = str(formData.get("id"));
  try {
    await saveBarangMasuk(
      {
        id: id || undefined,
        tanggal: toIsoDate(str(formData.get("tanggal"))),
        kodeBahan: str(formData.get("kodeBahan")),
        qty: num(formData.get("qty")),
        satuan: str(formData.get("satuan")),
        totalHarga: num(formData.get("totalHarga")),
        supplier: str(formData.get("supplier")),
        lokasiTujuan: str(formData.get("lokasiTujuan")) as KodeLokasi,
        diterimaOleh: str(formData.get("diterimaOleh"))
      },
      mode
    );
    revalidateInventory();
    redirect(`${path}?saved=1`);
  } catch (e) {
    fail(path, e instanceof Error ? e.message : "Gagal simpan barang masuk.");
  }
}

export async function deleteBarangMasukAction(formData: FormData) {
  guard();
  const path = "/inventory/data/barang-masuk";
  try {
    await removeBarangMasuk(str(formData.get("id")));
    revalidateInventory();
    redirect(`${path}?saved=1`);
  } catch (e) {
    fail(path, e instanceof Error ? e.message : "Gagal hapus barang masuk.");
  }
}

export async function saveTransferAction(formData: FormData) {
  guard();
  const mode = str(formData.get("mode")) as "create" | "update";
  const path = "/inventory/data/transfer";
  try {
    await saveTransferStok(
      {
        id: str(formData.get("id")) || undefined,
        tanggal: toIsoDate(str(formData.get("tanggal"))),
        kodeBahan: str(formData.get("kodeBahan")),
        qty: num(formData.get("qty")),
        dariLokasi: str(formData.get("dariLokasi")),
        keLokasi: str(formData.get("keLokasi")),
        dikeluarkanOleh: str(formData.get("dikeluarkanOleh")),
        diterimaOleh: str(formData.get("diterimaOleh"))
      },
      mode
    );
    revalidateInventory();
    redirect(`${path}?saved=1`);
  } catch (e) {
    fail(path, e instanceof Error ? e.message : "Gagal simpan transfer.");
  }
}

export async function deleteTransferAction(formData: FormData) {
  guard();
  const path = "/inventory/data/transfer";
  try {
    await removeTransferStok(str(formData.get("id")));
    revalidateInventory();
    redirect(`${path}?saved=1`);
  } catch (e) {
    fail(path, e instanceof Error ? e.message : "Gagal hapus transfer.");
  }
}

export async function savePemakaianAction(formData: FormData) {
  guard();
  const mode = str(formData.get("mode")) as "create" | "update";
  const path = "/inventory/data/pemakaian";
  try {
    await savePemakaianOutlet(
      {
        id: str(formData.get("id")) || undefined,
        tanggal: toIsoDate(str(formData.get("tanggal"))),
        kodeBahan: str(formData.get("kodeBahan")),
        qty: num(formData.get("qty")),
        lokasi: str(formData.get("lokasi")),
        jenisPemakaian: str(formData.get("jenisPemakaian")),
        pic: str(formData.get("pic"))
      },
      mode
    );
    revalidateInventory();
    redirect(`${path}?saved=1`);
  } catch (e) {
    fail(path, e instanceof Error ? e.message : "Gagal simpan pemakaian.");
  }
}

export async function deletePemakaianAction(formData: FormData) {
  guard();
  const path = "/inventory/data/pemakaian";
  try {
    await removePemakaianOutlet(str(formData.get("id")));
    revalidateInventory();
    redirect(`${path}?saved=1`);
  } catch (e) {
    fail(path, e instanceof Error ? e.message : "Gagal hapus pemakaian.");
  }
}

export async function saveWasteAction(formData: FormData) {
  guard();
  const mode = str(formData.get("mode")) as "create" | "update";
  const path = "/inventory/data/waste";
  try {
    await saveWasteSelisih(
      {
        id: str(formData.get("id")) || undefined,
        tanggal: toIsoDate(str(formData.get("tanggal"))),
        kodeBahan: str(formData.get("kodeBahan")),
        lokasi: str(formData.get("lokasi")),
        jenis: str(formData.get("jenis")),
        qty: num(formData.get("qty")),
        alasan: str(formData.get("alasan"))
      },
      mode
    );
    revalidateInventory();
    redirect(`${path}?saved=1`);
  } catch (e) {
    fail(path, e instanceof Error ? e.message : "Gagal simpan waste.");
  }
}

export async function deleteWasteAction(formData: FormData) {
  guard();
  const path = "/inventory/data/waste";
  try {
    await removeWasteSelisih(str(formData.get("id")));
    revalidateInventory();
    redirect(`${path}?saved=1`);
  } catch (e) {
    fail(path, e instanceof Error ? e.message : "Gagal hapus waste.");
  }
}

export async function saveOpnameAction(formData: FormData) {
  guard();
  const mode = str(formData.get("mode")) as "create" | "update";
  const path = "/inventory/data/opname";
  try {
    await saveOpnameAwal(
      {
        id: str(formData.get("id")) || undefined,
        tanggal: toIsoDate(str(formData.get("tanggal"))),
        kodeBahan: str(formData.get("kodeBahan")),
        lokasi: str(formData.get("lokasi")),
        qtyAwal: num(formData.get("qtyAwal"))
      },
      mode
    );
    revalidateInventory();
    redirect(`${path}?saved=1`);
  } catch (e) {
    fail(path, e instanceof Error ? e.message : "Gagal simpan opname.");
  }
}

export async function deleteOpnameAction(formData: FormData) {
  guard();
  const path = "/inventory/data/opname";
  try {
    await removeOpnameAwal(str(formData.get("id")));
    revalidateInventory();
    redirect(`${path}?saved=1`);
  } catch (e) {
    fail(path, e instanceof Error ? e.message : "Gagal hapus opname.");
  }
}
