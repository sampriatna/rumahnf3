import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { isSupabaseInventoryEnabled } from "@/lib/inventory-sheets-enabled";
import {
  pullMasterBahan,
  pullMasterLokasi,
  pullMasterSupplier,
  pullBarangMasuk,
  pullTransferStok,
  pullPemakaianOutlet,
  pullWasteSelisih,
  pullOpnameAwal
} from "@/lib/db/inventory-sheets-repo";
import { buildSaldoMap, countStatusStok } from "@/lib/inventory-metrics";

export const dynamic = "force-dynamic";

/** Health inventory untuk post-deploy — tanpa auth, tanpa PII. */
export async function GET() {
  const inventorySource = process.env.INVENTORY_SOURCE?.toLowerCase() ?? "inherit";
  const writerActive = isSupabaseInventoryEnabled() && isSupabaseConfigured();

  const checks: Record<string, boolean> = {
    supabase_configured: isSupabaseConfigured(),
    inventory_supabase: isSupabaseInventoryEnabled(),
    writer_active: writerActive
  };

  let counts: Record<string, number> = {};
  let statusCounts: { beli: number; waspada: number; aman: number } | null = null;
  let anomaliNegatif = 0;
  let error: string | undefined;

  if (isSupabaseConfigured() && isSupabaseInventoryEnabled()) {
    try {
      const [bahan, lokasi, supplier, masuk, transfer, pemakaian, waste, opname] = await Promise.all([
        pullMasterBahan(),
        pullMasterLokasi(),
        pullMasterSupplier(),
        pullBarangMasuk(),
        pullTransferStok(),
        pullPemakaianOutlet(),
        pullWasteSelisih(),
        pullOpnameAwal()
      ]);

      counts = {
        master_bahan: bahan.length,
        master_lokasi: lokasi.length,
        master_supplier: supplier.length,
        barang_masuk: masuk.length,
        transfer_stok: transfer.length,
        pemakaian_outlet: pemakaian.length,
        waste_selisih: waste.length,
        opname_awal: opname.length
      };

      checks.master_bahan = bahan.length > 0;
      checks.master_lokasi = lokasi.length > 0;

      const bundle = { opname, masuk, transfer, pemakaian, waste };
      statusCounts = countStatusStok(bahan, lokasi, bundle);
      const saldoMap = buildSaldoMap(bahan, lokasi, bundle);
      anomaliNegatif = Object.values(saldoMap).reduce((n, row) => {
        return (
          n +
          Object.keys(row)
            .filter((k) => k !== "total")
            .filter((k) => (row[k] ?? 0) < 0).length
        );
      }, 0);

      checks.saldo_engine = true;
    } catch (e) {
      error = e instanceof Error ? e.message : "inventory pull failed";
      checks.saldo_engine = false;
    }
  }

  const ok =
    checks.supabase_configured &&
    checks.inventory_supabase &&
    checks.master_bahan !== false &&
    checks.master_lokasi !== false &&
    checks.saldo_engine !== false;

  return NextResponse.json(
    {
      ok,
      service: "rumah-nf3-inventory",
      inventorySource,
      writerActive,
      checks,
      counts,
      statusCounts,
      anomaliNegatif,
      error
    },
    { status: ok ? 200 : 503 }
  );
}
