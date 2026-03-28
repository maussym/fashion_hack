"""
add_avishu.py
=============
Читает data/avishu_catalog.json + фото из data/avishu_images/
Генерит CLIP эмбеддинги и добавляет в существующую коллекцию Qdrant.

Запуск:
  python add_avishu.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import json
import uuid
from pathlib import Path
from tqdm import tqdm
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct
from utils import detect_color, detect_style, detect_occasion, get_category_internal

from embeddings import embedder
from utils import enrich_record, get_category_internal

# ── Конфиг ────────────────────────────────────────────────────
AVISHU_JSON    = "data/avishu_catalog.json"
AVISHU_IMG_DIR = "data/avishu_images"
QDRANT_HOST    = "localhost"
QDRANT_PORT    = 6333
COLLECTION     = "catalog_items"

client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)

# ── Загрузка JSON ─────────────────────────────────────────────
print(f"Loading {AVISHU_JSON}...")
with open(AVISHU_JSON, "r", encoding="utf-8") as f:
    records = json.load(f)
print(f"  → {len(records)} products")

# ── Эмбеддинги + загрузка ─────────────────────────────────────
print(f"\nEmbedding and uploading to '{COLLECTION}'...")

points  = []
skipped = 0

for rec in tqdm(records, desc="AVISHU", unit="item"):
    img_file = rec.get("image_filename", "")
    img_path = Path(AVISHU_IMG_DIR) / img_file

    if not img_path.exists():
        print(f"  [SKIP] image not found: {img_path}")
        skipped += 1
        continue

    vector = embedder.image(str(img_path))
    if vector is None:
        skipped += 1
        continue

    category_raw = rec.get("category_raw", "")
    category     = rec.get("category") or get_category_internal(category_raw)

    payload = {
        "image_filename": img_file,
        "image_url":      rec.get("image_url", ""),
        "display_name":   rec.get("display_name", ""),
        "description":    rec.get("description", "")[:400],
        "category_raw":   category_raw,
        "category":       category,
        "url":            rec.get("url", ""),
        "source":         "avishu.kz",
        "is_kids": False, 
        "brand":          "AVISHU",
        "gender":         "women",
        "color_primary":  detect_color(rec.get("display_name", ""), rec.get("description", "")),
        "style":          detect_style(rec.get("display_name", ""), rec.get("description", ""), category_raw),
        "occasion":       detect_occasion(rec.get("display_name", ""), rec.get("description", ""), category_raw),
    }

    points.append(PointStruct(
        id=str(uuid.uuid4()),
        vector=vector,
        payload=payload,
    ))

# Загружаем все сразу
if points:
    client.upsert(collection_name=COLLECTION, points=points)

total = client.count(COLLECTION).count
print(f"\n✅ Added: {len(points)} | Skipped: {skipped}")
print(f"   Total in Qdrant: {total}")

# ── Тест ──────────────────────────────────────────────────────
print("\n── Test: search AVISHU items ──")
from qdrant_client.models import Filter, FieldCondition, MatchValue

results = client.query_points(
    collection_name=COLLECTION,
    query=points[0].vector,
    query_filter=Filter(
        must=[FieldCondition(key="source", match=MatchValue(value="avishu.kz"))]
    ),
    limit=3,
    with_payload=True,
).points

print("Top-3 AVISHU items similar to first product:")
for r in results:
    p = r.payload
    print(f"  [{r.score:.3f}] {p['display_name']} | {p['color_primary']}")

print("\n✅ AVISHU added to Qdrant!")