"""
stylist_search.py
=================
Строит полный образ (outfit) комбинируя:
  1. Cross-category поиск (верх → низ + обувь + аксессуар)
  2. Цветовая гармония (COLOR_HARMONY из utils.py)
  3. Gender фильтр
  4. Style/Occasion фильтр

Импортируется в api.py

Запуск для теста:
  python stylist_search.py
"""

import json
import os
import time
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue

from embeddings import embedder
from utils import (
    OUTFIT_RULES,
    COLOR_HARMONY,
    JUNK_CATEGORIES,
    detect_gender,
    detect_color,
    detect_style,
    detect_occasion,
    enrich_record,
)

# ── Конфиг ────────────────────────────────────────────────────
QDRANT_URL     = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
COLLECTION     = "catalog_items"
IMAGE_CDN      = os.getenv("IMAGE_CDN_URL", "")

if QDRANT_API_KEY:
    client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
else:
    client = QdrantClient(url=QDRANT_URL)

def get_image_url(image_filename: str, source: str = "kaggle") -> str:
    if IMAGE_CDN:
        return f"{IMAGE_CDN}/{image_filename}"
    if source == "avishu.kz":
        return f"/images/avishu/{image_filename}"
    return f"/images/dataset/{image_filename}"

# ── Базовый поиск ─────────────────────────────────────────────
def _search(
    vector:   list,
    category: str,
    gender:   str   = None,
    color:    str   = None,
    style:    str   = None,
    occasion: str   = None,
    top_k:    int   = 5,
) -> list:
    """
    Поиск с фильтрами. Все фильтры опциональны.
    Если с фильтрами мало результатов — добирает без них.
    """
    # Фикс 1: всегда исключаем детские товары
    must = [
        FieldCondition(key="category", match=MatchValue(value=category)),
        FieldCondition(key="is_kids",   match=MatchValue(value=False)),
    ]

    # Фикс 2: gender — women берёт women+unisex, men берёт men+unisex
    if gender and gender != "unisex":
        must.append(FieldCondition(key="gender", match=MatchValue(value=gender)))
    if style:
        must.append(FieldCondition(key="style", match=MatchValue(value=style)))

    # Фикс 3: must_not — запрещённые подкатегории по occasion
    OCCASION_BLACKLIST = {
        "party":   ["Socks", "Backpacks", "Sports Shoes"],
        "work":    ["Socks", "Backpacks", "Sports Shoes", "Sandals"],
        "evening": ["Socks", "Backpacks", "Sports Shoes"],
        "sport":   ["Heels", "Formal Shoes"],
    }
    must_not = []
    # после must_not = []
    if gender == "men":
        must_not.append(FieldCondition(key="gender", match=MatchValue(value="women")))
    elif gender == "women":
        must_not.append(FieldCondition(key="gender", match=MatchValue(value="men")))
    for junk in JUNK_CATEGORIES:
        must_not.append(FieldCondition(key="category_raw", match=MatchValue(value=junk)))
    if occasion and occasion in OCCASION_BLACKLIST:
        for banned in OCCASION_BLACKLIST[occasion]:
            must_not.append(FieldCondition(key="category_raw", match=MatchValue(value=banned)))

    # Цветовой фильтр — ищем гармоничные цвета
    color_filter = None
    if color and color in COLOR_HARMONY:
        harmonious = COLOR_HARMONY[color]
        color_filter = [
            FieldCondition(key="color_primary", match=MatchValue(value=c))
            for c in harmonious
        ]

    # Фикс 3: берём top_k*3 и фильтруем — больше шансов найти подходящее
    fetch_k = top_k * 3

    results = []
    if color_filter:
        try:
            results = client.query_points(
                collection_name=COLLECTION,
                query=vector,
                query_filter=Filter(
                    must=must,
                    must_not=must_not if must_not else None,
                    should=color_filter,
                ),
                limit=fetch_k,
                with_payload=True,
            ).points
        except Exception:
            pass

    if len(results) < top_k:
        results = client.query_points(
            collection_name=COLLECTION,
            query=vector,
            query_filter=Filter(
                must=must,
                must_not=must_not if must_not else None,
            ),
            limit=fetch_k,
            with_payload=True,
        ).points

    # Фолбек без фильтров если совсем пусто
    if not results:
        results = client.query_points(
            collection_name=COLLECTION,
            query=vector,
            query_filter=Filter(
                must=[
                    FieldCondition(key="category", match=MatchValue(value=category)),
                    FieldCondition(key="is_kids", match=MatchValue(value=False)),
                ] + ([FieldCondition(key="gender", match=MatchValue(value=gender))] if gender and gender != "unisex" else [])
            ),
            limit=fetch_k,
            with_payload=True,
        ).points

    # Берём только top_k из результатов
    results = results[:top_k]

    return [
        {
            "score":         round(r.score, 4),
            "name":          r.payload.get("display_name", "?"),
            "category":      r.payload.get("category", "?"),
            "category_raw":  r.payload.get("category_raw", "?"),
            "image":         r.payload.get("image_filename", "?"),
            "image_url": get_image_url(r.payload.get("image_filename", ""), r.payload.get("source", "kaggle")),
            "url":       r.payload.get("url", ""),
            "gender":        r.payload.get("gender", "?"),
            "color":         r.payload.get("color_primary", "?"),
            "style":         r.payload.get("style", "?"),
            "brand":         r.payload.get("brand", "?"),
            "description":   r.payload.get("description", "")[:100],
        }
        for r in results
    ]


