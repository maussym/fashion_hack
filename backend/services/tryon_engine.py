"""Virtual Try-On engine using MediaPipe PoseLandmarker + OpenCV overlay.

Improvements over base version:
- Perspective warping based on shoulder/hip angles
- Gradient overlays with garment silhouette shapes
- Better body proportion handling
- Support for trying full outfits (multiple items)
"""

from __future__ import annotations

import logging

import cv2
import mediapipe as mp
import numpy as np

from config import DATA_DIR, IMAGES_DIR
from models.schemas import CatalogItem
from pathlib import Path
from services.catalog_cache import get_catalog
from utils.image_utils import (
    base64_to_cv2,
    cv2_to_base64,
    load_overlay_image,
    overlay_transparent,
)

logger = logging.getLogger(__name__)

BaseOptions = mp.tasks.BaseOptions
PoseLandmarker = mp.tasks.vision.PoseLandmarker
PoseLandmarkerOptions = mp.tasks.vision.PoseLandmarkerOptions
VisionRunningMode = mp.tasks.vision.RunningMode

MODEL_PATH = str(DATA_DIR / "pose_landmarker_lite.task")

# Landmark indices (MediaPipe Pose)
LEFT_SHOULDER = 11
RIGHT_SHOULDER = 12
LEFT_ELBOW = 13
RIGHT_ELBOW = 14
LEFT_WRIST = 15
RIGHT_WRIST = 16
LEFT_HIP = 23
RIGHT_HIP = 24
LEFT_KNEE = 25
RIGHT_KNEE = 26
LEFT_ANKLE = 27
RIGHT_ANKLE = 28


def _get_landmark_px(
    landmark, img_w: int, img_h: int, min_visibility: float = 0.5
) -> tuple[int, int] | None:
    """Convert normalized landmark to pixel coordinates."""
    if landmark.visibility < min_visibility:
        return None
    return int(landmark.x * img_w), int(landmark.y * img_h)


def _compute_angle(p1: tuple[int, int], p2: tuple[int, int]) -> float:
    """Compute angle in degrees between two points relative to horizontal."""
    dx = p2[0] - p1[0]
    dy = p2[1] - p1[1]
    return np.degrees(np.arctan2(dy, dx))


def _compute_garment_region(
    landmarks: list,
    img_w: int,
    img_h: int,
    category: str,
) -> tuple[int, int, int, int, float] | None:
    """
    Compute (x, y, w, h, angle) region for garment placement.
    Returns None if required landmarks are not visible.
    angle is the body tilt in degrees for perspective correction.
    """
    if category == "top":
        ls = _get_landmark_px(landmarks[LEFT_SHOULDER], img_w, img_h)
        rs = _get_landmark_px(landmarks[RIGHT_SHOULDER], img_w, img_h)
        lh = _get_landmark_px(landmarks[LEFT_HIP], img_w, img_h)
        rh = _get_landmark_px(landmarks[RIGHT_HIP], img_w, img_h)
        if not all([ls, rs, lh, rh]):
            return None

        # Calculate body tilt
        shoulder_angle = _compute_angle(rs, ls)
        hip_angle = _compute_angle(rh, lh)
        body_angle = (shoulder_angle + hip_angle) / 2

        x_min = min(ls[0], rs[0])
        x_max = max(ls[0], rs[0])
        y_min = min(ls[1], rs[1])
        y_max = max(lh[1], rh[1])

        # Adaptive padding based on shoulder width
        shoulder_width = x_max - x_min
        pad_x = int(shoulder_width * 0.25)
        pad_y_top = int((y_max - y_min) * 0.12)
        pad_y_bottom = int((y_max - y_min) * 0.05)

        x = x_min - pad_x
        y = y_min - pad_y_top
        w = (x_max - x_min) + 2 * pad_x
        h = (y_max - y_min) + pad_y_top + pad_y_bottom

        return x, y, w, h, body_angle

    elif category == "bottom":
        lh = _get_landmark_px(landmarks[LEFT_HIP], img_w, img_h)
        rh = _get_landmark_px(landmarks[RIGHT_HIP], img_w, img_h)
        la = _get_landmark_px(landmarks[LEFT_ANKLE], img_w, img_h)
        ra = _get_landmark_px(landmarks[RIGHT_ANKLE], img_w, img_h)
        lk = _get_landmark_px(landmarks[LEFT_KNEE], img_w, img_h)
        rk = _get_landmark_px(landmarks[RIGHT_KNEE], img_w, img_h)
        if not all([lh, rh]):
            return None

        hip_angle = _compute_angle(rh, lh)

        if la and ra:
            y_bottom = max(la[1], ra[1])
        elif lk and rk:
            y_bottom = max(lk[1], rk[1]) + int(img_h * 0.15)
        else:
            y_bottom = int(img_h * 0.9)

        x_min = min(lh[0], rh[0])
        x_max = max(lh[0], rh[0])
        y_min = min(lh[1], rh[1])

        hip_width = x_max - x_min
        pad_x = int(hip_width * 0.30)
        x = x_min - pad_x
        y = y_min
        w = (x_max - x_min) + 2 * pad_x
        h = y_bottom - y_min

        return x, y, w, h, hip_angle

    return None


