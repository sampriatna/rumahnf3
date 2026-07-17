# Template CSV → Supabase Inventory (Google Sheets export)

Export tiap tab Sheets sebagai CSV, simpan di folder ini dengan nama file persis:

| File | Tab Sheets |
|------|------------|
| `master_lokasi.csv` | Master Lokasi |
| `master_bahan.csv` | Master Bahan |
| `opname_awal.csv` | Opname Awal |
| `barang_masuk.csv` | Barang Masuk |
| `transfer_stok.csv` | Transfer Stok |
| `pemakaian_outlet.csv` | Pemakaian Outlet |
| `waste_selisih.csv` | Waste / Selisih |

Header kolom **snake_case** (sesuai SQL). Tanggal format `YYYY-MM-DD` atau ISO datetime.

## Kondisioning otomatis (dari template Sheets)

```bash
# 1. SQL sekali di Supabase: supabase/inventory-sheets.sql

# 2. Satu perintah — konversi + master + harga patokan + import:
npm run condition:inventory

# Atau dengan path CSV custom:
npm run condition:inventory -- "C:\Downloads\Barang_Masuk.csv"

# 3. Sync env + deploy:
npm run sync:vercel-env
```

## Import manual

```bash
npm run import:inventory
```

## Env production

```
INVENTORY_SOURCE=supabase
```

`master_bahan.harga_per_satuan_pakai` = harga patokan (nilai stok).  
`barang_masuk.total_harga` = harga beli aktual per nota (nanti link ke finance).

## Validasi saat import

- `barang_masuk.lokasi_tujuan` tidak boleh kosong
- `transfer_stok`: `dari_lokasi` ≠ `ke_lokasi`
- `qty` > 0 pada semua movement
