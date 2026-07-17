import { formatRp } from "@/lib/finance";
import type { PosCartLine } from "@/lib/store";
import { updateCartQtyAction } from "@/app/pos-actions";

export function CartItem({
  line,
  outletId,
  shiftId
}: {
  line: PosCartLine;
  outletId: string;
  shiftId: string;
}) {
  return (
    <li className="pos-cart-line text-sm">
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-navy-900">{line.name}</p>
        <p className="text-xs text-slate-500">{formatRp(line.unitPrice)}</p>
        {line.modifiers && line.modifiers.length > 0 && (
          <p className="truncate text-[10px] text-slate-400">
            {line.modifiers.map((m) => m.name).join(", ")}
          </p>
        )}
        {line.kitchenNote && (
          <p className="truncate text-[10px] italic text-amber-700">{line.kitchenNote}</p>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <form action={updateCartQtyAction}>
          <input type="hidden" name="outletId" value={outletId} />
          <input type="hidden" name="shiftId" value={shiftId} />
          <input type="hidden" name="lineId" value={line.lineId} />
          <input type="hidden" name="qty" value={line.qty - 1} />
          <button type="submit" className="pos-qty-btn" aria-label="Kurangi">
            −
          </button>
        </form>
        <span className="w-7 text-center text-base font-black">{line.qty}</span>
        <form action={updateCartQtyAction}>
          <input type="hidden" name="outletId" value={outletId} />
          <input type="hidden" name="shiftId" value={shiftId} />
          <input type="hidden" name="lineId" value={line.lineId} />
          <input type="hidden" name="qty" value={line.qty + 1} />
          <button type="submit" className="pos-qty-btn" aria-label="Tambah">
            +
          </button>
        </form>
      </div>
    </li>
  );
}
