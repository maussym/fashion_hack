"""
benchmark_similarity.py
=======================
Сравнивает три метрики similarity:
- Cosine (текущий в Qdrant)
- Dot Product
- Euclidean Distance

Метрики сравнения:
- Скорость (ms)
- Score распределение
- Разнообразие категорий
- Топ результаты визуально

Запуск:
  python benchmark_similarity.py
"""

import time
import json
import numpy as np
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, VectorParams,
    Filter, FieldCondition, MatchValue
)
from embeddings import embedder

# ── Конфиг ────────────────────────────────────────────────────
QDRANT_HOST     = "localhost"
QDRANT_PORT     = 6333
COLLECTION_COS  = "bench_cosine"
COLLECTION_DOT  = "bench_dot"
COLLECTION_EUC  = "bench_euclidean"
VECTOR_DB_JSON  = "vector_db.json"
TOP_K           = 5
N_QUERIES       = 10   # сколько тестовых запросов

# ── Тестовые текстовые запросы ────────────────────────────────
TEXT_QUERIES = [
    ("black sports shoes for men",   "shoes"),
    ("white casual shirt men",       "top"),
    ("blue denim jeans",             "bottom"),
    ("leather handbag women",        "accessory"),
    ("analog wrist watch silver",    "accessory"),
    ("red dress women evening",      "top"),
    ("running shoes women white",    "shoes"),
    ("formal trousers men black",    "bottom"),
    ("sunglasses aviator men",       "accessory"),
    ("polo t-shirt casual",          "top"),
]

client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)

# ── 1. Создание трёх коллекций с разными метриками ────────────
print("="*60)
print("STEP 1: Creating 3 collections with different metrics")
print("="*60)

print("\nLoading vector_db.json...")
with open(VECTOR_DB_JSON, "r", encoding="utf-8") as f:
    records = json.load(f)
print(f"  → {len(records)} records loaded")

configs = [
    (COLLECTION_COS, Distance.COSINE,   "Cosine"),
    (COLLECTION_DOT, Distance.DOT,      "Dot Product"),
    (COLLECTION_EUC, Distance.EUCLID,   "Euclidean"),
]

from qdrant_client.models import PointStruct
import uuid

for collection, distance, name in configs:
    # Пересоздаём коллекцию
    if client.collection_exists(collection):
        client.delete_collection(collection)

    client.create_collection(
        collection_name=collection,
        vectors_config=VectorParams(size=512, distance=distance),
    )

    # Загружаем батчами
    batch, BATCH = [], 512
    for rec in records:
        vec = rec.get("vector")
        if not vec or len(vec) != 512:
            continue
        batch.append(PointStruct(
            id=str(uuid.uuid4()),
            vector=vec,
            payload={k: v for k, v in rec.items() if k != "vector"}
        ))
        if len(batch) >= BATCH:
            client.upsert(collection_name=collection, points=batch)
            batch = []
    if batch:
        client.upsert(collection_name=collection, points=batch)

    total = client.count(collection).count
    print(f"  → [{name}] collection '{collection}': {total} vectors")

# ── 2. Benchmark ──────────────────────────────────────────────
print("\n" + "="*60)
print("STEP 2: Benchmarking")
print("="*60)

results_summary = {name: {
    "times_ms": [],
    "scores": [],
    "category_diversity": [],
    "top_results": []
} for _, _, name in configs}