def _create_garment_overlay(
    category: str, color_hex: str, width: int, height: int
) -> np.ndarray:
    """
    Create a garment-shaped semi-transparent overlay with gradients
    when no real garment image is available.
    """
    hex_color = color_hex.lstrip("#")
    r = int(hex_color[0:2], 16)
    g = int(hex_color[2:4], 16)
    b = int(hex_color[4:6], 16)

    overlay = np.zeros((height, width, 4), dtype=np.uint8)

    if category == "top":
        # T-shirt / blouse shape
        mask = np.zeros((height, width), dtype=np.uint8)

        # Neckline
        neck_w = width // 4
        neck_h = height // 10
        neck_cx = width // 2

        # Body of the garment
        pts_body = np.array([
            [width // 8, neck_h],           # Left shoulder
            [0, height // 5],               # Left sleeve start
            [0, height // 3],               # Left sleeve end
            [width // 6, height // 3],      # Left armpit
            [width // 8, height - 1],       # Left hem
            [width * 7 // 8, height - 1],   # Right hem
            [width * 5 // 6, height // 3],  # Right armpit
            [width, height // 3],           # Right sleeve end
            [width, height // 5],           # Right sleeve start
            [width * 7 // 8, neck_h],       # Right shoulder
        ], dtype=np.int32)

        cv2.fillPoly(mask, [pts_body], 255)

        # Cut out neckline (ellipse)
        cv2.ellipse(mask, (neck_cx, neck_h), (neck_w, neck_h), 0, 0, 360, 0, -1)

    elif category == "bottom":
        # Pants / trousers shape
        mask = np.zeros((height, width), dtype=np.uint8)

        waist_inset = width // 10
        crotch_y = height // 3
        leg_gap = width // 8

        pts = np.array([
            [waist_inset, 0],                       # Left waist
            [width - waist_inset, 0],                # Right waist
            [width - waist_inset // 2, crotch_y],    # Right hip
            [width // 2 + leg_gap, crotch_y],        # Inner right
            [width * 2 // 3, height - 1],            # Right ankle
            [width // 3, height - 1],                # Left ankle
            [width // 2 - leg_gap, crotch_y],        # Inner left
            [waist_inset // 2, crotch_y],            # Left hip
        ], dtype=np.int32)

        cv2.fillPoly(mask, [pts], 255)
    else:
        # Fallback rectangle with rounded corners
        mask = np.zeros((height, width), dtype=np.uint8)
        radius = min(width, height) // 8
        if radius < 1:
            radius = 1
        cv2.rectangle(mask, (radius, 0), (width - radius, height), 255, -1)
        cv2.rectangle(mask, (0, radius), (width, height - radius), 255, -1)
        cv2.circle(mask, (radius, radius), radius, 255, -1)
        cv2.circle(mask, (width - radius, radius), radius, 255, -1)
        cv2.circle(mask, (radius, height - radius), radius, 255, -1)
        cv2.circle(mask, (width - radius, height - radius), radius, 255, -1)

    # Apply gradient for more realistic look
    gradient = np.linspace(0.85, 1.0, height).reshape(-1, 1)
    # Add slight horizontal gradient for 3D effect
    h_gradient = np.linspace(0.92, 1.0, width // 2)
    h_gradient = np.concatenate([h_gradient, h_gradient[::-1]])
    if len(h_gradient) < width:
        h_gradient = np.pad(h_gradient, (0, width - len(h_gradient)), constant_values=0.92)
    h_gradient = h_gradient[:width].reshape(1, -1)

    combined_gradient = gradient * h_gradient

    overlay[:, :, 0] = np.clip(b * combined_gradient, 0, 255).astype(np.uint8)
    overlay[:, :, 1] = np.clip(g * combined_gradient, 0, 255).astype(np.uint8)
    overlay[:, :, 2] = np.clip(r * combined_gradient, 0, 255).astype(np.uint8)
    overlay[:, :, 3] = (mask * 0.75).astype(np.uint8)  # Semi-transparent

    # Smooth edges with Gaussian blur on alpha
    alpha_smooth = cv2.GaussianBlur(overlay[:, :, 3], (5, 5), 0)
    overlay[:, :, 3] = alpha_smooth

    return overlay


def _apply_perspective_warp(
    overlay: np.ndarray,
    angle: float,
    region_w: int,
    region_h: int,
) -> np.ndarray:
    """Apply subtle perspective warp based on body angle."""
    if abs(angle) < 2:
        return cv2.resize(overlay, (region_w, region_h), interpolation=cv2.INTER_AREA)

    h, w = overlay.shape[:2]
    # Resize first
    overlay = cv2.resize(overlay, (region_w, region_h), interpolation=cv2.INTER_AREA)
    h, w = overlay.shape[:2]

    # Subtle perspective shift
    shift = int(abs(angle) * 0.5)
    shift = min(shift, w // 10)

    if angle > 0:  # Tilted right
        src_pts = np.float32([[0, 0], [w, 0], [0, h], [w, h]])
        dst_pts = np.float32([
            [shift, 0], [w - shift, 0],
            [0, h], [w, h]
        ])
    else:  # Tilted left
        src_pts = np.float32([[0, 0], [w, 0], [0, h], [w, h]])
        dst_pts = np.float32([
            [0, 0], [w, 0],
            [shift, h], [w - shift, h]
        ])

    matrix = cv2.getPerspectiveTransform(src_pts, dst_pts)
    warped = cv2.warpPerspective(overlay, matrix, (w, h), borderMode=cv2.BORDER_CONSTANT)
    return warped


def _resolve_overlay_path(overlay_path: str) -> Path:
    normalized = overlay_path.replace("\\", "/").lstrip("/")
    if normalized.startswith("images/"):
        normalized = normalized[len("images/"):]
    return IMAGES_DIR / normalized


def _draw_body_outline(
    img: np.ndarray,
    landmarks: list,
    img_w: int,
    img_h: int,
) -> None:
    """Draw subtle body outline for visual feedback."""
    connections = [
        (LEFT_SHOULDER, RIGHT_SHOULDER),
        (LEFT_SHOULDER, LEFT_ELBOW),
        (RIGHT_SHOULDER, RIGHT_ELBOW),
        (LEFT_SHOULDER, LEFT_HIP),
        (RIGHT_SHOULDER, RIGHT_HIP),
        (LEFT_HIP, RIGHT_HIP),
        (LEFT_HIP, LEFT_KNEE),
        (RIGHT_HIP, RIGHT_KNEE),
        (LEFT_KNEE, LEFT_ANKLE),
        (RIGHT_KNEE, RIGHT_ANKLE),
    ]

    for idx1, idx2 in connections:
        p1 = _get_landmark_px(landmarks[idx1], img_w, img_h, 0.4)
        p2 = _get_landmark_px(landmarks[idx2], img_w, img_h, 0.4)
        if p1 and p2:
            cv2.line(img, p1, p2, (255, 255, 255), 1, cv2.LINE_AA)

    # Key point dots
    key_points = [
        LEFT_SHOULDER, RIGHT_SHOULDER,
        LEFT_HIP, RIGHT_HIP,
        LEFT_KNEE, RIGHT_KNEE,
        LEFT_ANKLE, RIGHT_ANKLE,
    ]
    for idx in key_points:
        pt = _get_landmark_px(landmarks[idx], img_w, img_h, 0.4)
        if pt:
            cv2.circle(img, pt, 3, (0, 220, 100), -1, cv2.LINE_AA)
            cv2.circle(img, pt, 5, (0, 220, 100), 1, cv2.LINE_AA)


def _find_item(item_id: str) -> dict | None:
    """Find item in cached catalog."""
    catalog = get_catalog()
    for item in catalog:
        if item.id == item_id:
            return item.model_dump()
    return None


def process_tryon(photo_base64: str, item_id: str) -> dict:
    """
    Process virtual try-on: detect pose, overlay garment.
    Returns dict with result_base64, landmarks_detected, message.
    """
    item = _find_item(item_id)
    if item is None:
        return {
            "result_base64": "",
            "landmarks_detected": False,
            "message": "Товар не найден",
        }

    category = item["category"]
    if category not in ("top", "bottom"):
        return {
            "result_base64": "",
            "landmarks_detected": False,
            "message": "Виртуальная примерка доступна только для верха и низа",
        }

    # Decode photo
    img = base64_to_cv2(photo_base64)
    if img is None:
        return {
            "result_base64": "",
            "landmarks_detected": False,
            "message": "Не удалось декодировать фото",
        }

    img_h, img_w = img.shape[:2]

    # Limit image size for performance
    max_dim = 1280
    if max(img_h, img_w) > max_dim:
        scale = max_dim / max(img_h, img_w)
        img = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
        img_h, img_w = img.shape[:2]

    # Detect pose
    options = PoseLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=MODEL_PATH),
        running_mode=VisionRunningMode.IMAGE,
        min_pose_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    )

    with PoseLandmarker.create_from_options(options) as landmarker:
        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        results = landmarker.detect(mp_image)

    if not results.pose_landmarks or len(results.pose_landmarks) == 0:
        return {
            "result_base64": cv2_to_base64(img),
            "landmarks_detected": False,
            "message": "Не удалось определить позу. Загрузите фото в полный рост, стоя лицом к камере.",
        }

    landmarks = results.pose_landmarks[0]

    # Compute garment region with angle
    region = _compute_garment_region(landmarks, img_w, img_h, category)
    if region is None:
        return {
            "result_base64": cv2_to_base64(img),
            "landmarks_detected": True,
            "message": "Не удалось определить область для наложения одежды. Попробуйте другое фото.",
        }

    x, y, w, h, angle = region
    w = max(w, 10)
    h = max(h, 10)

    # Try to load real overlay image
    overlay_path = item.get("overlay_image_url")
    garment_overlay = None
    if overlay_path:
        local_path = _resolve_overlay_path(overlay_path)
        garment_overlay = load_overlay_image(str(local_path))

    # If no real overlay, create a garment-shaped placeholder
    if garment_overlay is None:
        garment_overlay = _create_garment_overlay(
            category, item["color"]["hex"], w, h
        )

    # Apply perspective warp
    warped_overlay = _apply_perspective_warp(garment_overlay, angle, w, h)

    # Apply overlay
    result_img = overlay_transparent(img, warped_overlay, x, y)

    # Draw body outline
    _draw_body_outline(result_img, landmarks, img_w, img_h)

    return {
        "result_base64": cv2_to_base64(result_img),
        "landmarks_detected": True,
        "message": "Примерка выполнена успешно",
    }


def process_tryon_outfit(photo_base64: str, item_ids: list[str]) -> dict:
    """
    Process virtual try-on for multiple items (full outfit).
    Overlays top first, then bottom.
    """
    items = []
    for item_id in item_ids:
        item = _find_item(item_id)
        if item and item["category"] in ("top", "bottom"):
            items.append(item)

    if not items:
        return {
            "result_base64": "",
            "landmarks_detected": False,
            "message": "Нет подходящих товаров для примерки",
        }

    # Decode photo
    img = base64_to_cv2(photo_base64)
    if img is None:
        return {
            "result_base64": "",
            "landmarks_detected": False,
            "message": "Не удалось декодировать фото",
        }

    img_h, img_w = img.shape[:2]
    max_dim = 1280
    if max(img_h, img_w) > max_dim:
        scale = max_dim / max(img_h, img_w)
        img = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
        img_h, img_w = img.shape[:2]

    # Detect pose
    options = PoseLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=MODEL_PATH),
        running_mode=VisionRunningMode.IMAGE,
        min_pose_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    )

    with PoseLandmarker.create_from_options(options) as landmarker:
        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        results = landmarker.detect(mp_image)

    if not results.pose_landmarks or len(results.pose_landmarks) == 0:
        return {
            "result_base64": cv2_to_base64(img),
            "landmarks_detected": False,
            "message": "Не удалось определить позу.",
        }

    landmarks = results.pose_landmarks[0]
    result_img = img.copy()

    # Sort: apply bottom first, then top (top overlaps bottom naturally)
    items.sort(key=lambda x: 0 if x["category"] == "bottom" else 1)
    applied = []

    for item in items:
        category = item["category"]
        region = _compute_garment_region(landmarks, img_w, img_h, category)
        if region is None:
            continue

        x, y, w, h, angle = region
        w = max(w, 10)
        h = max(h, 10)

        overlay_path = item.get("overlay_image_url")
        garment_overlay = None
        if overlay_path:
            local_path = _resolve_overlay_path(overlay_path)
            garment_overlay = load_overlay_image(str(local_path))

        if garment_overlay is None:
            garment_overlay = _create_garment_overlay(
                category, item["color"]["hex"], w, h
            )

        warped = _apply_perspective_warp(garment_overlay, angle, w, h)
        result_img = overlay_transparent(result_img, warped, x, y)
        applied.append(item["name_ru"])

    _draw_body_outline(result_img, landmarks, img_w, img_h)

    return {
        "result_base64": cv2_to_base64(result_img),
        "landmarks_detected": True,
        "message": f"Примерка выполнена: {', '.join(applied)}" if applied else "Не удалось наложить одежду",
    }