# ── Главная функция ───────────────────────────────────────────
def build_outfit(
    vector:          list,
    source_category: str,
    gender:          str  = None,
    color:           str  = None,
    style:           str  = None,
    occasion:        str  = None,
    items_per_cat:   int  = 3,
) -> dict:
    """
    Строит полный образ из вектора входного товара.

    Args:
        vector:          CLIP вектор товара
        source_category: категория входного товара (top/bottom/shoes/accessory)
        gender:          men / women / unisex (автодетект если None)
        color:           доминантный цвет входного товара
        style:           casual / sport / formal / evening / ethnic
        occasion:        work / sport / casual / party / ethnic
        items_per_cat:   сколько вариантов на каждую категорию

    Returns:
        dict с ключами: meta, items
    """
    target_cats = OUTFIT_RULES.get(source_category, OUTFIT_RULES["other"])

    outfit_items = {}
    timings      = {}

    for cat in target_cats:
        start = time.perf_counter()
        results = _search(
            vector=vector,
            category=cat,
            gender=gender,
            color=color,
            style=style,
            occasion=occasion,
            top_k=items_per_cat,
        )
        timings[cat] = round((time.perf_counter() - start) * 1000, 1)
        outfit_items[cat] = results

    total_ms = sum(timings.values())

    return {
        "meta": {
            "source_category": source_category,
            "gender":          gender,
            "color":           color,
            "style":           style,
            "occasion":        occasion,
            "total_ms":        round(total_ms, 1),
            "timings":         timings,
        },
        "items": outfit_items,
    }


def build_outfit_from_text(
    query:    str,
    gender:   str = None,
    style:    str = None,
    occasion: str = None,
    source_category: str = "top",
    items_per_cat:   int = 3,
) -> dict:
    """Строит outfit по текстовому описанию."""
    vector = embedder.text(query)
    if vector is None:
        return {"error": "text embedding failed"}

    # Автодетект из запроса если не передан
    color = detect_color(query)

    return build_outfit(
        vector=vector,
        source_category=source_category,
        gender=gender,
        color=color,
        style=style,
        occasion=occasion,
        items_per_cat=items_per_cat,
    )


def build_outfit_from_record(record: dict, items_per_cat: int = 3) -> dict:
    """Строит outfit из записи vector_db.json."""
    vector   = record.get("vector")
    name     = record.get("display_name", "")
    desc     = record.get("description", "")
    cat_raw  = record.get("category_raw", "")
    enriched = enrich_record(record)

    return build_outfit(
        vector=vector,
        source_category=record.get("category", "other"),
        gender=enriched["gender"],
        color=enriched["color_primary"],
        style=enriched["style"],
        occasion=enriched["occasion"],
        items_per_cat=items_per_cat,
    )




