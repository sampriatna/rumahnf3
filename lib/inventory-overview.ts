import type { MasterBahan, MasterLokasi, StatusStok } from "@/types/inventory";
import { toOutletCode } from "./outlet-identity";
import {
  type InventoryMovementBundle,
  saldoLokasi,
  saldoTotal,
  statusStok,
  stokKritisList,
  buildSaldoMap,
  countStatusStok,
  totalNilaiStok,
  stokKritisByPrioritas,
  nilaiStokPerLokasi,
  anomaliStok
} from "./inventory-metrics";
import { loadInventoryBundle } from "./inventory-bundle-loader";

const WAREHOUSE_CODE = "GDG";

export type StockOverviewRow = {
  kodeBahan: string;
  namaBaku: string;
  kategori: string;
  satuanPakai: string;
  warehouseQty: number;
  outletQty: number;
  lokasiQty: Record<string, number>;
  totalQty: number;
  stokMinimum: number;
  stokAman: number;
  status: StatusStok;
  isCritical: boolean;
};

function outletIdToLokasi(outletId: string): string {
  return toOutletCode(outletId);
}

export function getDisplayLokasiColumns(
  lokasiList: MasterLokasi[],
  scopeOutletId?: string
): MasterLokasi[] {
  if (scopeOutletId) {
    const code = outletIdToLokasi(scopeOutletId);
    return lokasiList.filter((loc) => loc.kode === WAREHOUSE_CODE || loc.kode === code);
  }
  return lokasiList;
}

function outletLokasiCodes(lokasiList: MasterLokasi[], scopeOutletId?: string): string[] {
  if (scopeOutletId) return [outletIdToLokasi(scopeOutletId)];
  return lokasiList.filter((loc) => loc.kode !== WAREHOUSE_CODE).map((loc) => loc.kode);
}

function qtyAtLokasi(
  kodeBahan: string,
  lokasi: string,
  bundle: InventoryMovementBundle
): number {
  return saldoLokasi(
    kodeBahan,
    lokasi,
    bundle.opname,
    bundle.masuk,
    bundle.transfer,
    bundle.pemakaian,
    bundle.waste
  );
}

export function buildStockOverview(
  bahanList: MasterBahan[],
  lokasiList: MasterLokasi[],
  bundle: InventoryMovementBundle,
  scopeOutletId?: string
): StockOverviewRow[] {
  const outletCodes = outletLokasiCodes(lokasiList, scopeOutletId);

  return bahanList
    .filter((bahan) => bahan.statusAktif === "Aktif" && bahan.metodeStok === "Distok")
    .map((bahan) => {
      const lokasiQty: Record<string, number> = {};
      const visibleLokasi = scopeOutletId
        ? lokasiList.filter(
            (loc) =>
              loc.kode === WAREHOUSE_CODE || outletCodes.includes(loc.kode)
          )
        : lokasiList;

      for (const loc of visibleLokasi) {
        lokasiQty[loc.kode] = qtyAtLokasi(bahan.kodeBahan, loc.kode, bundle);
      }

      const warehouseQty = lokasiQty[WAREHOUSE_CODE] ?? 0;
      const outletQty = outletCodes.reduce(
        (sum, code) => sum + (lokasiQty[code] ?? 0),
        0
      );
      const totalQty = scopeOutletId
        ? warehouseQty + outletQty
        : saldoTotal(bahan.kodeBahan, lokasiList, bundle);
      const status = statusStok(totalQty, bahan);

      return {
        kodeBahan: bahan.kodeBahan,
        namaBaku: bahan.namaBaku,
        kategori: bahan.kategori,
        satuanPakai: bahan.satuanPakai,
        warehouseQty,
        outletQty,
        lokasiQty,
        totalQty,
        stokMinimum: bahan.stokMinimum,
        stokAman: bahan.stokAman,
        status,
        isCritical: status === "BELI" || status === "WASPADA"
      };
    })
    .sort((a, b) => {
      if (a.isCritical !== b.isCritical) return a.isCritical ? -1 : 1;
      if (a.status !== b.status) {
        const order: StatusStok[] = ["BELI", "WASPADA", "AMAN"];
        return order.indexOf(a.status) - order.indexOf(b.status);
      }
      return a.namaBaku.localeCompare(b.namaBaku, "id");
    });
}

export type NilaiLokasiRow = {
  kode: string;
  nama: string;
  jenis: string;
  nilai: number;
};

export type OwnerDashboardOverview = {
  totalNilaiStok: number;
  statusCounts: { beli: number; waspada: number; aman: number };
  nilaiPerLokasi: NilaiLokasiRow[];
  kritisTop: ReturnType<typeof stokKritisByPrioritas>;
  anomaliCount: number;
  saldoMap: ReturnType<typeof buildSaldoMap>;
};

export function buildOwnerDashboardOverview(
  bahanList: MasterBahan[],
  lokasiList: MasterLokasi[],
  bundle: InventoryMovementBundle
): OwnerDashboardOverview {
  const saldoMap = buildSaldoMap(bahanList, lokasiList, bundle);
  const anomali = anomaliStok(bahanList, lokasiList, bundle);

  return {
    totalNilaiStok: totalNilaiStok(bahanList, lokasiList, bundle),
    statusCounts: countStatusStok(bahanList, lokasiList, bundle),
    nilaiPerLokasi: lokasiList.map((loc) => ({
      kode: loc.kode,
      nama: loc.namaLokasi,
      jenis: loc.jenis,
      nilai: nilaiStokPerLokasi(loc.kode, bahanList, lokasiList, bundle)
    })),
    kritisTop: stokKritisByPrioritas(bahanList, lokasiList, bundle),
    anomaliCount: anomali.length,
    saldoMap
  };
}

export async function getInventoryStockOverview(scopeOutletId?: string) {
  const { bahanList, lokasiList, bundle } = await loadInventoryBundle();
  const rows = buildStockOverview(bahanList, lokasiList, bundle, scopeOutletId);
  const critical = stokKritisList(bahanList, lokasiList, bundle);
  const ownerDashboard = scopeOutletId
    ? undefined
    : buildOwnerDashboardOverview(bahanList, lokasiList, bundle);
  const lokasiColumns = getDisplayLokasiColumns(lokasiList, scopeOutletId);

  return {
    rows,
    critical,
    ownerDashboard,
    lokasiList,
    lokasiColumns,
    metrics: {
      totalBahan: rows.length,
      kritisBeli: critical.filter((item) => item.status === "BELI").length,
      kritisWaspada: critical.filter((item) => item.status === "WASPADA").length
    },
    sourceEmpty: bahanList.length === 0
  };
}
