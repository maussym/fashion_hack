"""Catalog API routes."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from models.schemas import CatalogItem
from services.catalog_cache import get_catalog, search_catalog

router = APIRouter()


@router.get("/catalog", response_model=list[CatalogItem])
def list_catalog(
    category: str | None = Query(None, description="Filter by category"),
    style: str | None = Query(None, description="Filter by style"),
    gender: str | None = Query(None, description="Filter by gender"),
    season: str | None = Query(None, description="Filter by season"),
):
    """Get all catalog items with optional filters."""
    return search_catalog("", category=category, style=style, gender=gender, season=season)


@router.get("/catalog/search", response_model=list[CatalogItem])
def search(
    q: str = Query("", description="Search query"),
    category: str | None = Query(None),
    style: str | None = Query(None),
    gender: str | None = Query(None),
    season: str | None = Query(None),
    min_price: int | None = Query(None),
    max_price: int | None = Query(None),
):
    """Full-text search across catalog."""
    return search_catalog(
        q, category=category, style=style, gender=gender,
        season=season, min_price=min_price, max_price=max_price,
    )


@router.get("/catalog/{item_id}", response_model=CatalogItem)
def get_catalog_item(item_id: str):
    """Get a single catalog item by ID."""
    items = get_catalog()
    item = next((i for i in items if i.id == item_id), None)
    if item is None:
        raise HTTPException(status_code=404, detail="Товар не найден")
    return item