for query_text, category in TEXT_QUERIES[:N_QUERIES]:
    print(f"\nQuery: '{query_text}' | filter: {category}")
    print("-" * 50)

    # Получаем вектор запроса
    query_vector = embedder.text(query_text)
    if query_vector is None:
        print("  [SKIP] text embedding failed")
        continue

    query_filter = Filter(
        must=[FieldCondition(key="category", match=MatchValue(value=category))]
    )

    for collection, distance, name in configs:
        start = time.perf_counter()

        hits = client.query_points(
            collection_name=collection,
            query=query_vector,
            query_filter=query_filter,
            limit=TOP_K,
            with_payload=True,
        ).points

        elapsed_ms = (time.perf_counter() - start) * 1000

        scores     = [round(h.score, 4) for h in hits]
        categories = [h.payload.get("category_raw", "?") for h in hits]
        diversity  = len(set(categories))
        names      = [h.payload.get("display_name", "?") for h in hits]

        results_summary[name]["times_ms"].append(elapsed_ms)
        results_summary[name]["scores"].extend(scores)
        results_summary[name]["category_diversity"].append(diversity)
        results_summary[name]["top_results"].append({
            "query": query_text,
            "top1":  names[0] if names else "—",
            "score": scores[0] if scores else 0,
        })

        print(f"  [{name:12}] {elapsed_ms:6.1f}ms | scores: {scores} | diversity: {diversity}")

# ── 3. Итоговый отчёт ─────────────────────────────────────────
print("\n" + "="*60)
print("STEP 3: FINAL REPORT")
print("="*60)

print(f"\n{'Metric':<20} {'Cosine':>12} {'Dot Product':>12} {'Euclidean':>12}")
print("-" * 58)

for metric_name, extract, fmt in [
    ("Avg time (ms)",    lambda d: np.mean(d["times_ms"]),           ".2f"),
    ("Min time (ms)",    lambda d: np.min(d["times_ms"]),            ".2f"),
    ("Max time (ms)",    lambda d: np.max(d["times_ms"]),            ".2f"),
    ("Avg score",        lambda d: np.mean(d["scores"]),             ".4f"),
    ("Max score",        lambda d: np.max(d["scores"]),              ".4f"),
    ("Min score",        lambda d: np.min(d["scores"]),              ".4f"),
    ("Score std",        lambda d: np.std(d["scores"]),              ".4f"),
    ("Avg diversity",    lambda d: np.mean(d["category_diversity"]), ".2f"),
]:
    values = [extract(results_summary[name]) for _, _, name in configs]
    row = f"{metric_name:<20}"
    for v in values:
        row += f" {format(v, fmt):>12}"
    print(row)

# ── 4. Топ результаты по каждому алгоритму ────────────────────
print(f"\n{'─'*60}")
print("TOP-1 RESULTS PER QUERY")
print(f"{'─'*60}")

print(f"\n{'Query':<35} {'Cosine':>25} {'Dot':>25} {'Euclidean':>25}")
print("-" * 112)

for i, (query_text, _) in enumerate(TEXT_QUERIES[:N_QUERIES]):
    cos_r = results_summary["Cosine"]["top_results"][i] if i < len(results_summary["Cosine"]["top_results"]) else {}
    dot_r = results_summary["Dot Product"]["top_results"][i] if i < len(results_summary["Dot Product"]["top_results"]) else {}
    euc_r = results_summary["Euclidean"]["top_results"][i] if i < len(results_summary["Euclidean"]["top_results"]) else {}

    print(f"{query_text[:33]:<35} "
          f"{str(cos_r.get('top1',''))[:23]:>25} "
          f"{str(dot_r.get('top1',''))[:23]:>25} "
          f"{str(euc_r.get('top1',''))[:23]:>25}")

# ── 5. Вывод ──────────────────────────────────────────────────
print(f"\n{'='*60}")
print("CONCLUSION")
print(f"{'='*60}")

avg_times = {name: np.mean(results_summary[name]["times_ms"]) for _, _, name in configs}
avg_scores = {name: np.mean(results_summary[name]["scores"]) for _, _, name in configs}

fastest = min(avg_times, key=avg_times.get)
best_score = max(avg_scores, key=avg_scores.get)

print(f"  Fastest:      {fastest} ({avg_times[fastest]:.2f}ms avg)")
print(f"  Best scores:  {best_score} ({avg_scores[best_score]:.4f} avg)")
print(f"\n  Recommendation for outfit search:")
print(f"  → Use COSINE for cross-category (normalized, interpretable 0-1)")
print(f"  → Use DOT PRODUCT if speed is critical")
print(f"  → Avoid EUCLIDEAN for high-dim CLIP vectors (512-dim)")

print("\n✅ Benchmark done!")