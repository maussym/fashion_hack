"""Cached catalog loader — singleton with file-mtime invalidation."""

from __future__ import annotations

import json
import os
import threading

from config import CATALOG_PATH
from models.schemas import CatalogItem

_lock = threading.Lock()
_cache: list[CatalogItem] | None = None
_cache_mtime: float = 0.0


def get_catalog() -> list[CatalogItem]:
    """Return cached catalog, reloading only when the file changes."""
    global _cache, _cache_mtime

    mtime = os.path.getmtime(CATALOG_PATH)
    if _cache is not None and mtime == _cache_mtime:
        return _cache

    with _lock:
        # Double-check after acquiring lock
        mtime = os.path.getmtime(CATALOG_PATH)
        if _cache is not None and mtime == _cache_mtime:
            return _cache

        with open(CATALOG_PATH, encoding="utf-8") as f:
            data = json.load(f)

        _cache = [CatalogItem(**item) for item in data]
        _cache_mtime = mtime
        return _cache


def search_catalog(
    query: str,
    category: str | None = None,
    style: str | None = None,
    gender: str | None = None,
    season: str | None = None,
    min_price: int | None = None,
    max_price: int | None = None,
) -> list[CatalogItem]:
    """Full-text search across catalog with filters."""
    items = get_catalog()
    q = query.lower().strip() if query else ""

    results: list[CatalogItem] = []
    for item in items:
        # Filter by category
        if category and item.category != category:
            continue
        # Filter by style
        if style and style not in item.styles:
            continue
        # Filter by gender
        if gender and gender != "unisex" and item.gender not in (gender, "unisex"):
            continue
        # Filter by season
        if season and season not in item.season:
            continue
        # Filter by price range
        if min_price is not None and item.price < min_price:
            continue
        if max_price is not None and item.price > max_price:
            continue

        # Text search across name, brand, subcategory, color
        if q:
            searchable = " ".join([
                item.name_ru.lower(),
                item.brand.lower(),
                item.subcategory.lower(),
                item.color.name_ru.lower(),
                item.category.lower(),
                " ".join(item.styles),
            ])
            if q not in searchable:
                continue

        results.append(item)

    return results
