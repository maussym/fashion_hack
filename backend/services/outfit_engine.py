"""Outfit generation engine — rule-based with color scoring and price diversity."""

from __future__ import annotations

import random
from itertools import product as iter_product

from models.schemas import CatalogItem, Outfit, OutfitItem
from services.catalog_cache import get_catalog
from services.color_compat import outfit_color_score

# Scenario -> style mapping
SCENARIO_STYLES: dict[str, list[str]] = {
    "прогулка": ["casual"],
    "свидание": ["casual", "evening"],
    "собеседование": ["office"],
    "вечеринка": ["evening"],
    "работа": ["office"],
    "офис": ["office"],
    "спорт": ["sport"],
    "тренировка": ["sport"],
    "отдых": ["casual"],
    "путешествие": ["casual", "sport"],
    "мероприятие": ["evening"],
    "work": ["office"],
    "office": ["office"],
    "rest": ["casual"],
    "travel": ["casual", "sport"],
    "date": ["casual", "evening"],
    "event": ["evening"],
    "training": ["sport"],
    "walk": ["casual"],
    "sport": ["sport"],
}

# Season compatibility bonuses
_SEASON_COMPAT: dict[tuple[str, str], float] = {
    ("winter", "autumn"): 0.7,
    ("autumn", "spring"): 0.6,
    ("spring", "summer"): 0.7,
    ("summer", "spring"): 0.7,
}


def _filter_items(
    items: list[CatalogItem],
    styles: list[str],
    gender: str,
    season: str | None,
    category: str,
) -> list[CatalogItem]:
    """Filter catalog items by style, gender, season, and category."""
    result = []
    for item in items:
        if item.category != category:
            continue
        if not any(s in item.styles for s in styles):
            continue
        if gender != "unisex" and item.gender not in (gender, "unisex"):
            continue
        if season and season not in item.season:
            continue
        result.append(item)
    return result


def _brand_diversity_bonus(items: list[CatalogItem]) -> float:
    """Bonus for mixing different brands (more realistic outfits)."""
    brands = {item.brand for item in items}
    if len(brands) >= 3:
        return 0.08
    if len(brands) >= 2:
        return 0.04
    return 0.0


def _price_balance_score(items: list[CatalogItem]) -> float:
    """Penalize extreme price imbalance within an outfit."""
    if len(items) < 2:
        return 1.0
    prices = [item.price for item in items]
    avg = sum(prices) / len(prices)
    if avg == 0:
        return 1.0
    variance = sum((p - avg) ** 2 for p in prices) / len(prices)
    cv = (variance ** 0.5) / avg  # coefficient of variation
    # CV < 0.5 is balanced, > 1.5 is very unbalanced
    if cv < 0.3:
        return 1.0
    if cv < 0.7:
        return 0.95
    if cv < 1.0:
        return 0.85
    return 0.75


def _season_coherence(items: list[CatalogItem], target_season: str | None) -> float:
    """Score how well items match each other's seasonal suitability."""
    if not target_season:
        return 1.0
    matches = sum(1 for item in items if target_season in item.season)
    return matches / len(items)


def _subcategory_diversity(items: list[CatalogItem]) -> float:
    """Bonus for varied subcategories (not all the same type)."""
    subs = {item.subcategory for item in items}
    return min(1.0, len(subs) / max(len(items) - 1, 1))


