"""Outfit generation API routes."""

from fastapi import APIRouter

from models.schemas import OutfitRequest, OutfitResponse
from services.outfit_engine import generate_outfits

router = APIRouter()


@router.post("/outfits/generate", response_model=OutfitResponse)
def generate(request: OutfitRequest):
    """Generate styled outfit combinations."""
    outfits = generate_outfits(
        style=request.style,
        scenario=request.scenario,
        gender=request.gender,
        season=request.season,
        budget_max=request.budget_max,
    )
    return OutfitResponse(outfits=outfits)
