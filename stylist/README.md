# AI Stylist — Module 1: Outfit Builder

AI-стилист для fashion-маркетплейса. Подбирает полные образы по текстовому запросу или фото, используя CLIP embeddings + Qdrant vector DB + LLM.

---

## Стек

| Компонент | Технология |
|-----------|-----------|
| Эмбеддинги | CLIP (openai/clip-vit-base-patch32) |
| Векторная БД | Qdrant |
| LLM | Groq (llama-3.3-70b-versatile) |
| API | FastAPI + Uvicorn |
| Датасет | Kaggle Fashion Product Dataset (44к товаров) + AVISHU.kz |

---

## Быстрый старт

### Шаг 1 — Клонировать репозиторий

```bash
git clone <repo_url>
cd decentra
```

### Шаг 2 — Установить зависимости

```bash
pip install -r requirements.txt
```

### Шаг 3 — Настроить переменные окружения

Создай файл `.env` в корне проекта (пример в `.env.example`):

```env
GROQ_API_KEY=your_groq_key_here
LLM_MODEL=llama-3.3-70b-versatile
```

Получить бесплатный ключ Groq: https://console.groq.com

### Шаг 4 — Скачать датасет

Скачай датасет с Kaggle:
https://www.kaggle.com/datasets/nirmalsankalana/fashion-product-text-images-dataset

Распакуй и положи файлы в папку `data/`:

```
data/
  data.csv        ← CSV с метаданными
  data/           ← папка с фото товаров (44к изображений)
```

### Шаг 5 — Сгенерировать векторную базу

> ⚠️ Занимает ~30-60 минут на CPU. Рекомендуем запускать на Kaggle с GPU.

```bash
python scripts/generate_embeddings.py
```

Создаст файл `vector_db.json` (~526MB) в корне проекта.

**Для быстрого теста** — поставь `MAX_ITEMS = 500` в начале файла.

### Шаг 6 — Запустить Qdrant

```bash
docker run -d --name qdrant -p 6333:6333 -v qdrant_storage:/qdrant/storage qdrant/qdrant
```

Проверить что запущен: http://localhost:6333/dashboard

### Шаг 7 — Загрузить данные в Qdrant

```bash
python scripts/setup_qdrant.py
```

### Шаг 8 — Добавить товары AVISHU (опционально)

```bash
pip install requests beautifulsoup4 deep-translator
python scripts/scrape_avishu.py
python scripts/add_avishu_embeddings.py
```

### Шаг 9 — Запустить API

```bash
uvicorn module1.main:app --port 8000
```

Swagger документация: http://localhost:8000/docs

---

## API Endpoints

### `POST /outfit/text`
Подбор образа по текстовому запросу.

**Request:**
```json
{
  "query": "casual look для девушки на прогулку",
  "session_id": "abc123",
  "items_per_cat": 3
}
```

**Response:**
```json
{
  "session_id": "abc123",
  "outfit_name": "Casual Chic",
  "occasion": "прогулка, встреча с друзьями",
  "explanation": "Этот образ подходит...",
  "why_it_works": "Сочетание комфорта и стиля...",
  "style_tips": ["совет 1", "совет 2"],
  "fashion_score": 24.5,
  "items": {
    "top":       [{"name": "...", "image_url": "/images/dataset/3238.jpg", "score": 0.28}],
    "bottom":    [...],
    "shoes":     [...],
    "accessory": [...]
  }
}
```

### `POST /outfit/image`
Подбор образа по фото товара.

**Form data:** `file` (jpg/png)

### `GET /search`
Поиск товаров по тексту.

```
GET /search?query=black nike shoes&category=shoes&gender=men&top_k=5
```

### `POST /session/reset`
Сброс памяти ассистента.

```
POST /session/reset?session_id=abc123
```

### `GET /health`
Статус сервиса.

---

## Структура проекта

```
decentra/
├── embeddings.py           # CLIP модель + LRU кэш
├── utils.py                # парсеры метаданных, OUTFIT_RULES, COLOR_HARMONY
├── module1/
│   ├── main.py             # FastAPI сервер
│   ├── stylist_llm.py      # LLM интерпретация + объяснение образа
│   └── stylist_search.py   # поиск в Qdrant, сборка образа
├── scripts/
│   ├── generate_embeddings.py    # генерация vector_db.json
│   ├── setup_qdrant.py           # создание коллекции + индексация
│   ├── scrape_avishu.py          # парсинг avishu.kz
│   ├── add_avishu_embeddings.py  # добавление AVISHU в Qdrant
│   └── benchmark_similarity.py   # бенчмарк метрик сходства
├── data/                   # датасет (не в git)
├── .env.example
├── requirements.txt
└── README.md
```

---

## Как работает система

```
Пользователь: "casual look для девушки на прогулку"
        ↓
LLM (Groq) → интерпретирует запрос → параметры поиска
        ↓
CLIP → текстовый вектор с category-specific префиксом
        ↓
Qdrant → cross-category поиск (top + bottom + shoes + accessory)
        ↓
validate_outfit() → убирает детские товары, мусор, платье+юбка конфликт
        ↓
LLM (Groq) → объясняет образ на русском + Fashion Score
        ↓
FastAPI → JSON с товарами, картинками и объяснением
```

---

## Примеры запросов

```bash
# Текстовый запрос
curl -X POST http://localhost:8000/outfit/text \
  -H "Content-Type: application/json" \
  -d '{"query": "деловой образ для офиса"}'

# Поиск товаров
curl "http://localhost:8000/search?query=black+nike+shoes&category=shoes&gender=men"

# Статус
curl http://localhost:8000/health
```