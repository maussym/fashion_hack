export interface ColorInfo {
  name_ru: string;
  hex: string;
  group: string;
}

export interface CatalogItem {
  id: string;
  name_ru: string;
  category: "top" | "bottom" | "shoes" | "accessory";
  subcategory: string;
  styles: string[];
  color: ColorInfo;
  gender: "male" | "female" | "unisex";
  price: number;
  image_url: string;
  overlay_image_url?: string | null;
  season: string[];
  brand: string;
}

export interface OutfitItem {
  item: CatalogItem;
  role: string;
}

export interface Outfit {
  score: number;
  items: OutfitItem[];
  total_price: number;
}

export interface OutfitRequest {
  style: string;
  scenario?: string;
  gender: string;
  season?: string;
  budget_max?: number;
}

export interface OutfitResponse {
  outfits: Outfit[];
}

export interface StylistItem {
  score: number;
  name: string;
  category: string;
  category_raw: string;
  image: string;
  image_url: string;
  url: string;
  gender: string;
  color: string;
  style: string;
  brand: string;
  description: string;
}

export interface StylistResponse {
  session_id: string;
  outfit_name: string | null;
  occasion: string | null;
  explanation: string | null;
  why_it_works: string | null;
  style_tips: string[];
  fashion_score: number;
  items: Record<string, StylistItem[]>;
}

export interface TryOnRequest {
  photo_base64: string;
  item_id: string;
}

export interface TryOnResponse {
  result_base64: string;
  landmarks_detected: boolean;
  message?: string | null;
}
