// Registry QR shortcut. QR = pintu cepat (bukan form/DB).
// Scan QR -> redirect ke form/SOP yang sudah ter-prefilled (area, jenis, dll).

export type QrShortcut = {
  code: string;
  label: string;
  outletCode: string;
  area: string;
  /** Path tujuan (relatif). */
  target: string;
};

export const QR_SHORTCUTS: QrShortcut[] = [
  {
    code: "kbu-dapur-request-bahan",
    label: "Request Bahan — Dapur KBU",
    outletCode: "KBU",
    area: "Dapur",
    target: "/staff/form/request_bahan?area=Dapur&outlet=kbu"
  },
  {
    code: "kbu-dapur-kendala",
    label: "Lapor Kendala — Dapur KBU",
    outletCode: "KBU",
    area: "Dapur",
    target: "/staff/form/lapor_kendala?area=Dapur&outlet=kbu"
  },
  {
    code: "kbu-bar-request-bahan",
    label: "Request Susu/Kopi/Cup — Bar KBU",
    outletCode: "KBU",
    area: "Bar",
    target: "/staff/form/request_bahan?area=Bar&outlet=kbu"
  },
  {
    code: "kbu-kasir-kendala-pos",
    label: "Lapor Kendala POS — Kasir KBU",
    outletCode: "KBU",
    area: "Kasir",
    target: "/staff/form/lapor_kendala?area=Kasir&jenis=POS%20Error&outlet=kbu"
  },
  {
    code: "smt-dapur-request-bahan",
    label: "Request Bahan — Dapur Samtaro",
    outletCode: "SMT",
    area: "Dapur",
    target: "/staff/form/request_bahan?area=Dapur&outlet=samtaro"
  },
  {
    code: "kbu-dapur-waste",
    label: "Waste Bahan — Dapur KBU",
    outletCode: "KBU",
    area: "Dapur",
    target: "/staff/form/waste_bahan?area=Dapur&outlet=kbu"
  },
  {
    code: "kbu-gudang-opname",
    label: "Stock Opname — Gudang KBU",
    outletCode: "KBU",
    area: "Gudang",
    target: "/staff/form/stock_opname?lokasi=Gudang%20Outlet&outlet=kbu"
  },
  {
    code: "kbu-bar-opening",
    label: "Opening Outlet — Bar KBU",
    outletCode: "KBU",
    area: "Bar",
    target: "/staff/form/opening_outlet?area=Bar&outlet=kbu"
  },
  {
    code: "kbu-dapur-closing",
    label: "Closing Outlet — Dapur KBU",
    outletCode: "KBU",
    area: "Dapur",
    target: "/staff/form/closing_outlet?area=Dapur&outlet=kbu"
  },
  {
    code: "kbu-kasir-setoran",
    label: "Setoran Kasir — KBU",
    outletCode: "KBU",
    area: "Kasir",
    target: "/staff/form/setoran_kasir?outlet=kbu"
  },
  {
    code: "kbu-kasir-selisih",
    label: "Selisih Kas — Kasir KBU",
    outletCode: "KBU",
    area: "Kasir",
    target: "/staff/form/selisih_kas?outlet=kbu"
  },
  {
    code: "smt-kasir-setoran",
    label: "Setoran Kasir — Samtaro",
    outletCode: "SMT",
    area: "Kasir",
    target: "/staff/form/setoran_kasir?outlet=samtaro"
  }
];

export function getShortcut(code: string) {
  return QR_SHORTCUTS.find((s) => s.code === code);
}
