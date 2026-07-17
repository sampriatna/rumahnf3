"use client";

import { PRODUCT_EMOJI_OPTIONS } from "@/lib/menu-images";

export function EmojiPicker({
  name,
  defaultValue
}: {
  name: string;
  defaultValue?: string;
}) {
  const initial = defaultValue?.startsWith("emoji:")
    ? defaultValue.slice(6)
    : PRODUCT_EMOJI_OPTIONS[0];

  return (
    <div>
      <label className="text-xs font-bold text-slate-500">Ikon Produk</label>
      <input type="hidden" name={name} id={`${name}-value`} defaultValue={`emoji:${initial}`} />
      <div className="mt-1 flex flex-wrap gap-1.5 rounded-xl border border-slate-200 p-2">
        {PRODUCT_EMOJI_OPTIONS.map((e) => (
          <button
            key={e}
            type="button"
            data-emoji={e}
            default-data-selected={e === initial ? "1" : undefined}
            onClick={(ev) => {
              const input = document.getElementById(`${name}-value`) as HTMLInputElement | null;
              if (input) input.value = `emoji:${e}`;
              const parent = ev.currentTarget.parentElement;
              parent?.querySelectorAll("button").forEach((btn) => {
                btn.classList.remove("bg-navy-800", "text-white");
                btn.classList.add("hover:bg-slate-100");
              });
              ev.currentTarget.classList.add("bg-navy-800", "text-white");
              ev.currentTarget.classList.remove("hover:bg-slate-100");
            }}
            className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg ${
              e === initial ? "bg-navy-800 text-white" : "hover:bg-slate-100"
            }`}
          >
            {e}
          </button>
        ))}
      </div>
      <p className="mt-1 text-[11px] text-slate-400">
        Atau isi URL foto di bawah untuk pakai gambar asli.
      </p>
    </div>
  );
}