# ── Валидация и постобработка образа ─────────────────────────
def validate_outfit(outfit: dict) -> dict:
    """
    Постобработка образа:
    1. Платье → убираем bottom
    2. Фильтр мусора по названию (test, unknown)
    3. Удаляем товары с score < 0.15
    """
    items = outfit.get("items", {})

    # Фикс 1: если top — платье, убираем bottom
    top_items = items.get("top", [])
    if top_items:
        top_name = top_items[0].get("name", "").lower()
        if any(w in top_name for w in ["dress", "gown", "saree", "платье", "сарафан"]):
            items.pop("bottom", None)
            outfit["meta"]["note"] = "Платье — самостоятельный элемент, низ не требуется"

    # Фикс 2: убираем мусорные записи
    JUNK_KEYWORDS = ["test", "unknown", "n/a", "null"]
    for cat in list(items.keys()):
        items[cat] = [
            item for item in items[cat]
            if not any(junk in item.get("name", "").lower() for junk in JUNK_KEYWORDS)
        ]

    # Фикс 3: убираем товары с score < 0.15
    SCORE_THRESHOLD = 0.15
    low_score_cats  = []
    for cat in list(items.keys()):
        items[cat] = [i for i in items[cat] if i.get("score", 0) >= SCORE_THRESHOLD]
        if not items[cat]:
            low_score_cats.append(cat)

    if low_score_cats:
        outfit["meta"]["low_score_warning"] = f"Мало подходящих товаров в: {low_score_cats}"

    outfit["items"] = items
    return outfit


# ── Custom outfit (для ЛЛМ) с Color Anchor и Brand Boost ─────
def build_custom_outfit(
    vector:            list,
    target_categories: list,
    gender:            str = None,
    color:             str = None,
    style:             str = None,
    occasion:          str = None,
    items_per_cat:     int = 3,
    anchor_brand:      str = None,
    search_query:      str = None,  # ← добавить
) -> dict:
    """
    Строит outfit по произвольному списку категорий.
    Color Anchor: цвет первого найденного товара передаётся остальным.
    Brand Boost:  бренд первого товара приоритизируется.
    """
    outfit_items = {}
    timings      = {}
    anchor_color = color
    anchor_brand = anchor_brand

    for cat in target_categories:
        start = time.perf_counter()

        # Category-specific вектор
        cat_vector = vector
        if search_query:
            from embeddings import get_text_vector_for_category
            cat_vec = get_text_vector_for_category(search_query, cat)
            if cat_vec:
                cat_vector = list(cat_vec)

        results = _search(
            vector=cat_vector,  # ← было vector
            category=cat,
            gender=gender,
            color=anchor_color,
            style=style,
            occasion=occasion,
            top_k=items_per_cat,
        )

        # Color Anchor — берём цвет первого найденного товара
        if results and anchor_color is None:
            anchor_color = results[0].get("color")

        # Brand Boost — если есть бренд якоря, добавляем бонус
        if anchor_brand and results:
            brand_matches = [r for r in results if r.get("brand", "").lower() == anchor_brand.lower()]
            others        = [r for r in results if r.get("brand", "").lower() != anchor_brand.lower()]
            results       = (brand_matches + others)[:items_per_cat]

        outfit_items[cat] = results
        timings[cat]      = round((time.perf_counter() - start) * 1000, 1)

    outfit = {
        "meta": {
            "target_categories": target_categories,
            "gender":            gender,
            "color":             anchor_color,
            "style":             style,
            "occasion":          occasion,
            "anchor_brand":      anchor_brand,
            "total_ms":          round(sum(timings.values()), 1),
            "timings":           timings,
        },
        "items": outfit_items,
    }

    return validate_outfit(outfit)

