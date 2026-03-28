"""
setup_qdrant.py
===============
Один запуск делает всё:
  1. Создаёт коллекцию в Qdrant
  2. Загружает векторы из vector_db.json
  3. Обогащает payload (gender, color, style, occasion, brand)

Запуск:
  docker run -d --name qdrant -p 6333:6333 qdrant/qdrant
  python setup_qdrant.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import json
import uuid
from tqdm import tqdm
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

from utils import enrich_record, get_category_internal  # ← из utils.py

# ── Конфиг ────────────────────────────────────────────────────
VECTOR_DB_JSON = "vector_db.json"
QDRANT_URL     = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
COLLECTION     = "catalog_items"
BATCH_SIZE     = 256

if QDRANT_API_KEY:
    client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
else:
    client = QdrantClient(url=QDRANT_URL)

# ── 1. Создание коллекции ─────────────────────────────────────
print("Setting up Qdrant collection...")
if client.collection_exists(COLLECTION):
    client.delete_collection(COLLECTION)

client.create_collection(
    collection_name=COLLECTION,
    vectors_config=VectorParams(size=512, distance=Distance.COSINE),
)
print(f"  -> Collection '{COLLECTION}' created")

# ── 2. Загрузка JSON ──────────────────────────────────────────
print(f"\nLoading {VECTOR_DB_JSON}...")
with open(VECTOR_DB_JSON, "r", encoding="utf-8") as f:
    records = json.load(f)
print(f"  -> {len(records)} records")

# ── 3. Загрузка + обогащение за один проход ───────────────────
print(f"\nUploading + enriching (batch={BATCH_SIZE})...")

batch: list[PointStruct] = []
skipped = 0
indexed = 0

for record in tqdm(records, desc="Processing", unit="item"):
    vector = record.get("vector")
    if not vector or len(vector) != 512:
        skipped += 1
        continue

    # Базовые поля
    category_raw = record.get("category_raw", "")
    payload = {
        "image_filename": record.get("image_filename", ""),
        "display_name":   record.get("display_name", ""),
        "description":    record.get("description", "")[:400],
        "category_raw":   category_raw,
        "category":       record.get("category") or get_category_internal(category_raw),
    }

    # Обогащённые поля из utils.py
    payload.update(enrich_record(record))

    batch.append(PointStruct(
        id=str(uuid.uuid4()),
        vector=vector,
        payload=payload,
    ))

    if len(batch) >= BATCH_SIZE:
        client.upsert(collection_name=COLLECTION, points=batch)
        indexed += len(batch)
        batch = []

if batch:
    client.upsert(collection_name=COLLECTION, points=batch)
    indexed += len(batch)

total = client.count(COLLECTION).count
print(f"\n[OK] Done! Indexed: {indexed} | Skipped: {skipped}")
print(f"   Total in Qdrant: {total}")

# ── 4. Статистика ─────────────────────────────────────────────
from collections import Counter
gender_c  = Counter()
color_c   = Counter()
style_c   = Counter()
occasion_c = Counter()

for rec in records:
    e = enrich_record(rec)
    gender_c[e["gender"]]          += 1
    color_c[e["color_primary"]]    += 1
    style_c[e["style"]]            += 1
    occasion_c[e["occasion"]]      += 1

print("\n[Stats] Payload stats:")
print("\nGender:")
for k, v in gender_c.most_common():
    bar = "#" * (v // 500)
    print(f"  {k:<10} {v:>5}  {bar}")

print("\nColor (top 8):")
for k, v in color_c.most_common(8):
    bar = "#" * (v // 300)
    print(f"  {k:<10} {v:>5}  {bar}")

print("\nStyle:")
for k, v in style_c.most_common():
    bar = "#" * (v // 500)
    print(f"  {k:<10} {v:>5}  {bar}")

print("\nOccasion:")
for k, v in occasion_c.most_common():
    bar = "#" * (v // 500)
    print(f"  {k:<10} {v:>5}  {bar}")

# ── 5. Тест поиска с новыми полями ────────────────────────────
print("\n-- Test: search with enriched payload --")
from qdrant_client.models import Filter, FieldCondition, MatchValue

# Берём вектор первого элемента
test_vector = records[0]["vector"]

results = client.query_points(
    collection_name=COLLECTION,
    query=test_vector,
    query_filter=Filter(must=[
        FieldCondition(key="gender",   match=MatchValue(value="men")),
        FieldCondition(key="category", match=MatchValue(value="shoes")),
    ]),
    limit=3,
    with_payload=True,
).points

print("\nTop-3 men's shoes:")
for r in results:
    p = r.payload
    print(f"  [{r.score:.3f}] {p['display_name']}")
    print(f"           gender={p.get('gender')} | color={p.get('color_primary')} | "
          f"style={p.get('style')} | brand={p.get('brand')}")

print(f"\n[Web] Dashboard: http://localhost:6333/dashboard")
print("[OK] Setup complete! Ready for search.")