import type { FormType } from "./forms";

/** Pengelompokan form staf — supaya daftar tidak menumpuk tanpa struktur. */
export const STAFF_FORM_GROUPS: {
  id: string;
  label: string;
  hint?: string;
  types: FormType[];
}[] = [
  {
    id: "bantuan",
    label: "Bantuan & Kendala",
    hint: "Ada masalah? Mulai dari sini.",
    types: ["lapor_kendala", "komplain_pelanggan"]
  },
  {
    id: "izin",
    label: "Izin & Kehadiran",
    types: ["izin"]
  },
  {
    id: "shift",
    label: "Shift & Outlet",
    types: ["opening_outlet", "closing_outlet", "handover_shift"]
  },
  {
    id: "stok",
    label: "Stok & Bahan",
    types: [
      "request_bahan",
      "waste_bahan",
      "stock_opname",
      "barang_masuk",
      "barang_keluar",
      "konfirmasi_terima_bahan",
      "waste_produksi_nf",
      "hasil_packing_nf"
    ]
  },
  {
    id: "kas",
    label: "Kas & Setoran",
    types: [
      "setoran_kasir",
      "pengeluaran_kas_kecil",
      "kasbon",
      "selisih_kas",
      "upload_nota"
    ]
  }
];

export function groupStaffForms<T extends { type: FormType }>(
  forms: T[]
): { group: (typeof STAFF_FORM_GROUPS)[number]; forms: T[] }[] {
  const byType = new Map(forms.map((f) => [f.type, f]));
  const used = new Set<FormType>();

  const grouped = STAFF_FORM_GROUPS.map((group) => {
    const items = group.types
      .map((t) => byType.get(t))
      .filter((f): f is T => Boolean(f));
    items.forEach((f) => used.add(f.type));
    return { group, forms: items };
  }).filter((g) => g.forms.length > 0);

  const rest = forms.filter((f) => !used.has(f.type));
  if (rest.length) {
    grouped.push({
      group: { id: "lainnya", label: "Lainnya", types: rest.map((f) => f.type) },
      forms: rest
    });
  }

  return grouped;
}
