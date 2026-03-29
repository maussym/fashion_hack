# AVISHU — AI-Powered Fashion Platform

## Overview

AVISHU is a fashion marketplace platform enhanced with artificial intelligence capabilities. The system combines an AI stylist module for outfit generation with a virtual try-on module powered by neural image generation. The platform was developed as part of a hackathon project for AVISHU, a Kazakh clothing brand established in 2015.

## Architecture

The project consists of three independent services and supporting infrastructure:

```
fashion_hack/
├── frontend/    — React + Vite + Tailwind CSS (client application)
├── backend/     — FastAPI (catalog API, outfit generation, virtual try-on)
├── stylist/     — FastAPI + PyTorch + CLIP (AI stylist with vector search)
└── Qdrant       — Vector database (deployed on Qdrant Cloud)
```

### Frontend

Single-page application built with React 19, Vite, and Tailwind CSS. Features include product catalog browsing, shopping cart, wishlist, user authentication via Clerk, trilingual interface (Russian, Kazakh, English), dark mode, splash screen animation, and responsive mobile-first design.

### Backend (Module 2 — Virtual Try-On + Catalog)

FastAPI service responsible for serving the product catalog (38 items), rule-based outfit generation with color harmony scoring, and AI-powered virtual try-on. The try-on module integrates with the NanoBanana API for neural image generation — users upload a full-body photo and select a clothing item, and the system generates a realistic image of the person wearing the selected garment. The service supports multiple API keys with automatic rotation when rate limits are reached.

### Stylist (Module 1 — AI Outfit Builder)

FastAPI service that provides intelligent outfit recommendations through natural language queries. The pipeline works as follows: a user query (e.g., "casual look for a woman") is interpreted by Groq LLM (Llama 3.3 70B), converted into a CLIP text embedding with category-specific prefixes, searched against a Qdrant vector database containing 44,000+ fashion items, and returned with an AI-generated explanation of why the outfit works. The system maintains session memory for contextual follow-up queries and supports both text-based and image-based outfit generation.

### Vector Database

Qdrant is used for similarity search across the fashion catalog. Each item is represented by a 512-dimensional CLIP embedding. The database supports filtered search by gender, style, occasion, color, and category. Deployed on Qdrant Cloud (free tier).

## Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, Motion (Framer Motion), Clerk Auth, Sonner |
| Backend | FastAPI, Uvicorn, Pillow, httpx, python-dotenv |
| Stylist | FastAPI, PyTorch, CLIP (ViT-B/32), Qdrant Client, Groq (Llama 3.3 70B) |
| Virtual Try-On | NanoBanana API (neural image generation) |
| Vector DB | Qdrant (cloud-hosted) |
| Deployment | Vercel (frontend), HuggingFace Spaces (backend, stylist), Qdrant Cloud |

## Dataset

The stylist module uses the Fashion Product Images Dataset from Kaggle (44,441 items) augmented with products scraped from the AVISHU website. Each item is embedded using OpenAI CLIP (ViT-B/32) and stored in Qdrant with enriched metadata including gender, color, style, occasion, and brand.

## Deployment

- **Frontend**: Vercel (static hosting, automatic deploys from GitHub)
- **Backend**: HuggingFace Spaces (Docker container)
- **Stylist**: HuggingFace Spaces (Docker container with PyTorch CPU)
- **Vector DB**: Qdrant Cloud (1GB free tier)
- **Images**: HuggingFace Datasets (CDN for product photos)

## Local Development

### Prerequisites

- Node.js 18+
- Python 3.11+
- Docker (for Qdrant)

### Running locally

```bash
# 1. Start Qdrant
docker run -d --name qdrant -p 6333:6333 qdrant/qdrant

# 2. Backend (port 8000)
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 3. Stylist (port 8003)
cd stylist
pip install -r requirements.txt
python -m uvicorn module1.main:app --port 8003

# 4. Frontend (port 5173)
cd frontend
npm install
npm run dev
```

### Environment Variables

**backend/.env**
```
NANO_KEYS=key1,key2,key3
```

**stylist/.env**
```
GROQ_API_KEY=gsk_...
```

