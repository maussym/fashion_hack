export const snapshotCache = new Map<string, { raw: string | null; parsed: unknown }>();

export function invalidateCache(key: string): void {
  snapshotCache.delete(key);
}

export function getCachedList(key: string): string[] {
  const raw = localStorage.getItem(key);
  const cached = snapshotCache.get(key);
  if (cached && cached.raw === raw) return cached.parsed as string[];
  const parsed: string[] = raw ? JSON.parse(raw) : [];
  snapshotCache.set(key, { raw, parsed });
  return parsed;
}

export function writeList(key: string, list: string[]): void {
  localStorage.setItem(key, JSON.stringify(list));
  invalidateCache(key);
  emitChange();
}

const storeListeners = new Set<() => void>();

export function emitChange(): void {
  storeListeners.forEach((fn) => fn());
}

export function subscribe(callback: () => void): () => void {
  storeListeners.add(callback);
  return () => storeListeners.delete(callback);
}
