"""
stylist_llm.py
==============
AI-стилист на базе Groq (Llama-3.3-70b) или OpenAI GPT-4o.
"""

import os
import json
from dotenv import load_dotenv
load_dotenv()

from openai import OpenAI
from embeddings import get_text_vector_for_category

# ── Конфиг ───────────────────────────────────────────────────
USE_GROQ = True

if USE_GROQ:
    client = OpenAI(
        api_key=os.getenv("GROQ_API_KEY"),
        base_url="https://api.groq.com/openai/v1"
    )
    MODEL = "llama-3.3-70b-versatile"
else:
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    MODEL  = "gpt-4o"

# ── Системный промпт ──────────────────────────────────────────
SYSTEM_PROMPT = """Ты — профессиональный AI-стилист fashion-маркетплейса.
Помогаешь пользователям подобрать стильные, гармоничные образы.
Всегда отвечаешь ТОЛЬКО валидным JSON без markdown и лишнего текста.
Текстовые объяснения пиши на русском языке.

ПРАВИЛА ГЕНДЕРА (строго соблюдай):
- Если в запросе есть "девушка", "женщина", "она" → gender=women
- Если есть "мужчина", "парень", "он" → gender=men
- Если контекст нейтральный — ВЫБЕРИ один гендер (men или women), НЕ используй unisex
- НИКОГДА не смешивай мужские и женские вещи в одном образе
- Женский образ: каблуки + женские брюки/юбки. Мужской: оксфорды + мужские брюки

ПРАВИЛА СТИЛЯ (строго соблюдай):
- evening/party образ: ЗАПРЕЩЕНЫ носки, спортивные аксессуары, рюкзаки
- work/office образ: ЗАПРЕЩЕНЫ носки как аксессуар, спортивная обувь
- sport образ: ЗАПРЕЩЕНЫ каблуки, деловые аксессуары
- casual образ: разрешено всё умеренное
- Если style=casual но top элегантный (блузка, рубашка, юбка) → shoes должны быть flats/sandals/loafers, НЕ running shoes/sneakers
- Если style=sport → shoes обязательно кроссовки/сланцы, НЕ каблуки

ПРАВИЛА ЦВЕТА (строго соблюдай):
- Для casual и formal образов: один акцентный цвет + нейтральные (белый, серый, бежевый, чёрный)
- Не допускай одновременно: красный + фиолетовый + розовый + синий в одном образе
- Предпочитай монохромные или аналоговые сочетания цветов"""


# ── 1. Интерпретация запроса ──────────────────────────────────
def interpret_user_query(query: str, prev_context: dict = None) -> dict:
    memory_prompt = ""
    if prev_context:
        memory_prompt = f"""
ПАМЯТЬ (предыдущий запрос):
- Гендер: {prev_context.get('gender')}
- Стиль: {prev_context.get('style')}
- Цвет: {prev_context.get('color')}
Если запрос является уточнением — обнови только нужные поля.
"""

    prompt = f"""{memory_prompt}Пользователь написал: "{query}"

Определи параметры для подбора образа и верни ТОЛЬКО JSON:
{{
    "search_query":    "запрос для поиска на английском (3-6 слов для CLIP)",
    "source_category": "с чего начать образ: top/bottom/shoes/accessory",
    "target_cats":     ["категории которые нужно подобрать"],
    "gender":          "men/women",
    "style":           "casual/sport/formal/evening/ethnic",
    "occasion":        "повод на русском (1-3 слова)",
    "color":           "желаемый цвет или null"
}}

Правила target_cats:
- если source_category=top → ["top", "bottom", "shoes", "accessory"]
- если source_category=dress → ["shoes", "accessory"]
- если source_category=bottom → ["top", "shoes", "accessory"]
- если source_category=shoes → ["top", "bottom", "accessory"]
- если source_category=accessory → ["top", "bottom", "shoes"]

ВАЖНО: Если пользователь просит общий образ/лук/outfit —
ВСЕГДА source_category=top и target_cats=["top", "bottom", "shoes", "accessory"]

Правила gender:
- НЕ используй unisex — всегда выбирай men или women
- Если в памяти уже есть пол — не меняй его без явной просьбы"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": prompt},
        ],
        temperature=0.1,
        max_tokens=250,
    )

    raw = response.choices[0].message.content.strip()
    raw = raw.replace("```json", "").replace("```", "").strip()

    try:
        return json.loads(raw)
    except Exception:
        return {
            "search_query":    query,
            "source_category": "top",
            "target_cats":     ["top", "bottom", "shoes", "accessory"],
            "gender":          "women",
            "style":           "casual",
            "occasion":        "повседневная носка",
            "color":           None,
        }


# ── 2. Объяснение образа ──────────────────────────────────────
def explain_outfit(user_query: str, outfit_items: dict) -> dict:
    items_text = ""
    for cat, items in outfit_items.items():
        if items:
            top   = items[0]
            name  = top.get("name", top.get("display_name", ""))
            color = top.get("color", "")
            items_text += f"- {cat}: {name} ({color})\n"

    prompt = f"""Пользователь хотел: "{user_query}"

