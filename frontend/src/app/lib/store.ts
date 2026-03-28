import { useCallback, useSyncExternalStore } from "react";
import { getCachedList, writeList, subscribe } from "./store-core";

export type { CartEntry } from "./cart";
export {
  getCachedCart, writeCart,
  addToCart, removeFromCart, updateCartQty, clearCart,
  getCartCount, useCart, useCartCount,
} from "./cart";

export { getWishlist, toggleWishlist, useWishlist } from "./wishlist";

const OUTFIT_FAVS_KEY = "avishu_outfit_favs";

export function getOutfitFavorites(): string[] {
  return getCachedList(OUTFIT_FAVS_KEY);
}

export function toggleOutfitFavorite(outfitKey: string): boolean {
  const list = [...getCachedList(OUTFIT_FAVS_KEY)];
  const idx = list.indexOf(outfitKey);
  if (idx >= 0) { list.splice(idx, 1); writeList(OUTFIT_FAVS_KEY, list); return false; }
  list.push(outfitKey);
  writeList(OUTFIT_FAVS_KEY, list);
  return true;
}

const EMPTY_LIST: string[] = [];

export function useOutfitFavorites(): [string[], (key: string) => void] {
  const list = useSyncExternalStore(subscribe, getOutfitFavorites, () => EMPTY_LIST);
  const toggleFn = useCallback((key: string) => toggleOutfitFavorite(key), []);
  return [list, toggleFn];
}
