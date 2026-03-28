"""
utils.py
========
Утилиты для парсинга метаданных товаров.
Импортируется везде: setup_qdrant.py, cross_category_search.py, api.py
"""

# ── Словари ───────────────────────────────────────────────────
GENDER_WOMEN = ["women", "woman", "female", "girl", "ladies", "her"]
GENDER_MEN   = ["men", "man", "male", "boy", "gents", "his"]

COLORS = {
    "black":  ["black", "noir", "onyx"],
    "white":  ["white", "ivory", "cream", "off-white"],
    "blue":   ["blue", "navy", "cobalt", "indigo", "denim", "teal"],
    "red":    ["red", "maroon", "crimson", "burgundy", "wine"],
    "green":  ["green", "olive", "khaki", "mint", "forest"],
    "yellow": ["yellow", "gold", "mustard", "lemon"],
    "pink":   ["pink", "rose", "blush", "fuchsia", "magenta"],
    "purple": ["purple", "violet", "lavender", "lilac", "plum"],
    "orange": ["orange", "coral", "peach", "rust"],
    "brown":  ["brown", "tan", "camel", "chocolate", "coffee"],
    "grey":   ["grey", "gray", "silver", "charcoal", "slate"],
    "beige":  ["beige", "nude", "sand", "taupe"],
    "multi":  ["multicolor", "multi", "printed", "floral", "striped", "checked"],
}

STYLE_MAP = {
    "sport":   ["sports", "sport", "running", "gym", "fitness", "athletic",
                "training", "yoga", "swim", "track", "jersey"],
    "formal":  ["formal", "office", "business", "suit", "blazer", "corporate"],
    "evening": ["evening", "party", "cocktail", "gown", "prom", "wedding", "festive"],
    "ethnic":  ["ethnic", "saree", "kurta", "salwar", "lehenga", "traditional", "indian"],
    "casual":  ["casual", "everyday", "basic", "simple", "regular"],
}

OCCASION_MAP = {
    "sport":  ["sport", "gym", "running", "fitness", "training", "yoga"],
    "work":   ["formal", "office", "business", "corporate"],
    "party":  ["evening", "party", "cocktail", "festive", "wedding"],
    "beach":  ["swim", "beach", "pool", "summer"],
    "ethnic": ["ethnic", "traditional", "saree", "kurta"],
    "casual": ["casual", "everyday", "basic", "regular"],
}

JUNK_CATEGORIES = [
    "Perfume and Body Mist", "Deodorant", "Lipstick",
    "Lip Gloss", "Nail Polish", "Face Moisturisers",
    "Eyeshadow", "Mascara", "Compact", "Highlighter and Blush",
    "Foundation and Primer", "Kajal and Eyeliner", "Lip Care",
    "Briefs", "Bra", "Innerwear Vests", "Free Gifts",
    "Fragrance Gift Set", "Travel Accessory", "Cufflinks",
    "Suspenders", "Pendant", "Bangle", "Ring",
    "Bracelet", "Necklace and Chains", "Jewellery Set",
    "Earrings", "Lip Liner", "Nail Polish",
]

TOP_BRANDS = [
    "Nike", "Adidas", "Puma", "Reebok", "Fila", "Converse", "Vans",
    "Zara", "H&M", "Mango", "United Colors of Benetton",
    "Levi's", "Wrangler", "Lee", "Pepe Jeans", "Diesel",
    "Tommy Hilfiger", "Calvin Klein", "Ralph Lauren", "Lacoste",
    "Ray-Ban", "Fastrack", "Titan", "Casio", "Fossil",
    "American Tourister", "Wildcraft", "Samsonite",
    "Fabindia", "W", "Biba", "Global Desi",
    "Peter England", "Van Heusen", "Arrow", "Louis Philippe",
    "Roadster", "HRX", "Being Human",
]

# Правила outfit — для каждой категории что ищем
OUTFIT_RULES = {
    "top":       ["bottom", "shoes", "accessory"],
    "bottom":    ["top",    "shoes", "accessory"],
    "shoes":     ["top",    "bottom", "accessory"],
    "accessory": ["top",    "bottom", "shoes"],
    # платье/костюм — без брюк
    "dress":     ["shoes",  "accessory"],
    "suit":      ["shoes",  "accessory"],
    # куртка — верх + низ + аксессуар
    "jacket":    ["top",    "bottom", "accessory"],
    "other":     ["top",    "bottom", "shoes", "accessory"],
}

# Цветовая гармония — какие цвета сочетаются
COLOR_HARMONY = {
    "black":  ["white", "grey", "red", "blue", "beige", "pink", "multi"],
    "white":  ["black", "blue", "navy", "beige", "grey", "multi"],
    "blue":   ["white", "beige", "grey", "brown", "black"],
    "red":    ["black", "white", "beige", "grey"],
    "green":  ["beige", "brown", "white", "black"],
    "yellow": ["black", "white", "blue", "grey"],
    "pink":   ["white", "black", "grey", "beige"],
    "purple": ["white", "black", "grey", "beige"],
    "orange": ["black", "white", "blue", "beige"],
    "brown":  ["beige", "white", "blue", "green"],
    "grey":   ["white", "black", "blue", "pink", "multi"],
    "beige":  ["brown", "white", "black", "blue", "green"],
    "multi":  ["black", "white", "beige", "grey"],
}


