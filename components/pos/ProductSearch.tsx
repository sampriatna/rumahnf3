"use client";

import { Search } from "lucide-react";

export function ProductSearch({
  value,
  onChange,
  resultCount
}: {
  value: string;
  onChange: (value: string) => void;
  resultCount?: number;
}) {
  return (
    <div className="relative mb-4">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Cari menu…"
        className="nf3-input w-full pl-9 pr-3 py-2.5 text-sm"
        aria-label="Cari produk menu"
      />
      {value.trim() && resultCount != null && (
        <p className="nf3-subtle mt-1">{resultCount} produk cocok</p>
      )}
    </div>
  );
}
