import { CatalogItem, Outfit } from "./types";
import { getCategoryLabel, getStyleLabel, getSeasonLabel, getGenderLabel, getRoleLabel } from "./fashion";

export function buildProductDetails(item: CatalogItem): string[] {
  return [
    `Категория: ${getCategoryLabel(item.category)} / ${item.subcategory}`,
    `Цвет: ${item.color.name_ru}`,
    `Стили: ${item.styles.map(getStyleLabel).join(", ")}`,
    `Сезон: ${item.season.map(getSeasonLabel).join(", ")}`,
    `Для кого: ${getGenderLabel(item.gender)}`,
  ];
}

export function buildOutfitDescription(outfit: Outfit): string {
  const roles = outfit.items.map(({ role }) => getRoleLabel(role).toLowerCase());
  return `Комплект собран из ${roles.join(", ")} с учетом сочетаемости цветов и общего стиля.`;
}

export function uniqueItems(items: CatalogItem[]): CatalogItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}
