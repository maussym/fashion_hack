from __future__ import annotations
from pydantic import BaseModel


class ColorInfo(BaseModel):
    name_ru: str
    hex: str
    group: str  # neutral | warm | cool | accent


class CatalogItem(BaseModel):
    id: str
    name_ru: str
    category: str  # top | bottom | shoes | accessory
    subcategory: str
    styles: list[str]  # casual | sport | office | evening
    color: ColorInfo
    gender: str  # male | female | unisex
    price: int
    image_url: str
    overlay_image_url: str | None = None  # PNG with transparency for try-on
    season: list[str]
    brand: str


class OutfitRequest(BaseModel):
    style: str = "casual"
    scenario: str | None = None
    gender: str = "unisex"
    season: str | None = None
    budget_max: int | None = None


class OutfitItem(BaseModel):
    item: CatalogItem
    role: str  # top | bottom | shoes | accessory


class Outfit(BaseModel):
    score: float
    items: list[OutfitItem]
    total_price: int


class OutfitResponse(BaseModel):
    outfits: list[Outfit]


class TryOnRequest(BaseModel):
    photo_base64: str
    item_id: str


class TryOnResponse(BaseModel):
    result_base64: str
    landmarks_detected: bool
    message: str | None = None
