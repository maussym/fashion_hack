"""
embeddings.py
=============
CLIP эмбеддер + кэш через lru_cache + category-specific prefixes.

Использование:
  from embeddings import get_text_vector, get_text_vector_for_category, get_image_vector, embedder

  vector = list(get_text_vector("casual sport outfit"))
  vector = list(get_text_vector_for_category("black nike shoes", "shoes"))
  vector = list(get_image_vector("images/3238.jpg"))
"""

import torch
from PIL import Image
from functools import lru_cache
from transformers import CLIPProcessor, CLIPModel

# ── Category-specific CLIP префиксы ──────────────────────────
# CLIP обучался на подписях вида "a photo of X"
# Специфичные префиксы дают +5-10% точности
CATEGORY_PREFIXES = {
    "top":       "a photo of a person wearing a shirt or top,",
    "bottom":    "a photo of a person wearing pants or skirt,",
    "shoes":     "a photo of fashion footwear,",
    "accessory": "a photo of a fashion accessory,",
    "dress":     "a photo of a person wearing a dress,",
    "default":   "a photo of",
}


class CLIPEmbedder:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._loaded = False
        return cls._instance

    def __init__(self):
        if self._loaded:
            return
        print("Loading CLIP model...")
        self.device    = "cuda" if torch.cuda.is_available() else "cpu"
        self.model     = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(self.device)
        self.processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        self.model.eval()
        self._loaded   = True
        print(f"  -> CLIP on {self.device}")

    def image(self, image_path: str) -> list[float] | None:
        try:
            img = Image.open(image_path).convert("RGB")
            return self._from_pil(img)
        except Exception as e:
            print(f"  [WARN] image embed failed ({image_path}): {e}")
            return None

    def image_from_pil(self, pil_image: Image.Image) -> list[float] | None:
        try:
            return self._from_pil(pil_image.convert("RGB"))
        except Exception as e:
            print(f"  [WARN] PIL embed failed: {e}")
            return None

    def _from_pil(self, img: Image.Image) -> list[float]:
        inputs = self.processor(images=img, return_tensors="pt").to(self.device)
        with torch.no_grad():
            outputs  = self.model.vision_model(pixel_values=inputs["pixel_values"])
            features = outputs.pooler_output
            features = self.model.visual_projection(features)
        features = features / features.norm(dim=-1, keepdim=True)
        return features[0].cpu().tolist()

    def _text(self, text: str) -> list[float] | None:
        try:
            inputs = self.processor(
                text=[text], return_tensors="pt",
                truncation=True, max_length=77
            ).to(self.device)
            with torch.no_grad():
                output = self.model.get_text_features(**inputs)
            features = output if isinstance(output, torch.Tensor) else output.pooler_output
            features = features / features.norm(dim=-1, keepdim=True)
            return features[0].cpu().tolist()
        except Exception as e:
            print(f"  [WARN] text embed failed: {e}")
            return None

    def text(self, text: str) -> list[float] | None:
        """Базовый текстовый эмбеддинг с 'a photo of'."""
        return self._text(f"a photo of {text}")

    def text_for_category(self, text: str, category: str = "default") -> list[float] | None:
        """Текстовый эмбеддинг с category-specific префиксом для лучшей точности."""
        prefix = CATEGORY_PREFIXES.get(category, CATEGORY_PREFIXES["default"])
        return self._text(f"{prefix} {text}")


# ── Singleton ─────────────────────────────────────────────────
embedder = CLIPEmbedder()


# ── Кэшированные функции ──────────────────────────────────────
@lru_cache(maxsize=512)
def get_text_vector(text: str) -> tuple:
    """Базовый кэшированный текстовый эмбеддинг."""
    result = embedder.text(text)
    return tuple(result) if result else None


@lru_cache(maxsize=1024)
def get_text_vector_for_category(text: str, category: str = "default") -> tuple:
    """
    Кэшированный эмбеддинг с category-specific префиксом.
    Даёт лучшую точность чем базовый get_text_vector.

    Пример:
      vector = list(get_text_vector_for_category("black nike shoes", "shoes"))
      vector = list(get_text_vector_for_category("white casual shirt", "top"))
    """
    result = embedder.text_for_category(text, category)
    return tuple(result) if result else None


@lru_cache(maxsize=256)
def get_image_vector(image_path: str) -> tuple:
    """Кэшированный image эмбеддинг из файла."""
    result = embedder.image(image_path)
    return tuple(result) if result else None


def cache_info():
    """Статистика кэша — для мониторинга."""
    return {
        "text_cache":          get_text_vector.cache_info()._asdict(),
        "text_category_cache": get_text_vector_for_category.cache_info()._asdict(),
        "image_cache":         get_image_vector.cache_info()._asdict(),
    }