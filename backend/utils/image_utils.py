"""Image encoding/decoding utilities."""

from __future__ import annotations

import base64
import io

import cv2
import numpy as np
from PIL import Image


def base64_to_cv2(b64_string: str) -> np.ndarray:
    """Decode a base64 string to an OpenCV BGR image."""
    # Strip data URI prefix if present
    if "," in b64_string:
        b64_string = b64_string.split(",", 1)[1]
    img_bytes = base64.b64decode(b64_string)
    np_arr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    return img


def cv2_to_base64(img: np.ndarray, fmt: str = ".jpg") -> str:
    """Encode an OpenCV image to a base64 string with data URI prefix."""
    _, buffer = cv2.imencode(fmt, img)
    b64 = base64.b64encode(buffer).decode("utf-8")
    mime = "image/jpeg" if fmt == ".jpg" else "image/png"
    return f"data:{mime};base64,{b64}"


def load_overlay_image(path: str) -> np.ndarray | None:
    """Load a PNG with alpha channel for overlay."""
    img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    if img is None:
        return None
    # Ensure 4 channels (BGRA)
    if img.shape[2] == 3:
        alpha = np.full((*img.shape[:2], 1), 255, dtype=np.uint8)
        img = np.concatenate([img, alpha], axis=2)
    return img


def overlay_transparent(
    background: np.ndarray,
    overlay: np.ndarray,
    x: int,
    y: int,
    overlay_size: tuple[int, int] | None = None,
) -> np.ndarray:
    """
    Place a BGRA overlay onto a BGR background at position (x, y).
    overlay_size: optional (width, height) to resize the overlay.
    """
    bg = background.copy()

    if overlay_size is not None:
        overlay = cv2.resize(overlay, overlay_size, interpolation=cv2.INTER_AREA)

    h, w = overlay.shape[:2]
    bg_h, bg_w = bg.shape[:2]

    # Clamp to background bounds
    x1 = max(x, 0)
    y1 = max(y, 0)
    x2 = min(x + w, bg_w)
    y2 = min(y + h, bg_h)

    ox1 = x1 - x
    oy1 = y1 - y
    ox2 = ox1 + (x2 - x1)
    oy2 = oy1 + (y2 - y1)

    if x2 <= x1 or y2 <= y1:
        return bg

    overlay_crop = overlay[oy1:oy2, ox1:ox2]
    alpha = overlay_crop[:, :, 3:4].astype(float) / 255.0
    rgb = overlay_crop[:, :, :3].astype(float)

    bg_region = bg[y1:y2, x1:x2].astype(float)
    blended = rgb * alpha + bg_region * (1.0 - alpha)
    bg[y1:y2, x1:x2] = blended.astype(np.uint8)

    return bg
