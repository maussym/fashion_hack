"""Virtual Try-On API routes."""

import logging
from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import Response, JSONResponse
from pydantic import BaseModel
import httpx

from models.schemas import TryOnRequest, TryOnResponse
from services.catalog_cache import get_catalog
from services.nano_tryon import (
    NANO_KEYS, upload_to_hosting, nano_generate, nano_poll,
)

logger = logging.getLogger(__name__)
router = APIRouter()


class TryOnOutfitRequest(BaseModel):
    photo_base64: str
    item_ids: list[str]


@router.post("/tryon", response_model=TryOnResponse)
def try_on(request: TryOnRequest):
    from services.tryon_engine import process_tryon
    result = process_tryon(photo_base64=request.photo_base64, item_id=request.item_id)
    return TryOnResponse(**result)


@router.post("/tryon/outfit", response_model=TryOnResponse)
def try_on_outfit(request: TryOnOutfitRequest):
    from services.tryon_engine import process_tryon_outfit
    result = process_tryon_outfit(photo_base64=request.photo_base64, item_ids=request.item_ids)
    return TryOnResponse(**result)


@router.post("/tryon/ai")
async def try_on_ai(
    person: UploadFile = File(..., description="Person photo (JPG/PNG)"),
    item_id: str = Form(..., description="Catalog item ID"),
    item_ids: str = Form("", description="Comma-separated item IDs for outfit"),
):
    if not NANO_KEYS:
        return JSONResponse({"error": "NANO_KEYS not configured"}, status_code=500)

    catalog = get_catalog()
    ids = [i.strip() for i in item_ids.split(",") if i.strip()] if item_ids else [item_id]
    items = [next((i for i in catalog if i.id == iid), None) for iid in ids]
    items = [i for i in items if i is not None]
    if not items:
        return JSONResponse({"error": "No valid items found"}, status_code=404)

    category = "outfit" if len(items) > 1 else items[0].category
    person_bytes = await person.read()

    try:
        person_url = await upload_to_hosting(person_bytes, "person.jpg")
        cloth_urls = [i.image_url for i in items]

        task_id = await nano_generate(person_url, cloth_urls, category)
        logger.info("NanoBanana task: %s", task_id)

        result_url = await nano_poll(task_id)
        logger.info("NanoBanana result: %s", result_url)

        async with httpx.AsyncClient(timeout=120) as client:
            r = await client.get(result_url)
            r.raise_for_status()

        return Response(content=r.content, media_type="image/png")
    except TimeoutError as e:
        return JSONResponse({"error": str(e)}, status_code=504)
    except (ValueError, RuntimeError) as e:
        return JSONResponse({"error": str(e)}, status_code=502)
    except httpx.HTTPError as e:
        logger.exception("HTTP error")
        return JSONResponse({"error": f"HTTP error: {e}"}, status_code=502)
    except Exception:
        logger.exception("Unexpected error")
        return JSONResponse({"error": "Internal server error"}, status_code=500)