Мы подобрали такой образ:
{items_text}

Объясни пользователю почему этот образ подходит под его запрос.
Верни ТОЛЬКО JSON:
{{
    "outfit_name": "модное название образа на английском (2-3 слова)",
    "occasion":    "для каких случаев подходит (на русском)",
    "explanation": "почему этот образ подходит под запрос пользователя (2-3 предложения на русском)",
    "why_it_works":"главная причина почему образ работает (1 предложение на русском)",
    "style_tips":  ["практический совет 1 на русском", "совет 2 на русском"]
}}"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": prompt},
        ],
        temperature=0.7,
        max_tokens=400,
    )

    raw = response.choices[0].message.content.strip()
    raw = raw.replace("```json", "").replace("```", "").strip()

    try:
        return json.loads(raw)
    except Exception:
        return {
            "outfit_name":  "Style Look",
            "occasion":     "повседневная носка",
            "explanation":  raw,
            "why_it_works": "",
            "style_tips":   [],
        }


# ── 3. Полный пайплайн ────────────────────────────────────────
def get_outfit_for_query(user_query: str, prev_context: dict = None, items_per_cat: int = 3) -> dict:
    """Полный пайплайн: запрос → образ → объяснение."""
    from module1.stylist_search import build_custom_outfit

    # Шаг 1 — интерпретируем запрос
    params = interpret_user_query(user_query, prev_context)
    print(f"  -> Interpreted: {params['search_query']} | {params['style']} | {params['gender']}")

    # Шаг 2 — получаем вектор
    search_query = params.get("expanded_query") or params["search_query"]
    if params.get("color") and params["color"] != "null":
        search_query = f"{params['color']} {search_query}"

    source_cat = params.get("source_category", "default")
    vector = list(get_text_vector_for_category(search_query, source_cat))
    if not vector:
        return {"error": "embedding failed"}

    # Шаг 3 — строим образ
    outfit = build_custom_outfit(
        vector=vector,
        target_categories=params["target_cats"],
        gender=params["gender"],
        color=params.get("color"),
        style=params["style"],
        occasion=params.get("occasion"),
        items_per_cat=items_per_cat,
        search_query=search_query,
    )

    # Шаг 4 — объясняем образ
    explanation = explain_outfit(user_query, outfit["items"])

    # Фильтр по score
    SCORE_THRESHOLD = 0.15
    for cat in outfit["items"]:
        outfit["items"][cat] = [
            item for item in outfit["items"][cat]
            if item.get("score", 0) >= SCORE_THRESHOLD
        ]

    # Fashion Score
    all_scores = []
    for items in outfit["items"].values():
        for item in items:
            if item.get("score"):
                all_scores.append(item["score"])
    fashion_score = round(sum(all_scores) / len(all_scores) * 100, 1) if all_scores else 0

    score_warning = None
    if fashion_score < 20:
        score_warning = "Точных совпадений мало — попробуйте уточнить запрос"

    return {
        "query":         user_query,
        "params":        params,
        "outfit":        outfit,
        "explanation":   explanation,
        "fashion_score": fashion_score,
        "score_warning": score_warning,
    }


# ── Тесты ─────────────────────────────────────────────────────
if __name__ == "__main__":
    test_queries = [
        "хочу спортивный образ на выходные",
        "нужен деловой образ для офиса",
        "casual look для девушки на прогулку",
        "вечерний образ на мероприятие",
    ]

    for query in test_queries:
        print("\n" + "="*60)
        print(f"ЗАПРОС: '{query}'")
        print("="*60)

        result = get_outfit_for_query(query)
        exp    = result.get("explanation", {})

        print(f"\n🎨 {exp.get('outfit_name')}  |  ⭐ {result.get('fashion_score')}/100")
        print(f"📍 {exp.get('occasion')}")
        print(f"💬 {exp.get('explanation')}")
        print(f"✨ {exp.get('why_it_works')}")
        print(f"💡 {exp.get('style_tips')}")

        print(f"\n📦 Образ:")
        for cat, items in result["outfit"]["items"].items():
            if items:
                top = items[0]
                print(f"  [{cat}] {top.get('name')} | {top.get('color')} | score={top.get('score')}")

    print("\n✅ Done!")