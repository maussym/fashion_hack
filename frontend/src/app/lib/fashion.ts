import { CatalogItem } from "./types";

const ITEM_LABELS: Record<string, string> = { top: "Верх", bottom: "Низ", shoes: "Обувь", accessory: "Аксессуар" };
const GENDER_LABELS: Record<string, string> = { male: "Мужской", female: "Женский", unisex: "Унисекс" };
const SEASON_LABELS: Record<string, string> = { spring: "Весна", summer: "Лето", autumn: "Осень", winter: "Зима" };
const STYLE_LABELS: Record<string, string> = { casual: "Casual", office: "Office", sport: "Sport", evening: "Evening" };
const SCENARIO_LABELS: Record<string, string> = {
  work: "Для работы", rest: "Для отдыха", travel: "Для поездки",
  date: "Для свидания", event: "Для мероприятия", training: "Для тренировки",
};

export function formatPrice(value: number): string {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value) + " ₸";
}

export function getCategoryLabel(category: string): string { return ITEM_LABELS[category] ?? category; }
export function getRoleLabel(role: string): string { return ITEM_LABELS[role] ?? role; }
export function getGenderLabel(gender: string): string { return GENDER_LABELS[gender] ?? gender; }
export function getSeasonLabel(season: string): string { return SEASON_LABELS[season] ?? season; }
export function getStyleLabel(style: string): string { return STYLE_LABELS[style] ?? style; }
export function getScenarioLabel(scenario: string): string { return SCENARIO_LABELS[scenario] ?? scenario; }

export function isTryOnCompatible(item: CatalogItem): boolean {
  return item.category === "top" || item.category === "bottom";
}

export {
  buildProductDetails, buildOutfitDescription, uniqueItems,
} from "./fashion-utils";
