import type { ReactNode } from "react";
import type { MenuItem, MenuItemVariant } from "@/lib/pos-kds-roadmap";
import { formatRp } from "@/lib/finance";
import { MenuItemThumb } from "@/components/library/MenuItemThumb";

function priceLabel(item: MenuItem, variants: MenuItemVariant[]) {
  if (variants.length) {
    const prices = variants.map((v) => v.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? formatRp(min) : `${formatRp(min)} – ${formatRp(max)}`;
  }
  return formatRp(item.basePrice);
}

export function ProductCardSoldOut({ item, tileClass }: { item: MenuItem; tileClass: string }) {
  return (
    <div className={`${tileClass} opacity-60`}>
      <div className="flex items-center gap-2 p-3">
        <MenuItemThumb item={item} size="sm" />
        <div className="min-w-0 flex-1">
          <span className="block truncate font-bold text-navy-900">{item.name}</span>
          <span className="text-sm font-semibold text-slate-400">{priceLabel(item, [])}</span>
        </div>
      </div>
      <span className="border-t border-rose-100 bg-rose-50 px-3 py-1.5 text-center text-[10px] font-bold uppercase text-rose-600">
        Habis
      </span>
    </div>
  );
}

export function ProductCardButton({
  item,
  tileClass,
  variants,
  needsPicker,
  onPickerOpen,
  form
}: {
  item: MenuItem;
  tileClass: string;
  variants: MenuItemVariant[];
  needsPicker: boolean;
  onPickerOpen: () => void;
  form?: ReactNode;
}) {
  const body = (
    <>
      <div className="flex items-center gap-2 p-3 pb-2">
        <MenuItemThumb item={item} size="sm" />
        <div className="min-w-0 flex-1">
          <span className="block truncate font-bold text-navy-900">{item.name}</span>
          <span className="text-sm font-semibold text-gold-700">{priceLabel(item, variants)}</span>
        </div>
      </div>
      {needsPicker && (
        <span className="border-t border-slate-50 px-3 py-1.5 text-[10px] font-bold uppercase text-slate-400">
          {variants.length > 0 ? "Pilih varian" : "+ add-on"}
        </span>
      )}
    </>
  );

  if (needsPicker) {
    return (
      <button type="button" onClick={onPickerOpen} className={tileClass}>
        {body}
      </button>
    );
  }

  return <div className={tileClass}>{form ?? body}</div>;
}
