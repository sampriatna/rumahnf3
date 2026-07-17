import type { MenuItem } from "./pos-kds-roadmap";

/** Emoji fallback per kategori saat belum ada foto. */
const CATEGORY_EMOJI: Record<string, string> = {
  "cat-kbu-kopi": "☕",
  "cat-kbu-minum": "🥤",
  "cat-kbu-makan": "🍜",
  "cat-kbu-snack": "🍟"
};

/** Foto demo per item (Unsplash — hanya untuk seed/placeholder). */
export const DEMO_MENU_IMAGES: Record<string, string> = {
  "mi-espresso": "https://images.unsplash.com/photo-1510595026899-0d3f0e6c355b?w=240&h=240&fit=crop",
  "mi-latte": "https://images.unsplash.com/photo-1561882468-9110e03ace0f?w=240&h=240&fit=crop",
  "mi-cappuccino": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=240&h=240&fit=crop",
  "mi-v60": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=240&h=240&fit=crop",
  "mi-teh-tarik": "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=240&h=240&fit=crop",
  "mi-matcha": "https://images.unsplash.com/photo-1515823064-df6fc192f9b2?w=240&h=240&fit=crop",
  "mi-air-mineral": "https://images.unsplash.com/photo-1548839140-5a941f94e586?w=240&h=240&fit=crop",
  "mi-nasi-goreng": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=240&h=240&fit=crop",
  "mi-mie-goreng": "https://images.unsplash.com/photo-1569718212165-3a8278dfe5b3?w=240&h=240&fit=crop",
  "mi-sate-ayam": "https://images.unsplash.com/photo-1529042410759-befb1204c468?w=240&h=240&fit=crop",
  "mi-kentang": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=240&h=240&fit=crop",
  "mi-pisang": "https://images.unsplash.com/photo-1606914509763-9c6aaac2f4f1?w=240&h=240&fit=crop"
};

export function menuItemEmoji(categoryId?: string): string {
  if (!categoryId) return "🍽️";
  return CATEGORY_EMOJI[categoryId] ?? "🍽️";
}

/** Emoji siap pilih di form Library (tanpa perlu URL). */
export const PRODUCT_EMOJI_OPTIONS = [
  "☕", "🥤", "🍜", "🍟", "🍰", "🥐", "🍗", "🍕", "🍔", "🧋", "🍵", "🍹", "🥗", "🍱", "🍩"
] as const;

export function isEmojiImage(url?: string): boolean {
  return Boolean(url?.startsWith("emoji:"));
}

export function emojiFromImageUrl(url?: string): string | null {
  if (!url?.startsWith("emoji:")) return null;
  return url.slice(6) || null;
}

export function resolveMenuImage(item: Pick<MenuItem, "id" | "imageUrl" | "categoryId">): string | null {
  if (isEmojiImage(item.imageUrl)) return null;
  return item.imageUrl ?? DEMO_MENU_IMAGES[item.id] ?? null;
}

export function resolveMenuEmoji(item: Pick<MenuItem, "imageUrl" | "categoryId">): string {
  return emojiFromImageUrl(item.imageUrl) ?? menuItemEmoji(item.categoryId);
}
