"""Advanced color compatibility scoring for outfit generation.

Supports:
- Group compatibility matrix (neutral/warm/cool/accent)
- HSV hue distance analysis with saturation awareness
- Triadic and split-complementary color scheme detection
- Monochromatic outfit bonuses
- Tone-on-tone recognition
"""

import colorsys
from functools import lru_cache

# Compatibility matrix between color groups.
_GROUP_COMPAT: dict[tuple[str, str], float] = {
    ("neutral", "neutral"): 0.9,
    ("neutral", "warm"): 0.85,
    ("neutral", "cool"): 0.85,
    ("neutral", "accent"): 0.8,
    ("warm", "warm"): 0.75,
    ("warm", "cool"): 0.5,
    ("warm", "accent"): 0.6,
    ("cool", "cool"): 0.75,
    ("cool", "accent"): 0.6,
    ("accent", "accent"): 0.3,
}


def group_compatibility(g1: str, g2: str) -> float:
    """Return compatibility score between two color groups."""
    pair = (g1, g2) if (g1, g2) in _GROUP_COMPAT else (g2, g1)
    return _GROUP_COMPAT.get(pair, 0.5)


@lru_cache(maxsize=256)
def hex_to_hsv(hex_color: str) -> tuple[float, float, float]:
    """Convert hex color string to HSV tuple (h 0-360, s 0-1, v 0-1)."""
    hex_color = hex_color.lstrip("#")
    r, g, b = (int(hex_color[i : i + 2], 16) / 255.0 for i in (0, 2, 4))
    h, s, v = colorsys.rgb_to_hsv(r, g, b)
    return h * 360, s, v


def hue_distance(hex1: str, hex2: str) -> float:
    """Return hue distance (0-180) between two hex colors."""
    h1, s1, _ = hex_to_hsv(hex1)
    h2, s2, _ = hex_to_hsv(hex2)
    # Low-saturation colors (grays) shouldn't penalize hue distance
    if s1 < 0.1 or s2 < 0.1:
        return 0.0
    diff = abs(h1 - h2)
    return min(diff, 360 - diff)


def _value_contrast_bonus(hex1: str, hex2: str) -> float:
    """Bonus for good light/dark contrast between items."""
    _, s1, v1 = hex_to_hsv(hex1)
    _, s2, v2 = hex_to_hsv(hex2)
    contrast = abs(v1 - v2)
    # Good contrast (0.3-0.6) is visually appealing
    if 0.25 <= contrast <= 0.65:
        return 0.06
    # Extreme contrast also works (e.g., black + white)
    if contrast > 0.65:
        return 0.04
    return 0.0


def _saturation_harmony(hex1: str, hex2: str) -> float:
    """Bonus when items share similar saturation levels."""
    _, s1, _ = hex_to_hsv(hex1)
    _, s2, _ = hex_to_hsv(hex2)
    diff = abs(s1 - s2)
    if diff < 0.15:
        return 0.04
    if diff < 0.3:
        return 0.02
    return 0.0


def color_pair_score(hex1: str, group1: str, hex2: str, group2: str) -> float:
    """Score compatibility between two colors (0-1)."""
    base = group_compatibility(group1, group2)
    dist = hue_distance(hex1, hex2)

    # Analogous hues (within 30 degrees) — harmonious
    if dist < 30:
        hue_bonus = 0.12
    # Complementary hues (150-180 degrees) — bold but stylish
    elif dist > 150:
        hue_bonus = 0.06
    # Split-complementary (120-150) — fashionable
    elif dist > 120:
        hue_bonus = 0.04
    # Triadic range (100-130) — can work
    elif 95 < dist < 135:
        hue_bonus = 0.02
    # Awkward middle distances
    elif dist > 60:
        hue_bonus = -0.05
    else:
        hue_bonus = 0.0

    # Value contrast and saturation harmony bonuses
    v_bonus = _value_contrast_bonus(hex1, hex2)
    s_bonus = _saturation_harmony(hex1, hex2)

    return max(0.0, min(1.0, base + hue_bonus + v_bonus + s_bonus))


def _detect_color_scheme(colors: list[tuple[str, str]]) -> str:
    """Detect the overall color scheme of an outfit."""
    if len(colors) < 2:
        return "single"

    hex_colors = [h for h, _ in colors]
    hsv_colors = [hex_to_hsv(h) for h in hex_colors]

    # Filter out neutrals (low saturation)
    chromatic = [(h, s, v) for h, s, v in hsv_colors if s >= 0.1]

    if len(chromatic) == 0:
        return "achromatic"  # All neutrals

    if len(chromatic) == 1:
        return "neutral_pop"  # One accent + neutrals

    # Check for monochromatic (all hues within 20 degrees)
    hues = [h for h, s, v in chromatic]
    hue_spread = max(hues) - min(hues)
    if hue_spread < 25 or hue_spread > 335:
        return "monochromatic"

    # Check for complementary
    for i in range(len(chromatic)):
        for j in range(i + 1, len(chromatic)):
            dist = abs(chromatic[i][0] - chromatic[j][0])
            dist = min(dist, 360 - dist)
            if dist > 150:
                return "complementary"

    return "mixed"


def outfit_color_score(colors: list[tuple[str, str]]) -> float:
    """
    Score overall color harmony of an outfit.
    colors: list of (hex, group) tuples for each item.
    """
    if len(colors) < 2:
        return 1.0

    # Pairwise compatibility
    total = 0.0
    pairs = 0
    for i in range(len(colors)):
        for j in range(i + 1, len(colors)):
            total += color_pair_score(
                colors[i][0], colors[i][1], colors[j][0], colors[j][1]
            )
            pairs += 1

    base_score = total / pairs if pairs > 0 else 0.5

    # Penalize too many distinct color groups
    distinct_groups = len({g for _, g in colors})
    if distinct_groups > 3:
        base_score -= 0.1 * (distinct_groups - 3)

    # Bonuses based on detected color scheme
    scheme = _detect_color_scheme(colors)
    scheme_bonuses = {
        "achromatic": 0.08,       # All neutrals — always safe
        "neutral_pop": 0.10,      # One pop of color — very fashionable
        "monochromatic": 0.12,    # Tone-on-tone — trending
        "complementary": 0.05,    # Bold complementary — statement look
        "single": 0.0,
        "mixed": 0.0,
    }
    base_score += scheme_bonuses.get(scheme, 0.0)

    # Bonus for having at least one neutral
    has_neutral = any(g == "neutral" for _, g in colors)
    if has_neutral:
        base_score += 0.03

    # Scale to 0.5-0.98 range for more realistic display
    final = 0.5 + base_score * 0.48
    return max(0.0, min(0.98, final))
