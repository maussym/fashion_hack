import os

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config import IMAGES_DIR
from routers import catalog, outfits, tryon

app = FastAPI(
    title="AI Stylist & Virtual Try-On",
    description="Fashion marketplace AI backend — AVISHU",
    version="1.0.0",
)

# CORS: read allowed origins from env, fallback to permissive for dev
_origins_raw = os.getenv("CORS_ORIGINS", "*")
_origins = [o.strip() for o in _origins_raw.split(",")] if _origins_raw != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(catalog.router, prefix="/api", tags=["catalog"])
app.include_router(outfits.router, prefix="/api", tags=["outfits"])
app.include_router(tryon.router, prefix="/api", tags=["tryon"])

IMAGES_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/images", StaticFiles(directory=str(IMAGES_DIR)), name="images")


@app.get("/api/health")
def health():
    return {"status": "ok"}
