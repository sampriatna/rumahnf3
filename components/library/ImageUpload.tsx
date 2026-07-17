"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { MenuItemThumb } from "./MenuItemThumb";

const ERRORS: Record<string, string> = {
  no_file: "Pilih file gambar dulu.",
  too_large: "File terlalu besar (maks 2 MB).",
  bad_type: "Format harus JPG, PNG, atau WebP.",
  upload_failed: "Gagal upload — cek bucket menu-images di Supabase.",
  no_supabase: "Supabase belum terhubung.",
  forbidden: "Tidak punya akses upload."
};

export function ImageUpload({
  outletId,
  itemId,
  itemName,
  categoryId,
  defaultUrl,
  onUrlChange
}: {
  outletId: string;
  itemId?: string;
  itemName: string;
  categoryId?: string;
  defaultUrl?: string;
  onUrlChange?: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(defaultUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewItem = {
    id: itemId ?? "new",
    name: itemName || "Produk",
    imageUrl: url || undefined,
    categoryId
  };

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("outletId", outletId);
      body.set("itemId", itemId ?? "new");
      const res = await fetch("/api/library/upload-image", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) {
        setError(ERRORS[json.error] ?? json.detail ?? "Upload gagal.");
        return;
      }
      setUrl(json.url);
      onUrlChange?.(json.url);
    } catch {
      setError("Koneksi gagal. Coba lagi.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="text-xs font-bold text-slate-500">Foto Produk</label>
      <input type="hidden" name="uploadedImageUrl" value={url} />
      <div className="mt-2 flex flex-wrap items-start gap-4">
        <MenuItemThumb item={previewItem} size="lg" />
        <div className="flex min-w-[180px] flex-1 flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="btn-secondary flex items-center justify-center gap-2 py-3 text-sm"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Camera className="h-4 w-4" aria-hidden />
            )}
            {uploading ? "Mengupload..." : "Upload Foto"}
          </button>
          {url && (
            <button
              type="button"
              onClick={() => {
                setUrl("");
                onUrlChange?.("");
              }}
              className="flex items-center gap-1 text-xs font-bold text-rose-600 hover:underline"
            >
              <X className="h-3 w-3" aria-hidden />
              Hapus foto
            </button>
          )}
          <p className="text-[11px] text-slate-400">JPG/PNG/WebP, maks 2 MB. Mirip upload foto di Moka.</p>
        </div>
      </div>
      {error && (
        <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{error}</p>
      )}
    </div>
  );
}