# ── Same-category похожие ─────────────────────────────────────
def find_similar(
    vector:         list,
    category:       str,
    exclude_image:  str = None,
    top_k:          int = 5,
) -> list:
    """Похожие товары в той же категории."""
    results = client.query_points(
        collection_name=COLLECTION,
        query=vector,
        query_filter=Filter(
            must=[FieldCondition(key="category", match=MatchValue(value=category))]
        ),
        limit=top_k + 1,
        with_payload=True,
    ).points

    filtered = []
    for r in results:
        if exclude_image and r.payload.get("image_filename") == exclude_image:
            continue
        filtered.append({
            "score":    round(r.score, 4),
            "name":     r.payload.get("display_name", "?"),
            "category": r.payload.get("category_raw", "?"),
            "image":    r.payload.get("image_filename", "?"),
            "color":    r.payload.get("color_primary", "?"),
            "brand":    r.payload.get("brand", "?"),
        })
        if len(filtered) >= top_k:
            break
    return filtered


# ── Pretty print ──────────────────────────────────────────────
def print_outfit(outfit: dict):
    meta  = outfit.get("meta", {})
    items = outfit.get("items", {})

    print(f"\n{'='*60}")
    print(f"  OUTFIT  |  {meta.get('total_ms')}ms total")
    print(f"  gender={meta.get('gender')} | color={meta.get('color')} | "
          f"style={meta.get('style')} | occasion={meta.get('occasion')}")
    print(f"{'='*60}")

    for cat, results in items.items():
        t = meta.get("timings", {}).get(cat, 0)
        print(f"\n  [{cat.upper()}]  ({t}ms)")
        for r in results:
            print(f"    [{r['score']:.4f}] {r['name']}")
            print(f"             {r['category_raw']} | {r['color']} | {r['brand']} | {r['image']}")


# ── Тесты ─────────────────────────────────────────────────────
if __name__ == "__main__":

    # Тест 1: текст → outfit
    print("\n" + "="*60)
    print("TEST 1: TEXT → OUTFIT")
    print("="*60)

    test_queries = [
        ("black nike sports shoes men",  "men",   "shoes",  "sport",  "sport"),
        ("white casual shirt men",       "men",   "top",    "casual", "casual"),
        ("blue denim jeans women",       "women", "bottom", "casual", "casual"),
        ("red evening dress women",      "women", "top",    "evening","party"),
    ]

    for query, gender, src_cat, style, occasion in test_queries:
        print(f"\nQuery: '{query}'")
        vector = embedder.text(query)
        if vector is None:
            print("  [SKIP]")
            continue
        color = detect_color(query)
        outfit = build_outfit(
            vector=vector,
            source_category=src_cat,
            gender=gender,
            color=color,
            style=style,
            occasion=occasion,
        )
        print_outfit(outfit)

    # Тест 2: вектор из БД → outfit
    print("\n" + "="*60)
    print("TEST 2: VECTOR FROM DB → OUTFIT")
    print("="*60)

    print("Loading vector_db.json...")
    with open("vector_db.json", "r", encoding="utf-8") as f:
        db = json.load(f)

    # Берём по одному из каждой категории
    seen = set()
    for rec in db:
        cat = rec.get("category", "other")
        if cat not in seen and cat in OUTFIT_RULES:
            seen.add(cat)
            name = rec.get("display_name", "?")
            print(f"\nSource: '{name}' [{cat}]")
            outfit = build_outfit_from_record(rec, items_per_cat=2)
            print_outfit(outfit)
        if len(seen) == 4:
            break

    # Тест 3: same-category похожие
    print("\n" + "="*60)
    print("TEST 3: SIMILAR IN CATEGORY")
    print("="*60)

    rec = next(r for r in db if r.get("category") == "top")
    vector = rec["vector"]
    name   = rec["display_name"]
    img    = rec["image_filename"]

    print(f"\nQuery: '{name}'")
    similar = find_similar(vector, "top", exclude_image=img, top_k=4)
    print("Similar tops:")
    for s in similar:
        print(f"  [{s['score']:.4f}] {s['name']} | {s['color']} | {s['brand']}")

    print("\n✅ Outfit builder done!")