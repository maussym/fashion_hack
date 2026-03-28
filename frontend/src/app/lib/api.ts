import { CatalogItem, OutfitRequest, OutfitResponse, StylistResponse, TryOnRequest, TryOnResponse } from "./types";

type CatalogFilters = Partial<{ category: string; style: string; gender: string; season: string }>;

const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {};

export const API_BASE_URL = (viteEnv.VITE_API_BASE_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");
export const STYLIST_API_URL = (viteEnv.VITE_STYLIST_API_URL ?? "http://127.0.0.1:8002").replace(/\/$/, "");

const API_PREFIX = `${API_BASE_URL}/api`;

async function requestJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!response.ok) {
    let message = `Ошибка запроса: ${response.status}`;
    try {
      const payload = await response.json();
      if (typeof payload?.detail === "string") message = payload.detail;
    } catch {}
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export function resolveAssetUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function fetchCatalog(filters: CatalogFilters = {}): Promise<CatalogItem[]> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return requestJson<CatalogItem[]>(`${API_PREFIX}/catalog${suffix}`, { method: "GET" });
}

export async function fetchCatalogItem(id: string): Promise<CatalogItem> {
  return requestJson<CatalogItem>(`${API_PREFIX}/catalog/${id}`, { method: "GET" });
}

export async function generateOutfits(payload: OutfitRequest) {
  const data = await requestJson<OutfitResponse>(`${API_PREFIX}/outfits/generate`, {
    method: "POST", body: JSON.stringify(payload),
  });
  return data.outfits;
}

export async function runTryOn(payload: TryOnRequest): Promise<TryOnResponse> {
  return requestJson<TryOnResponse>(`${API_PREFIX}/tryon`, { method: "POST", body: JSON.stringify(payload) });
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

export async function runTryOnAI(personDataUrl: string, itemId: string): Promise<string> {
  const personBlob = await dataUrlToBlob(personDataUrl);
  const form = new FormData();
  form.append("person", personBlob, "person.jpg");
  form.append("item_id", itemId);
  const resp = await fetch(`${API_PREFIX}/tryon/ai`, { method: "POST", body: form });
  if (!resp.ok) {
    let msg = `Ошибка примерки: ${resp.status}`;
    try { const j = await resp.json(); if (j?.error) msg = j.error; } catch {}
    throw new Error(msg);
  }
  const blob = await resp.blob();
  return URL.createObjectURL(blob);
}

export async function runTryOnOutfit(payload: { photo_base64: string; item_ids: string[] }): Promise<TryOnResponse> {
  return requestJson<TryOnResponse>(`${API_PREFIX}/tryon/outfit`, { method: "POST", body: JSON.stringify(payload) });
}

export async function askStylist(query: string, sessionId?: string): Promise<StylistResponse> {
  return requestJson<StylistResponse>(`${STYLIST_API_URL}/outfit/text`, {
    method: "POST",
    body: JSON.stringify({ query, session_id: sessionId, items_per_cat: 3 }),
  });
}

export async function searchCatalog(params: {
  q?: string; category?: string; style?: string; gender?: string;
  season?: string; min_price?: number; max_price?: number;
}): Promise<CatalogItem[]> {
  const urlParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") urlParams.set(key, String(value));
  });
  const suffix = urlParams.toString() ? `?${urlParams.toString()}` : "";
  return requestJson<CatalogItem[]>(`${API_PREFIX}/catalog/search${suffix}`, { method: "GET" });
}
