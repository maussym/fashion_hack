import asyncio
import logging
import os

import httpx

logger = logging.getLogger(__name__)

NANO_BASE = "https://api.nanobananaapi.ai"

_raw_keys = os.getenv("NANO_KEYS", "")
NANO_KEYS: list[str] = [k.strip() for k in _raw_keys.split(",") if k.strip()]

_key_index = 0

TRYON_PROMPT = (
    "IMAGE 1 is a full-body photo of a real person (the model). "
    "IMAGE 2 is a product photo of a clothing item from a catalog. "
    "Take the clothing from IMAGE 2 and put it on the person from IMAGE 1. "
    "The result must show the person from IMAGE 1 wearing the clothing from IMAGE 2. "
    "Keep the person's face, skin tone, hair, body shape, pose and background from IMAGE 1. "
    "Keep all garment details from IMAGE 2: texture, color, pattern, stitching. "
    "The garment must fit naturally on the body. "
    "Result must look like a real photograph. No watermarks, no text."
)


def _current_key() -> str:
    return NANO_KEYS[_key_index]


def _rotate_key(failed_index: int):
    global _key_index
    if failed_index == _key_index:
        _key_index = (_key_index + 1) % len(NANO_KEYS)
        logger.warning("Rotated to key index %d", _key_index)


def _is_key_error(data: dict) -> bool:
    msg = str(data.get("msg", "")).lower()
    return data.get("code") in (401, 429) or any(w in msg for w in ("quota", "limit", "unauthorized"))


async def upload_to_hosting(image_bytes: bytes, filename: str = "image.jpg") -> str:
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(
            "https://litterbox.catbox.moe/resources/internals/api.php",
            data={"reqtype": "fileupload", "time": "24h"},
            files={"fileToUpload": (filename, image_bytes, "image/jpeg")},
        )
        r.raise_for_status()
        url = r.text.strip()
        if not url.startswith("http"):
            raise RuntimeError(f"Litterbox upload failed: {url}")
        logger.info("Uploaded to litterbox: %s", url)
        return url
async def nano_generate(person_url: str, cloth_url: str) -> str:
    for attempt in range(len(NANO_KEYS)):
        idx = _key_index
        key = _current_key()
        logger.info("nano_generate: key %d (attempt %d/%d)", idx, attempt + 1, len(NANO_KEYS))
        logger.info("person_url: %s", person_url)
        logger.info("cloth_url: %s", cloth_url)

        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(
                f"{NANO_BASE}/api/v1/nanobanana/generate",
                headers={"Authorization": f"Bearer {key}"},
                json={
                    "prompt": TRYON_PROMPT,
                    "type": "IMAGETOIAMGE",
                    "imageUrls": [person_url, cloth_url],
                    "numImages": 1,
                    "image_size": "2:3",
                    "callBackUrl": "https://httpbin.org/post",
                },
            )
        data = r.json()
        logger.info("NanoBanana response: %s", data)

        if data.get("code") == 200:
            return data["data"]["taskId"]
        if _is_key_error(data):
            _rotate_key(idx)
            continue
        raise ValueError(f"NanoBanana error: {data.get('msg')}")

    raise RuntimeError("All NanoBanana API keys exhausted")


async def nano_poll(task_id: str, max_wait: int = 180) -> str:
    async with httpx.AsyncClient(timeout=15) as client:
        for attempt in range(max_wait // 5):
            await asyncio.sleep(5)
            r = await client.get(
                f"{NANO_BASE}/api/v1/nanobanana/record-info",
                headers={"Authorization": f"Bearer {_current_key()}"},
                params={"taskId": task_id},
            )
            data = r.json()
            flag = data.get("data", {}).get("successFlag")
            logger.info("Poll %d: successFlag=%s", attempt + 1, flag)

            if flag == 1:
                return data["data"]["response"]["resultImageUrl"]
            if flag in (2, 3):
                raise ValueError(f"Generation failed: {data['data'].get('errorMessage')}")

    raise TimeoutError(f"Task {task_id} timed out after {max_wait}s")