# ── Парсеры ───────────────────────────────────────────────────
def detect_gender(name: str, description: str = "") -> str:
    # Сначала только по названию
    name_lower = name.lower()
    w = sum(1 for kw in GENDER_WOMEN if kw in name_lower)
    m = sum(1 for kw in GENDER_MEN   if kw in name_lower)
    if w > m: return "women"
    if m > w: return "men"

    # Если не определили — смотрим описание
    desc_lower = description.lower()
    w = sum(1 for kw in GENDER_WOMEN if kw in desc_lower)
    m = sum(1 for kw in GENDER_MEN   if kw in desc_lower)
    if w > m: return "women"
    if m > w: return "men"

    return "unisex"
def detect_is_kids(name: str, description: str = "") -> bool:
    """Определяет детский товар по ключевым словам в названии."""
    KIDS_KEYWORDS = [
        "kids", "girls", "boys", "girl's", "boy's",
        "infant", "kidswear", "junior", "children", "child",
        "toddler", "baby", "newborn"
    ]
    text = (name + " " + description).lower()
    return any(k in text for k in KIDS_KEYWORDS)

def detect_color(name: str, description: str = "") -> str:
    text = (name + " " + description).lower()
    for color, keywords in COLORS.items():
        if any(k in text for k in keywords):
            return color
    return "other"


def detect_style(name: str, description: str = "", category_raw: str = "") -> str:
    text = (name + " " + description + " " + category_raw).lower()
    for style, keywords in STYLE_MAP.items():
        if any(k in text for k in keywords):
            return style
    return "casual"


def detect_occasion(name: str, description: str = "", category_raw: str = "") -> str:
    text = (name + " " + description + " " + category_raw).lower()
    for occasion, keywords in OCCASION_MAP.items():
        if any(k in text for k in keywords):
            return occasion
    return "casual"


def detect_brand(name: str) -> str:
    import re
    for brand in TOP_BRANDS:
        if re.search(r'\b' + re.escape(brand) + r'\b', name, re.IGNORECASE):
            return brand
    words = name.strip().split()
    return words[0] if words else "unknown"


def get_harmonious_colors(color: str) -> list[str]:
    """Возвращает список цветов которые сочетаются с данным."""
    return COLOR_HARMONY.get(color, ["black", "white", "beige"])


def enrich_record(record: dict) -> dict:
    """Возвращает dict с новыми полями для payload."""
    name     = record.get("display_name", "")
    desc     = record.get("description", "")
    cat_raw  = record.get("category_raw", "")
    return {
        "gender":        detect_gender(name, desc),
        "color_primary": detect_color(name, desc),
        "style":         detect_style(name, desc, cat_raw),
        "occasion":      detect_occasion(name, desc, cat_raw),
        "brand":         detect_brand(name),
        "is_kids":       detect_is_kids(name, desc),
    }


def get_category_internal(category_raw: str) -> str:
    """Mapping raw category -> internal (top/bottom/shoes/accessory)."""
    CATEGORY_MAP = {
        "Sports Shoes": "shoes",   "Casual Shoes": "shoes",
        "Formal Shoes": "shoes",   "Sandals":      "shoes",
        "Heels":        "shoes",   "Flats":        "shoes",
        "Boots":        "shoes",
        "Shorts":       "bottom",  "Jeans":        "bottom",
        "Trousers":     "bottom",  "Skirts":       "bottom",
        "Leggings":     "bottom",
        "Tops":         "top",     "Tshirts":      "top",
        "Shirts":       "top",     "Dresses":      "top",
        "Sarees":       "top",     "Kurtas":       "top",
        "Sweaters":     "top",     "Jackets":      "top",
        "Sweatshirts":  "top",
        "Handbags":     "accessory", "Watches":    "accessory",
        "Belts":        "accessory", "Sunglasses": "accessory",
        "Jewellery":    "accessory", "Socks":      "accessory",
        "Backpacks":    "accessory", "Wallets":    "accessory",
        "Caps":         "accessory",
        "Flip Flops":   "shoes",
        "Track Pants":  "bottom",
        "Capris":       "bottom",
        "Clutches":     "accessory",
        "Ties":         "accessory",
        "Tunics":       "top",
        "Stoles":       "accessory",
        "Scarves":      "accessory",
        "Swimwear":     "top",
        "Rompers":      "top",
        "Nightdress":   "top",
        "Sweatshirts":  "top",
        "Jackets":      "top",
        "Capris":       "bottom",
        "Jeggings":     "bottom",
        "Churidar":     "bottom",
        "Salwar":       "bottom",
        "Lounge Pants": "bottom",
        "Lounge Shorts":"bottom",
        "Kurtis":       "top",
        "Kurta Sets":   "top",
        "Dupatta":      "accessory",
        "Mufflers":     "accessory",
        "Laptop Bag":   "accessory",
        "Messenger Bag":"accessory",
        "Duffel Bag":   "accessory",
        "Clutches":     "accessory",
        "Waistcoat":    "top",
        "Rain Jacket":  "top",
    }
    return CATEGORY_MAP.get(category_raw, "other")