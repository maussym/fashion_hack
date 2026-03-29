"""
main.py
======
Обновленный FastAPI для AI Stylist с поддержкой ассистента и кэширования сессий.
"""
import sys
import io
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import uuid  # Для генерации ID сессий
from typing import Dict, Any, Optional
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
from fastapi.staticfiles import StaticFiles

# Твои модули
from embeddings import embedder
from module1.stylist_search import build_custom_outfit, find_similar, _search
from module1.stylist_llm import get_outfit_for_query

app = FastAPI(title="AI Stylist Assistant API", version="2.0")

# Разрешаем запросы с фронтенда (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение статики (картинок)
AVISHU_IMAGES  = os.path.join("data", "avishu_images")
DATASET_IMAGES = os.path.join("data")

if os.path.exists(DATASET_IMAGES):
    app.mount("/images/dataset", StaticFiles(directory=DATASET_IMAGES), name="dataset_images")
    app.mount("/static_images",  StaticFiles(directory=DATASET_IMAGES), name="static_images")

if os.path.exists(AVISHU_IMAGES):
    app.mount("/images/avishu", StaticFiles(directory=AVISHU_IMAGES), name="avishu_images")
# --- КЭШ СЕССИЙ (Память ассистента) ---
# Храним: session_id -> { "gender": ..., "style": ..., "last_query": ... }
sessions_cache: Dict[str, Any] = {}

# ── Схемы данных ─────────────────────────────────────────────
class TextOutfitRequest(BaseModel):
    query:         str
    session_id:    Optional[str] = None  # ID для поддержки контекста
    items_per_cat: int = 3

# ── POST /outfit/text (Режим Ассистента) ──────────────────────
@app.post("/outfit/text")
async def outfit_from_text(req: TextOutfitRequest):
    """
    Пайплайн ассистента: текст + контекст -> ЛЛМ -> Qdrant -> ответ.
    """
    # 1. Работа с сессией
    s_id = req.session_id or str(uuid.uuid4())[:8]
    prev_context = sessions_cache.get(s_id)
    
    try:
        # 2. Вызываем стилиста с учетом памяти
        result = get_outfit_for_query(
            req.query, 
            prev_context=prev_context, 
            items_per_cat=req.items_per_cat
        )
        
        if not result or "error" in result:
             raise HTTPException(status_code=400, detail=result.get("error", "LLM processing failed"))

        # 3. Сохраняем новые параметры в кэш (обновляем память)
        sessions_cache[s_id] = result.get("params")
        
        exp = result.get("explanation", {})
        return {
            "session_id":    s_id,
            "outfit_name":   exp.get("outfit_name"),
            "occasion":      exp.get("occasion"),
            "explanation":   exp.get("explanation"),
            "why_it_works":  exp.get("why_it_works"),
            "style_tips":    exp.get("style_tips", []),
            "fashion_score": result.get("fashion_score", 0.0),
            "items":         result.get("outfit", {}).get("items", {}),
            "params":        result.get("params"), # Для отладки
        }
    except Exception as e:
        print(f"Error in /outfit/text: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ── POST /outfit/image ────────────────────────────────────────
@app.post("/outfit/image")
async def outfit_from_image(
    file:          UploadFile = File(...),
    gender:        str = None,
    style:         str = None,
    items_per_cat: int = 3,
):
    try:
        img_bytes = await file.read()
        pil_image = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        vector    = embedder.image_from_pil(pil_image)
        
        if vector is None:
            raise HTTPException(status_code=500, detail="Embedding failed")

        outfit = build_custom_outfit(
            vector=vector,
            target_categories=["top", "bottom", "shoes", "accessory"],
            gender=gender,
            style=style,
            items_per_cat=items_per_cat,
        )

        all_scores = [i["score"] for items in outfit["items"].values() for i in items]
        avg_score = sum(all_scores) / max(len(all_scores), 1)

        return {
            "fashion_score": round(avg_score * 100, 1),
            "items": outfit["items"],
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ── Дополнительные эндпоинты ──────────────────────────────────

@app.get("/search")
async def search_items(query: str, category: str = "top", gender: str = None, top_k: int = 5):
    vector = embedder.text(query)
    results = _search(vector=vector, category=category, gender=gender, top_k=top_k)
    return {"results": results}

@app.post("/session/reset")
async def reset_session(session_id: str):
    """Сброс памяти ассистента для конкретного пользователя."""
    if session_id in sessions_cache:
        del sessions_cache[session_id]
        return {"status": "success", "message": f"Session {session_id} reset"}
    return {"status": "not_found"}

@app.get("/health")
async def health():
    return {
        "status": "ok", 
        "active_sessions": len(sessions_cache),
        "image_storage": "connected" if os.path.exists(DATASET_IMAGES) else "error"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)