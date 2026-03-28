"""
scrape_avishu.py
================
Парсит каталог avishu.kz, переводит описания на английский.
Сохраняет в едином формате с основным датасетом.

Установка:
  pip install requests beautifulsoup4 deep-translator

Запуск:
  python scrape_avishu.py
"""

import os
import json
import time
import requests
from bs4 import BeautifulSoup
from pathlib import Path
from deep_translator import GoogleTranslator

# ── Конфиг ────────────────────────────────────────────────────
OUTPUT_JSON = "data/avishu_catalog.json"
IMAGES_DIR  = "data/avishu_images"
DELAY       = 1.0

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/120.0.0.0 Safari/537.36"
}

CATEGORIES = {
    "top": [
        "https://avishu.kz/product-category/%d0%ba%d0%b0%d1%82%d0%b0%d0%bb%d0%be%d0%b3/%d0%b6%d0%b5%d0%bd%d1%89%d0%b8%d0%bd%d0%b0%d0%bc/%d0%b1%d0%b0%d0%b7%d0%b0/",
        "https://avishu.kz/product-category/%d0%ba%d0%b0%d1%82%d0%b0%d0%bb%d0%be%d0%b3/%d0%b6%d0%b5%d0%bd%d1%89%d0%b8%d0%bd%d0%b0%d0%bc/%d0%ba%d0%b0%d1%80%d0%b4%d0%b8%d0%b3%d0%b0%d0%bd%d1%8b-%d0%b8-%d0%ba%d0%be%d1%84%d1%82%d1%8b/",
        "https://avishu.kz/product-category/%d0%ba%d0%b0%d1%82%d0%b0%d0%bb%d0%be%d0%b3/%d0%b6%d0%b5%d0%bd%d1%89%d0%b8%d0%bd%d0%b0%d0%bc/%d0%b2%d0%b5%d1%80%d1%85%d0%bd%d1%8f%d1%8f-%d0%be%d0%b4%d0%b5%d0%b6%d0%b4%d0%b0/",
    ],
    "bottom": [
        "https://avishu.kz/product-category/%d0%ba%d0%b0%d1%82%d0%b0%d0%bb%d0%be%d0%b3/%d0%b6%d0%b5%d0%bd%d1%89%d0%b8%d0%bd%d0%b0%d0%bc/%d0%b1%d1%80%d1%8e%d0%ba%d0%b8/",
        "https://avishu.kz/product-category/%d0%ba%d0%b0%d1%82%d0%b0%d0%bb%d0%be%d0%b3/%d0%b6%d0%b5%d0%bd%d1%89%d0%b8%d0%bd%d0%b0%d0%bc/%d1%8e%d0%b1%d0%ba%d0%b8/",
    ],
}

Path(IMAGES_DIR).mkdir(parents=True, exist_ok=True)
Path("data").mkdir(exist_ok=True)

translator = GoogleTranslator(source="ru", target="en")


def translate(text: str) -> str:
    if not text:
        return ""
    try:
        if len(text) > 4500:
            text = text[:4500]
        result = translator.translate(text)
        return result or text
    except Exception as e:
        print(f"  [WARN] Translation failed: {e}")
        return text


def get_product_urls(category_url: str) -> list:
    urls = []
    page = 1
    while True:
        url = f"{category_url}page/{page}/" if page > 1 else category_url
        print(f"    Page {page}: {url}")
        try:
            resp = requests.get(url, headers=HEADERS, timeout=10)
            if resp.status_code == 404:
                break
            soup = BeautifulSoup(resp.text, "html.parser")
        except Exception as e:
            print(f"    [ERROR] {e}")
            break

        products = (
            soup.select("li.product a.woocommerce-loop-product__link") or
            soup.select("a[href*='/product/']")
        )
        page_urls = list(set(a["href"] for a in products if a.get("href")))
        if not page_urls:
            break

        urls.extend(page_urls)
        print(f"    → {len(page_urls)} products")
        page += 1
        time.sleep(DELAY)

    return list(set(urls))


def parse_product(url: str, category: str) -> dict | None:
    try:
        resp = requests.get(url, headers=HEADERS, timeout=10)
        soup = BeautifulSoup(resp.text, "html.parser")
    except Exception as e:
        print(f"  [ERROR] {e}")
        return None

    # Название
    h1 = soup.select_one("h1.product_title") or soup.select_one("h1.entry-title")
    if not h1:
        return None
    name_ru = h1.get_text(strip=True)

    # Описание
    desc_el = (
        soup.select_one(".woocommerce-product-details__short-description") or
        soup.select_one("#tab-description .woocommerce-Tabs-panel") or
        soup.select_one(".product-description")
    )
    description_ru = desc_el.get_text(separator=" ", strip=True)[:1000] if desc_el else ""

    # Варианты цветов
    colors = []
    for opt in soup.select("select[name*='color'] option, select[name*='цвет'] option"):
        val = opt.get_text(strip=True)
        if val and val not in ("Выбрать опцию", ""):
            colors.append(val)

    # Изображения
    images = []
    for img in soup.select(".woocommerce-product-gallery__image img"):
        src = img.get("data-large_image") or img.get("src", "")
        if src and "placeholder" not in src:
            images.append(src)

    main_image_url  = images[0] if images else ""
    main_image_file = ""

    if main_image_url:
        filename = main_image_url.split("/")[-1].split("?")[0]
        filepath = os.path.join(IMAGES_DIR, filename)
        if not Path(filepath).exists():
            try:
                img_resp = requests.get(main_image_url, headers=HEADERS, timeout=10)
                with open(filepath, "wb") as f:
                    f.write(img_resp.content)
            except Exception as e:
                print(f"  [WARN] Image: {e}")
        main_image_file = filename

    # Перевод
    print(f"    Translating: {name_ru[:40]}...")
    name_en        = translate(name_ru)
    description_en = translate(description_ru) if description_ru else f"Women's {name_en} by AVISHU. Casual wear."

    colors_en = translate(", ".join(colors)) if colors else ""
    if colors_en:
        description_en += f" Available colors: {colors_en}."

    # Единый формат — без price, colors, display_name_ru, description_ru
    return {
        "image_filename": main_image_file,
        "display_name":   name_en,
        "description":    description_en[:500],
        "category_raw":   category.capitalize(),
        "category":       category,
        "url":            url,
        "image_url":      main_image_url,
        "brand":          "AVISHU",
        "gender":         "women",
        "source":         "avishu.kz",
    }


def scrape():
    all_products = []

    for category, cat_urls in CATEGORIES.items():
        print(f"\n{'='*50}")
        print(f"Category: {category}")
        print(f"{'='*50}")

        product_urls = []
        for cat_url in cat_urls:
            print(f"\n  Scanning: {cat_url}")
            urls = get_product_urls(cat_url)
            product_urls.extend(urls)

        product_urls = list(set(product_urls))
        print(f"\n  Total: {len(product_urls)} products")

        for i, url in enumerate(product_urls):
            print(f"\n  [{i+1}/{len(product_urls)}] {url}")
            product = parse_product(url, category)
            if product:
                all_products.append(product)
                print(f"    ✓ {product['display_name']}")
            time.sleep(DELAY)

    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(all_products, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*50}")
    print(f"✅ Done! {len(all_products)} products")
    print(f"   JSON:   {OUTPUT_JSON}")
    print(f"   Images: {IMAGES_DIR}/")

    return all_products


if __name__ == "__main__":
    scrape()