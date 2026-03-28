import { useCallback, useSyncExternalStore } from "react";
import { snapshotCache, invalidateCache, emitChange, subscribe } from "./store-core";

export interface CartEntry {
  productId: string;
  size: string;
  qty: number;
}

const CART_KEY = "avishu_cart";

export function getCachedCart(): CartEntry[] {
  const raw = localStorage.getItem(CART_KEY);
  const cached = snapshotCache.get(CART_KEY);
  if (cached && cached.raw === raw) return cached.parsed as CartEntry[];
  const parsed: CartEntry[] = raw ? JSON.parse(raw) : [];
  snapshotCache.set(CART_KEY, { raw, parsed });
  return parsed;
}

export function writeCart(entries: CartEntry[]): void {
  localStorage.setItem(CART_KEY, JSON.stringify(entries));
  invalidateCache(CART_KEY);
  invalidateCache(CART_KEY + "_count");
  emitChange();
}

export function addToCart(productId: string, size: string): void {
  const cart = [...getCachedCart()];
  const existing = cart.find((e) => e.productId === productId && e.size === size);
  if (existing) { existing.qty += 1; } else { cart.push({ productId, size, qty: 1 }); }
  writeCart(cart);
}

export function removeFromCart(productId: string, size: string): void {
  writeCart(getCachedCart().filter((e) => !(e.productId === productId && e.size === size)));
}

export function updateCartQty(productId: string, size: string, qty: number): void {
  if (qty <= 0) { removeFromCart(productId, size); return; }
  const cart = [...getCachedCart()];
  const entry = cart.find((e) => e.productId === productId && e.size === size);
  if (entry) { entry.qty = qty; writeCart(cart); }
}

export function clearCart(): void {
  writeCart([]);
}

let cachedCartCount: { raw: string | null; count: number } = { raw: null, count: 0 };

export function getCartCount(): number {
  const raw = localStorage.getItem(CART_KEY);
  if (cachedCartCount.raw === raw) return cachedCartCount.count;
  const entries: CartEntry[] = raw ? JSON.parse(raw) : [];
  const count = entries.reduce((sum, e) => sum + e.qty, 0);
  cachedCartCount = { raw, count };
  return count;
}

const EMPTY_CART: CartEntry[] = [];

export function useCart(): CartEntry[] {
  return useSyncExternalStore(subscribe, getCachedCart, () => EMPTY_CART);
}

export function useCartCount(): number {
  return useSyncExternalStore(subscribe, getCartCount, () => 0);
}
