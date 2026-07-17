import { resolveMenuImage, resolveMenuEmoji } from "@/lib/menu-images";
import type { MenuItem } from "@/lib/pos-kds-roadmap";

export function MenuItemThumb({
  item,
  size = "md"
}: {
  item: Pick<MenuItem, "id" | "name" | "imageUrl" | "categoryId">;
  size?: "sm" | "md" | "lg";
}) {
  const image = resolveMenuImage(item);
  const emoji = resolveMenuEmoji(item);
  const dim =
    size === "sm" ? "h-12 w-12" : size === "lg" ? "h-28 w-28" : "h-16 w-16";
  const text = size === "sm" ? "text-xl" : size === "lg" ? "text-4xl" : "text-2xl";

  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={item.name}
        className={`${dim} shrink-0 rounded-xl object-cover bg-slate-100`}
      />
    );
  }

  return (
    <span
      className={`${dim} flex shrink-0 items-center justify-center rounded-xl bg-gold-50 ${text}`}
      aria-hidden
    >
      {emoji}
    </span>
  );
}