def _score_outfit(
    items: list[CatalogItem],
    target_styles: list[str],
    target_season: str | None = None,
) -> float:
    """Score an outfit based on multiple factors."""
    # Color harmony (primary factor)
    colors = [(item.color.hex, item.color.group) for item in items]
    color_score = outfit_color_score(colors)

    # Style coherence
    style_counts: dict[str, int] = {}
    for item in items:
        for s in item.styles:
            if s in target_styles:
                style_counts[s] = style_counts.get(s, 0) + 1
    max_style_count = max(style_counts.values()) if style_counts else 0
    style_score = max_style_count / len(items)

    # Additional scoring factors
    brand_bonus = _brand_diversity_bonus(items)
    price_factor = _price_balance_score(items)
    season_factor = _season_coherence(items, target_season)
    diversity_bonus = _subcategory_diversity(items) * 0.05

    # Weighted combination
    base = (
        0.45 * color_score
        + 0.25 * style_score
        + 0.15 * season_factor
        + 0.15 * price_factor
    )
    # Apply bonuses
    bonus_factor = 1.0 + brand_bonus + diversity_bonus
    raw = base * bonus_factor

    # Penalize lack of accessories (outfits with 4 items score higher)
    if len(items) < 4:
        raw *= 0.92

    # Map to realistic display range (0.60-0.96)
    final = 0.60 + raw * 0.36
    return round(max(0.60, min(0.96, final)), 2)


def generate_outfits(
    style: str = "casual",
    scenario: str | None = None,
    gender: str = "unisex",
    season: str | None = None,
    max_results: int = 5,
    budget_max: int | None = None,
) -> list[Outfit]:
    """Generate scored outfit combinations."""
    catalog = get_catalog()

    # Determine target styles
    if scenario and scenario.lower() in SCENARIO_STYLES:
        target_styles = SCENARIO_STYLES[scenario.lower()]
    else:
        target_styles = [style]

    # Filter items by category
    tops = _filter_items(catalog, target_styles, gender, season, "top")
    bottoms = _filter_items(catalog, target_styles, gender, season, "bottom")
    shoes = _filter_items(catalog, target_styles, gender, season, "shoes")
    accessories = _filter_items(catalog, target_styles, gender, season, "accessory")

    if not tops or not bottoms or not shoes:
        if not tops:
            tops = [i for i in catalog if i.category == "top"][:5]
        if not bottoms:
            bottoms = [i for i in catalog if i.category == "bottom"][:5]
        if not shoes:
            shoes = [i for i in catalog if i.category == "shoes"][:5]

    acc_options: list[CatalogItem | None] = accessories[:8] if accessories else []
    acc_options_with_none: list[CatalogItem | None] = [None] + acc_options

    # Limit combinations
    random.shuffle(tops)
    random.shuffle(bottoms)
    random.shuffle(shoes)
    tops = tops[:6]
    bottoms = bottoms[:6]
    shoes = shoes[:5]
    acc_options_with_none = acc_options_with_none[:5]

    # Score all combinations
    scored: list[tuple[float, list[CatalogItem]]] = []
    for top, bottom, shoe in iter_product(tops, bottoms, shoes):
        best_acc: CatalogItem | None = None
        best_score = -1.0
        for acc in acc_options_with_none:
            items = [top, bottom, shoe] + ([acc] if acc else [])
            score = _score_outfit(items, target_styles, season)
            if score > best_score:
                best_score = score
                best_acc = acc

        items = [top, bottom, shoe] + ([best_acc] if best_acc else [])
        total_price = sum(i.price for i in items)

        # Budget filter
        if budget_max and total_price > budget_max:
            continue

        scored.append((best_score, items))

    scored.sort(key=lambda x: x[0], reverse=True)

    # Deduplicate by top-bottom combo + ensure item diversity
    seen_combos: set[str] = set()
    seen_items: dict[str, int] = {}
    results: list[Outfit] = []

    for score, items in scored:
        combo_key = f"{items[0].id}-{items[1].id}"
        if combo_key in seen_combos:
            continue

        # Limit how often single items repeat across outfits
        repeat_penalty = sum(seen_items.get(i.id, 0) for i in items)
        if repeat_penalty > 2:
            continue

        seen_combos.add(combo_key)
        for item in items:
            seen_items[item.id] = seen_items.get(item.id, 0) + 1

        outfit_items = [
            OutfitItem(item=item, role=item.category)
            for item in items
        ]

        results.append(
            Outfit(
                score=round(score, 2),
                items=outfit_items,
                total_price=sum(i.price for i in items),
            )
        )
        if len(results) >= max_results:
            break

    return results