**frontend/.env**
```
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_STYLIST_API_URL=http://127.0.0.1:8003
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

## Team

Developed by the AVISHU hackathon team.

## License

This project was created for a hackathon demonstration. All rights to the AVISHU brand and its assets belong to TOO "AVISHU", Karaganda, Kazakhstan.

---

# AVISHU — Fashion-платформа с искусственным интеллектом

## Обзор

AVISHU — это платформа модного маркетплейса, усиленная возможностями искусственного интеллекта. Система объединяет модуль AI-стилиста для генерации образов и модуль виртуальной примерки на основе нейросетевой генерации изображений. Платформа разработана в рамках хакатон-проекта для AVISHU — казахстанского бренда одежды, основанного в 2015 году.

## Архитектура

Проект состоит из трёх независимых сервисов и поддерживающей инфраструктуры:

```
fashion_hack/
├── frontend/    — React + Vite + Tailwind CSS (клиентское приложение)
├── backend/     — FastAPI (API каталога, генерация образов, виртуальная примерка)
├── stylist/     — FastAPI + PyTorch + CLIP (AI-стилист с векторным поиском)
└── Qdrant       — Векторная база данных (развёрнута на Qdrant Cloud)
```

### Frontend

Одностраничное приложение на React 19, Vite и Tailwind CSS. Включает просмотр каталога товаров, корзину, избранное, аутентификацию через Clerk, трёхъязычный интерфейс (русский, казахский, английский), тёмную тему, анимацию загрузки и адаптивный мобильный дизайн.

### Backend (Модуль 2 — Виртуальная примерка + Каталог)

FastAPI-сервис, отвечающий за каталог товаров (38 позиций), генерацию образов на основе правил с оценкой цветовой гармонии и AI-примерку. Модуль примерки интегрирован с NanoBanana API для нейросетевой генерации изображений — пользователь загружает фото в полный рост и выбирает вещь, система генерирует реалистичное изображение человека в выбранной одежде. Сервис поддерживает несколько API-ключей с автоматической ротацией при исчерпании лимитов.

### Stylist (Модуль 1 — AI-подбор образов)

FastAPI-сервис для интеллектуальных рекомендаций образов через запросы на естественном языке. Пайплайн работает следующим образом: запрос пользователя (например, «повседневный образ для девушки») интерпретируется LLM Groq (Llama 3.3 70B), преобразуется в CLIP-эмбеддинг с категорийными префиксами, ищется в векторной базе Qdrant с 44 000+ товарами и возвращается с AI-объяснением почему образ подходит. Система поддерживает память сессий для контекстных уточняющих запросов, а также генерацию образов по фотографии.

### Векторная база данных

Qdrant используется для поиска по схожести в каталоге. Каждый товар представлен 512-мерным CLIP-эмбеддингом. База поддерживает фильтрацию по полу, стилю, случаю, цвету и категории. Развёрнута на Qdrant Cloud (бесплатный тариф).

## Стек технологий

| Компонент | Технологии |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, Motion (Framer Motion), Clerk Auth, Sonner |
| Backend | FastAPI, Uvicorn, Pillow, httpx, python-dotenv |
| Stylist | FastAPI, PyTorch, CLIP (ViT-B/32), Qdrant Client, Groq (Llama 3.3 70B) |
| Виртуальная примерка | NanoBanana API (нейросетевая генерация изображений) |
| Векторная БД | Qdrant (облачный хостинг) |
| Деплой | Vercel (frontend), HuggingFace Spaces (backend, stylist), Qdrant Cloud |

## Датасет

Модуль стилиста использует Fashion Product Images Dataset с Kaggle (44 441 товар), дополненный товарами, спарсенными с сайта AVISHU. Каждый товар эмбеддирован с помощью OpenAI CLIP (ViT-B/32) и хранится в Qdrant с обогащёнными метаданными: пол, цвет, стиль, случай, бренд.

## Деплой

- **Frontend**: Vercel (статический хостинг, автодеплой из GitHub)
- **Backend**: HuggingFace Spaces (Docker-контейнер)
- **Stylist**: HuggingFace Spaces (Docker-контейнер с PyTorch CPU)
- **Векторная БД**: Qdrant Cloud (бесплатный тариф 1GB)
- **Изображения**: HuggingFace Datasets (CDN для фото товаров)

## Команда

Разработано командой AVISHU hackathon.

## Лицензия

Проект создан для демонстрации на хакатоне. Все права на бренд AVISHU и его активы принадлежат ТОО "AVISHU", г. Караганда, Казахстан.
