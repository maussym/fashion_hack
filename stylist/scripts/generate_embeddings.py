"""
generate_embeddings.py
======================
Генерирует vector_db.json из CLIP-эмбеддингов датасета fashion.
Адаптирован для локального запуска из корня проекта.

Датасет: https://www.kaggle.com/datasets/nirmalsankalana/fashion-product-text-images-dataset
Положи датасет в:
  data/data.csv
  data/data/   ← папка с фото

Запуск:
  python scripts/generate_embeddings.py

Output:
  vector_db.json  ← в корне проекта
"""

import os
import sys
import json
import torch
import pandas as pd
from PIL import Image
from pathlib import Path
from tqdm import tqdm

# Добавляем корень проекта в путь
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from transformers import CLIPProcessor, CLIPModel

# ── Конфиг ────────────────────────────────────────────────────
IMAGES_DIR  = "data"
CSV_PATH    = "data/data.csv"
OUTPUT_JSON = "vector_db.json"
BATCH_SIZE  = 32
MAX_ITEMS   = None  # None = все; поставь 500 для быстрого теста

# Используем тот же маппинг что в utils.py
from utils import get_category_internal

# ── Загрузка CLIP ─────────────────────────────────────────────
print("Loading CLIP model...")
device    = "cuda" if torch.cuda.is_available() else "cpu"
model     = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(device)
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
model.eval()
print(f"  -> CLIP on {device}")

# ── Загрузка датасета ─────────────────────────────────────────
print(f"\nLoading {CSV_PATH}...")
df = pd.read_csv(CSV_PATH)
df.columns = df.columns.str.strip().str.lower().str.replace(" ", "_")
print(f"  -> {len(df)} rows | columns: {list(df.columns)}")

if MAX_ITEMS:
    df = df.head(MAX_ITEMS)
    print(f"  -> Truncated to {MAX_ITEMS} items for testing")

# ── Батчевая генерация эмбеддингов ───────────────────────────
def embed_batch(image_paths: list) -> list:
    images, valid_idx = [], []
    for i, path in enumerate(image_paths):
        try:
            img = Image.open(path).convert("RGB")
            images.append(img)
            valid_idx.append(i)
        except Exception:
            pass

    if not images:
        return [None] * len(image_paths)

    inputs = processor(images=images, return_tensors="pt", padding=True).to(device)
    with torch.no_grad():
        outputs  = model.vision_model(pixel_values=inputs["pixel_values"])
        features = outputs.pooler_output
        features = model.visual_projection(features)

    features = features / features.norm(dim=-1, keepdim=True)
    vectors  = features.cpu().numpy().tolist()

    result = [None] * len(image_paths)
    for vec, idx in zip(vectors, valid_idx):
        result[idx] = vec
    return result


# ── Индексация ────────────────────────────────────────────────
print(f"\nBuilding vector DB ({len(df)} items, batch={BATCH_SIZE})...")

records = []
skipped = 0
rows    = df.to_dict("records")

for batch_start in tqdm(range(0, len(rows), BATCH_SIZE), desc="Embedding", unit="batch"):
    batch_rows  = rows[batch_start:batch_start + BATCH_SIZE]
    batch_paths = [
        os.path.join(IMAGES_DIR, str(row.get("image", "")).strip())
        for row in batch_rows
    ]

    vectors = embed_batch(batch_paths)

    for row, vector in zip(batch_rows, vectors):
        if vector is None:
            skipped += 1
            continue

        category_raw = str(row.get("category", "")).strip()
        records.append({
            "image_filename": str(row.get("image", "")).strip(),
            "display_name":   str(row.get("display_name", "")).strip(),
            "description":    str(row.get("description", ""))[:400].strip(),
            "category_raw":   category_raw,
            "category":       get_category_internal(category_raw),
            "vector":         vector,
        })

    # Чекпоинт каждые 5000
    if len(records) % 5000 == 0 and len(records) > 0:
        print(f"  -> Checkpoint: {len(records)} vectors...")

print(f"\n  -> Embedded: {len(records)} | Skipped: {skipped}")

# ── Сохранение ────────────────────────────────────────────────
print(f"\nSaving to {OUTPUT_JSON}...")
with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
    json.dump(records, f, ensure_ascii=False)

size_mb = os.path.getsize(OUTPUT_JSON) / 1024 / 1024
print(f"  -> Saved {len(records)} vectors ({size_mb:.1f} MB)")

# ── Статистика ────────────────────────────────────────────────
from collections import Counter
cat_counts = Counter(r["category"] for r in records)
print("\nCategory distribution:")
for cat, count in cat_counts.most_common():
    print(f"  {cat:<12} {count}")

print(f"\nDone! {OUTPUT_JSON} ready.")
print(f"   Next: python scripts/setup_qdrant.py")