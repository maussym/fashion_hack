import { useCallback, useSyncExternalStore } from "react";
import { getCachedList, writeList, subscribe } from "./store-core";

const WISHLIST_KEY = "avishu_wishlist";

export function getWishlist(): string[] {
  return getCachedList(WISHLIST_KEY);
}

export function toggleWishlist(productId: string): boolean {
  const list = [...getCachedList(WISHLIST_KEY)];
  const idx = list.indexOf(productId);
  if (idx >= 0) { list.splice(idx, 1); writeList(WISHLIST_KEY, list); return false; }
  list.push(productId);
  writeList(WISHLIST_KEY, list);
  return true;
}

const EMPTY_LIST: string[] = [];

export function useWishlist(): [string[], (id: string) => void] {
  const list = useSyncExternalStore(subscribe, getWishlist, () => EMPTY_LIST);
  const toggleFn = useCallback((id: string) => toggleWishlist(id), []);
  return [list, toggleFn];
}
