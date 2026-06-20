"""
LLM-based Egyptian NID field extractor — production build
==========================================================
Two-pass strategy per request:

  Pass 1 — full card → all 6 fields  (Gemini 2.5 Flash / Groq)
  Pass 2 — NID strip zoom → 14-digit NID only  (if Pass 1 missed it)

Providers  (priority order, set in .env):
  GOOGLE_API_KEY  →  Gemini 2.5 Flash  (best Arabic vision, free tier)
                     https://aistudio.google.com/apikey
  GROQ_API_KEY    →  Llama-4-Scout     (fast fallback, free tier)
                     https://console.groq.com
"""

from __future__ import annotations

import base64
import datetime
import json
import logging
import os
import re
import time
from concurrent.futures import ThreadPoolExecutor

import cv2
import numpy as np

logger = logging.getLogger(__name__)

# ── Constants ─────────────────────────────────────────────────────────────────

_FIELD_KEYS = [
    "الاسم بالكامل",
    "الرقم القومي",
    "تاريخ الميلاد",
    "العنوان بالكامل",
    "المنطقة والمحافظة",
    "رقم البطاقة",
]

_AR2LA = str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789")
_LA2AR = str.maketrans("0123456789", "٠١٢٣٤٥٦٧٨٩")
_ALEF  = re.compile(r"[أإآٱ]")

# Egyptian governorate codes (digits 7-8 of the NID)
_GOV_CODES = {
    "01","02","03","04","11","12","13","14","15","16","17","18","19",
    "21","22","23","24","25","26","27","28","29","31","32","33","34","35","88",
}

# Full Arabic governorate names keyed by the same 2-digit code
_GOV_NAMES = {
    "01": "القاهرة",       "02": "الإسكندرية",   "03": "بورسعيد",
    "04": "السويس",        "11": "دمياط",         "12": "الدقهلية",
    "13": "الشرقية",       "14": "القليوبية",     "15": "كفر الشيخ",
    "16": "الغربية",       "17": "المنوفية",      "18": "البحيرة",
    "19": "الإسماعيلية",   "21": "الجيزة",        "22": "بني سويف",
    "23": "الفيوم",        "24": "المنيا",         "25": "أسيوط",
    "26": "سوهاج",         "27": "قنا",            "28": "أسوان",
    "29": "الأقصر",        "31": "البحر الأحمر",  "32": "الوادي الجديد",
    "33": "مطروح",         "34": "شمال سيناء",    "35": "جنوب سيناء",
    "88": "خارج الجمهورية",
}

# Header noise words that should never appear in the name
_NAME_NOISE = {
    "جمهورية", "مصر", "العربية", "بطاقة", "تحقيق",
    "الشخصية", "بطاقه", "التحقيق",
}

# ── Prompts ───────────────────────────────────────────────────────────────────

_FULL_CARD_PROMPT = """\
You are an expert OCR system for Egyptian National ID cards (بطاقة تحقيق الشخصية).

Examine the ENTIRE card image carefully and extract the 6 fields below.
Return ONLY a valid JSON object — no markdown, no explanation, no code fences.
Use null for any field that is truly unreadable.

━━━ FIELD GUIDE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. "الاسم بالكامل"  — Full name
   ⚠ CRITICAL — the name spans TWO lines. You MUST read and include BOTH lines:
     • TOP line (upper)    → given / first name — may be a SINGLE word (e.g. "بسمله", "محمد", "نور")
     • BOTTOM line (lower) → remaining family names — usually 2-4 words
     • ALWAYS start with the TOP line word(s), then the BOTTOM line words, separated by a space.
     • ✅ CORRECT: "بسمله عمرو عبدالفتاح محمد شعراوى"  — single first name "بسمله" FIRST
     • ❌ WRONG:   "عمرو عبدالفتاح محمد شعراوى"  — missing the first name entirely
     • ❌ WRONG:   "عمرو عبدالفتاح محمد شعراوى بسمله"  — first name at the END is wrong
   • Ignore the card header lines: "جمهورية مصر العربية" and "بطاقة تحقيق الشخصية"
   • Even if the top line is only ONE word, that word is part of the full name — do NOT skip it.

2. "الرقم القومي"  — 14-digit National ID number
   • Printed in LARGE digits across the bottom strip, full width of the card
   • EXACTLY 14 digits; starts with 2 (born 1900s) or 3 (born 2000s)
   • Structure: [C][YY][MM][DD][GG][SSSS][X]
       C  = century (2 or 3)
       YY = year last 2 digits
       MM = birth month (01-12)
       DD = birth day   (01-31)
       GG = governorate code (01-35 or 88)
       SSSS = 4-digit serial
       X  = check digit
   • ‼ Use Arabic-Indic digits ONLY: ٠١٢٣٤٥٦٧٨٩

3. "تاريخ الميلاد"  — Date of birth
   • Format: YYYY/MM/DD  using Arabic-Indic digits
   • Example: ١٩٨٥/٠٦/١٥

4. "العنوان بالكامل"  — Street address
   • Arabic text; may contain: شارع / ش / عطفة / ميدان / طريق / ح / حارة / زقاق / عمارة
   • "ح" before a name means حارة (lane) — treat it as a street address prefix
   • Example: "٣٧ح شعراوى" is a valid street address (lane 37 Sha'rawi)
   • Do NOT include district or governorate name here

5. "المنطقة والمحافظة"  — District and governorate
   • The AREA name followed by the GOVERNORATE name
   • Do NOT repeat this in the address field

6. "رقم البطاقة"  — Card serial number
   • Alphanumeric code, bottom-left OR bottom-right corner of the card
   • May start with a digit (new cards: 1M…, 2K…) OR two letters (old cards: JH…, KH…)
   • Example new card: 2K1234567 — example old card: JH4811341

━━━ COMMON ERRORS TO AVOID ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• NID: The card has a colored security pattern background — the 14 digits are LARGE text printed below. Focus only on those large digits.
• Address vs District: Address contains شارع/ش/طريق/عطفة (street words). District is the area+governorate below it.
• Name order: The SHORTER line at the TOP is the first name. The LONGER line below is the rest.
• Card serial: Bottom-RIGHT corner. Starts with a digit, NOT the letter I or l.
• Do not confuse ١ (Arabic digit one) with ا (alef letter) in names.
• Do not confuse ٠ (Arabic digit zero) with the letter O in the NID strip.

━━━ EXAMPLE OUTPUT (FAKE placeholder values — do NOT copy these) ━━━━━━━━━━━
{
  "الاسم بالكامل": "محمد احمد عبدالله السيد",
  "الرقم القومي": "٢٨٥٠٦١٥٠١٠١٢٣٤",
  "تاريخ الميلاد": "١٩٨٥/٠٦/١٥",
  "العنوان بالكامل": "١٢ شارع التحرير",
  "المنطقة والمحافظة": "وسط البلد القاهرة",
  "رقم البطاقة": "2K1234567"
}
⚠ The above are FAKE examples only. Extract ONLY what is actually printed on the card in the image.
"""

_NID_ONLY_PROMPT = """\
This image shows the bottom section of an Egyptian National ID card (بطاقة تحقيق الشخصية).

Find the 14-digit National ID number (الرقم القومي). It is the LARGEST number printed
on the card, spanning most of the width. It starts with 2 (born 1900s) or 3 (born 2000s).

Rules:
- Exactly 14 digits, no spaces or dashes
- Use Arabic-Indic digits only: ٠١٢٣٤٥٦٧٨٩
- Ignore the shorter date (6 digits like ٢٠٠٤/٠٥/٢٧) on the left — that is NOT the NID
- Ignore the card serial (alphanumeric like JH4811341) at the very bottom — that is NOT the NID

Reply with ONLY the 14-digit NID number. No explanation.
"""

_NID_FULLCARD_PROMPT = """\
Look at this Egyptian National ID card image.

Find and return ONLY the 14-digit National ID number (الرقم القومي).
It is printed in LARGE digits across the lower portion of the card.
Starts with 2 or 3. Exactly 14 digits.

Use Arabic-Indic digits (٠١٢٣٤٥٦٧٨٩). No spaces. No explanation. Just 14 digits.
"""

_DATE_ONLY_PROMPT = """\
This image shows the lower-left section of an Egyptian National ID card.

Find the date of birth (تاريخ الميلاد). It looks like: ٢٠٠٤/٠٥/٢٧

Output ONLY the date in YYYY/MM/DD format using Arabic-Indic digits.
DO NOT explain. DO NOT reason. DO NOT use steps. Just output the date.

If you cannot read it clearly, output the digits you can see.
"""

_ADDRESS_ZONE_PROMPT = """\
This image shows the middle section of an Egyptian National ID card.

Find the street address (العنوان بالكامل). It is a short Arabic text that may start with:
- A number followed by ح or شارع or ش (e.g. "٣٧ح شعراوى" or "١٢ شارع النيل")
- "ح" means حارة (lane/alley) and is a valid address prefix

Output ONLY the street address text — nothing else. No explanation.
"""


# ── Image utilities ───────────────────────────────────────────────────────────

def _to_jpeg(img: np.ndarray, quality: int = 90) -> bytes:
    ok, buf = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, quality])
    if not ok:
        raise RuntimeError("cv2.imencode failed")
    return buf.tobytes()


def _prep_full_card(image_path: str, enhanced: bool = False) -> bytes:
    """
    Load → shadow removal → optional sharpening → resize → JPEG bytes.

    enhanced=True applies stronger preprocessing for low-quality / dark photos.
    """
    img = cv2.imread(image_path)
    if img is None:
        raise FileNotFoundError(f"Cannot read image: {image_path}")

    # Shadow removal via LAB L-channel CLAHE
    clip = 5.0 if enhanced else 3.0
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=clip, tileGridSize=(8, 8))
    l = clahe.apply(l)
    img = cv2.cvtColor(cv2.merge([l, a, b]), cv2.COLOR_LAB2BGR)

    # Unsharp mask — sharpens ink edges blurred by phone cameras
    blur_sigma = 2.0 if enhanced else 1.5
    blurred = cv2.GaussianBlur(img, (0, 0), blur_sigma)
    img = cv2.addWeighted(img, 1.4, blurred, -0.4, 0)

    max_w = 1920 if enhanced else 1600
    h, w = img.shape[:2]
    if w > max_w:
        s = max_w / w
        img = cv2.resize(img, None, fx=s, fy=s, interpolation=cv2.INTER_LANCZOS4)

    return _to_jpeg(img, quality=95)


def _prep_nid_strip(image_path: str, color: bool = False, top_frac: float = 0.55) -> bytes:
    """
    Crop the bottom portion of the card (where the NID lives), scale 3×,
    apply binarisation to maximise digit contrast → JPEG bytes.

    color=True   — skip binarization, return color strip (gold-toned old cards).
    top_frac     — where to start the crop (0.55 = bottom 45%).
    """
    img = cv2.imread(image_path)
    if img is None:
        raise FileNotFoundError(f"Cannot read image: {image_path}")

    h, w = img.shape[:2]
    strip = img[int(h * top_frac):, :]

    # Scale up for clarity
    scale = min(3, max(1, 900 // max(strip.shape[:2])))
    if scale > 1:
        strip = cv2.resize(strip, None, fx=scale, fy=scale,
                           interpolation=cv2.INTER_LANCZOS4)

    if color:
        # Color path: CLAHE on L channel only for contrast boost, keep color
        lab = cv2.cvtColor(strip, cv2.COLOR_BGR2LAB)
        lc, ac, bc = cv2.split(lab)
        lc = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(4, 4)).apply(lc)
        strip = cv2.cvtColor(cv2.merge([lc, ac, bc]), cv2.COLOR_LAB2BGR)
        return _to_jpeg(strip, quality=95)

    # Binary path: adaptive normalization removes security-pattern background
    gray = cv2.cvtColor(strip, cv2.COLOR_BGR2GRAY)
    k    = min(max(21, gray.shape[0] // 8), 51)
    k    = k if k % 2 == 1 else k + 1
    bg   = cv2.dilate(gray, cv2.getStructuringElement(cv2.MORPH_RECT, (k, k)))
    norm = cv2.divide(gray, bg, scale=255)
    clahe = cv2.createCLAHE(clipLimit=4.0, tileGridSize=(4, 4))
    norm = clahe.apply(norm)
    _, binary = cv2.threshold(norm, 0, 255,
                              cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    strip = cv2.cvtColor(binary, cv2.COLOR_GRAY2BGR)

    return _to_jpeg(strip, quality=95)


def _prep_address_zone(image_path: str) -> bytes:
    """
    Crop the middle portion of the card where the street address is printed.
    Scale 3× and enhance contrast.
    """
    img = cv2.imread(image_path)
    if img is None:
        raise FileNotFoundError(f"Cannot read image: {image_path}")

    h, w = img.shape[:2]
    # Address is in the middle 35-65% height, right 50-100% width (Arabic layout)
    zone = img[int(h * 0.38): int(h * 0.62), int(w * 0.30):]

    scale = min(4, max(2, 1000 // max(zone.shape[:2])))
    zone = cv2.resize(zone, None, fx=scale, fy=scale, interpolation=cv2.INTER_LANCZOS4)

    # LAB CLAHE + unsharp mask
    lab = cv2.cvtColor(zone, cv2.COLOR_BGR2LAB)
    lc, ac, bc = cv2.split(lab)
    lc = cv2.createCLAHE(clipLimit=4.0, tileGridSize=(4, 4)).apply(lc)
    zone = cv2.cvtColor(cv2.merge([lc, ac, bc]), cv2.COLOR_LAB2BGR)
    blurred = cv2.GaussianBlur(zone, (0, 0), 1.5)
    zone = cv2.addWeighted(zone, 1.4, blurred, -0.4, 0)

    return _to_jpeg(zone, quality=95)


def _prep_nid_strip_tophat(image_path: str, top_frac: float = 0.55) -> bytes:
    """
    Specialized strip preprocessing for OLD-style Egyptian NID cards (gold/amber
    background with pyramid watermark).

    Key insight: gold is HIGH in the red channel, dark ink is LOW in red.
    A morphological black top-hat on the red channel isolates dark digit strokes
    from the uneven gold background far better than standard CLAHE + Otsu.
    top_frac — crop start fraction (default 0.55 = bottom 45%).
    """
    img = cv2.imread(image_path)
    if img is None:
        raise FileNotFoundError(f"Cannot read image: {image_path}")

    h, w = img.shape[:2]
    strip = img[int(h * top_frac):, :]

    # Scale 4× — more pixels per digit = better Groq recognition
    scale = min(4, max(2, 1200 // max(strip.shape[:2])))
    strip = cv2.resize(strip, None, fx=scale, fy=scale, interpolation=cv2.INTER_LANCZOS4)

    # Extract RED channel: gold = high red, dark ink = low red → best contrast
    r_ch = strip[:, :, 2]   # BGR → index 2 is Red

    # Black top-hat: closing(img) - img → highlights dark features smaller than kernel.
    # Kernel must be larger than a digit stroke (~30-40px at 3× scale) so that
    # closing() erases the digits and only the background remains.
    # Use digit-height-proportional sizing: roughly 2-3× a typical digit height.
    digit_h_est = max(30, r_ch.shape[0] // 8)  # estimated digit height in pixels
    kh = min(digit_h_est * 3, r_ch.shape[0] // 2)
    kw = min(digit_h_est * 4, r_ch.shape[1] // 4)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (kw, kh))
    blackhat = cv2.morphologyEx(r_ch, cv2.MORPH_BLACKHAT, kernel)

    # CLAHE to normalize contrast across zones
    clahe = cv2.createCLAHE(clipLimit=5.0, tileGridSize=(4, 4))
    enhanced = clahe.apply(blackhat)

    # Otsu binarization
    _, binary = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # Slight dilation to fill in broken digit strokes
    dil = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
    binary = cv2.dilate(binary, dil, iterations=1)

    out = cv2.cvtColor(binary, cv2.COLOR_GRAY2BGR)
    return _to_jpeg(out, quality=95)


def _prep_date_zone(image_path: str) -> bytes:
    """
    Crop the lower-left area of the card where the date of birth is printed
    on both old and new Egyptian NID designs. Scale 4× for clarity.
    """
    img = cv2.imread(image_path)
    if img is None:
        raise FileNotFoundError(f"Cannot read image: {image_path}")

    h, w = img.shape[:2]
    # Date is in the lower 40%, left 55% of the card
    zone = img[int(h * 0.60):int(h * 0.88), : int(w * 0.55)]

    scale = min(4, max(2, 1000 // max(zone.shape[:2])))
    zone = cv2.resize(zone, None, fx=scale, fy=scale, interpolation=cv2.INTER_LANCZOS4)

    # LAB CLAHE for contrast enhancement without colour distortion
    lab = cv2.cvtColor(zone, cv2.COLOR_BGR2LAB)
    lc, ac, bc = cv2.split(lab)
    lc = cv2.createCLAHE(clipLimit=4.0, tileGridSize=(4, 4)).apply(lc)
    zone = cv2.cvtColor(cv2.merge([lc, ac, bc]), cv2.COLOR_LAB2BGR)

    # Unsharp mask to sharpen digit edges
    blurred = cv2.GaussianBlur(zone, (0, 0), 1.5)
    zone = cv2.addWeighted(zone, 1.5, blurred, -0.5, 0)

    return _to_jpeg(zone, quality=95)


# ── JSON / text parsing ───────────────────────────────────────────────────────

def _extract_first_json_object(text: str) -> str | None:
    """
    Walk *text* and return the substring of the first balanced {…} block.
    Properly handles nested objects, string values (incl. escaped quotes).
    """
    start = text.find("{")
    if start == -1:
        return None
    depth = 0
    in_string = False
    escape_next = False
    for i, ch in enumerate(text[start:], start):
        if escape_next:
            escape_next = False
            continue
        if ch == "\\" and in_string:
            escape_next = True
            continue
        if ch == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return text[start : i + 1]
    return None


def _parse_json(raw: str) -> dict | None:
    """
    Robust JSON extraction that survives:
    - Markdown code fences (```json … ```)
    - Thinking-model preamble text containing stray { } characters
    - Leading / trailing prose
    - Unicode escape sequences

    Strategy: strip fences, then iterate through every balanced {…} block
    in document order and return the first one that parses as a non-empty dict.
    """
    if not raw:
        return None

    # Strip all code-fence markers (opening ``` or ```json and closing ```)
    cleaned = re.sub(r"```(?:json)?", "", raw, flags=re.IGNORECASE).strip()

    # Try each balanced { } block in order — thinking content typically
    # uses unquoted keys so it won't parse as JSON; the actual JSON will.
    search_from = 0
    while True:
        brace_pos = cleaned.find("{", search_from)
        if brace_pos == -1:
            break
        candidate = _extract_first_json_object(cleaned[brace_pos:])
        if candidate:
            try:
                obj = json.loads(candidate)
                if isinstance(obj, dict) and len(obj) >= 1:
                    return obj
            except json.JSONDecodeError:
                pass
            search_from = brace_pos + 1
        else:
            break

    logger.debug("_parse_json: no parseable JSON object found")
    return None


def _parse_nid_digits(raw: str) -> str | None:
    """
    Extract a 14-digit Arabic-Indic NID from a raw LLM reply.

    Strategy:
    1. Normalise: convert any Western digits to Arabic-Indic, strip non-digits.
    2. If exactly 14 digits → return them.
    3. If MORE digits (e.g. top-hat reads all visible numbers), slide a 14-digit
       window and return the first structurally valid NID found.
    """
    if not raw:
        return None
    # Convert any Western digits → Arabic-Indic, then keep only Arabic-Indic digits
    all_ar = re.sub(r"[^٠-٩]", "", raw.translate(_LA2AR))
    if len(all_ar) == 14:
        return all_ar
    if len(all_ar) > 14:
        for i in range(len(all_ar) - 13):
            candidate_ar = all_ar[i:i + 14]
            if _validate_nid(candidate_ar.translate(_AR2LA)):
                return candidate_ar
    return None


# ── Field validation & normalisation ─────────────────────────────────────────

def _validate_nid(nid_western: str) -> bool:
    """Structural validation: length, century digit, date part, governorate."""
    if not nid_western or len(nid_western) != 14 or not nid_western.isdigit():
        return False
    if nid_western[0] not in "23":
        return False
    try:
        mo  = int(nid_western[3:5])
        day = int(nid_western[5:7])
    except ValueError:
        return False
    if not (1 <= mo <= 12 and 1 <= day <= 31):
        return False
    return nid_western[7:9] in _GOV_CODES


def _nid_checksum_ok(nid_western: str) -> bool:
    """
    Egyptian NID check digit (position 14) — Luhn-variant.
    Used to rank candidates, NOT to reject structurally valid NIDs.
    """
    if len(nid_western) != 14 or not nid_western.isdigit():
        return False
    weights = [2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1]
    total = sum(
        (d * w if d * w < 10 else d * w - 9)
        for d, w in zip((int(c) for c in nid_western), weights)
    )
    return total % 10 == 0


def _normalise_name(val: str) -> str | None:
    """Clean an Arabic name: remove noise words, normalize alef, tidy spaces."""
    if not val:
        return None
    val = _ALEF.sub("ا", val.strip())
    words = [w for w in val.split() if w not in _NAME_NOISE]
    arabic_words = [w for w in words
                    if sum(1 for c in w if "؀" <= c <= "ۿ") >= 2]
    if len(arabic_words) < 1:
        return None
    return " ".join(words)


def _normalise_nid(val: str) -> str | None:
    """
    Validate and return a 14-digit Arabic-Indic NID, or None.
    If structurally invalid but exactly 14 digits, still returns the digits
    so the user can manually verify rather than seeing a blank field.
    """
    if not val:
        return None
    ar = val.translate(_LA2AR)
    digits_ar = re.sub(r"[^٠-٩]", "", ar)
    if len(digits_ar) != 14:
        return None
    digits_la = digits_ar.translate(_AR2LA)
    if _validate_nid(digits_la):
        return digits_ar
    # 14 digits but structurally suspect — return anyway so user can correct
    logger.info("NID has 14 digits but failed structural validation — returning for user review")
    return digits_ar


def _normalise_date(val: str) -> str | None:
    """Parse a date string and return YYYY/MM/DD in Arabic-Indic, or None."""
    if not val:
        return None
    # Normalize to Western digits and separators
    s = re.sub(r"[-.]", "/", val.translate(_AR2LA))
    # Try YYYY/MM/DD
    m = re.match(r"(\d{4})/(\d{1,2})/(\d{1,2})$", s.strip())
    if m:
        y, mo, d = m.groups()
        mo, d = mo.zfill(2), d.zfill(2)
        if 1900 <= int(y) <= 2030 and 1 <= int(mo) <= 12 and 1 <= int(d) <= 31:
            return f"{y}/{mo}/{d}".translate(_LA2AR)
    # Try DD/MM/YYYY
    m = re.match(r"(\d{1,2})/(\d{1,2})/(\d{4})$", s.strip())
    if m:
        d, mo, y = m.groups()
        mo, d = mo.zfill(2), d.zfill(2)
        if 1900 <= int(y) <= 2030 and 1 <= int(mo) <= 12 and 1 <= int(d) <= 31:
            return f"{y}/{mo}/{d}".translate(_LA2AR)
    return None


def _normalise_serial(val: str) -> str | None:
    """
    Fix common OCR confusion in card serials.
    New cards start with a digit (e.g. 1M4729408, 2K1234567).
    Old cards start with two letters (e.g. JH4811341, KH1234567).
    """
    if not val:
        return None
    val = val.strip().upper()
    # New-card serials that start with a misread I/L → correct to digit 1
    if val and val[0] in ("I", "L") and len(val) >= 2 and val[1].isalpha():
        val = "1" + val[1:]
    # Fix embedded O → 0 in positions that should be digits
    # (after the leading letter prefix, all remaining should be alphanumeric)
    result = re.sub(r"O", "0", val)
    return result if re.fullmatch(r"[A-Z0-9]{5,12}", result) else None


def _normalise_address(addr: str | None, district: str | None) -> str | None:
    """
    Strip district/governorate text that bleeds into the address field.
    If the address ends with the district string, remove that suffix.
    """
    if not addr:
        return None
    addr = addr.strip().strip("-").strip()
    if district:
        dist_clean = _ALEF.sub("ا", district.strip())
        # Try to remove trailing occurrence of district (partial or full match)
        for chunk in [dist_clean] + dist_clean.split():
            if len(chunk) < 3:
                continue
            idx = addr.rfind(chunk)
            if idx != -1:
                candidate = addr[:idx].strip().strip("-").strip()
                if candidate:
                    addr = candidate
                    break
    return addr or None


_NULL_STRINGS = {"null", "none", "n/a", "غير موجود", "غير متوفر", "—", "-", ""}


def _coerce_null(val) -> str | None:
    """Convert LLM-returned null-like strings to Python None."""
    if val is None:
        return None
    s = str(val).strip()
    return None if s.lower() in _NULL_STRINGS else s


def _post_process(result: dict) -> dict:
    """
    Apply all field-level normalisation and cross-field consistency rules.
    Modifies a copy; never returns None values that were previously valid.
    """
    # Sanitize null-like strings that some LLMs return instead of JSON null
    out = {k: _coerce_null(v) for k, v in result.items()}

    # Name
    out["الاسم بالكامل"] = _normalise_name(out.get("الاسم بالكامل") or "")

    # NID
    out["الرقم القومي"] = _normalise_nid(out.get("الرقم القومي") or "")

    # Date — derive from NID and cross-validate
    raw_date = _normalise_date(out.get("تاريخ الميلاد") or "")
    nid_ar = out.get("الرقم القومي") or ""
    nid_la = nid_ar.translate(_AR2LA)
    nid_date = None
    if _validate_nid(nid_la):
        century = "19" if nid_la[0] == "2" else "20"
        y   = century + nid_la[1:3]
        mo  = nid_la[3:5]
        day = nid_la[5:7]
        nid_date = _normalise_date(f"{y}/{mo}/{day}")
    if not raw_date:
        raw_date = nid_date
    elif nid_date and raw_date != nid_date:
        # NID encodes date deterministically — trust it over LLM-read date
        logger.info("Date mismatch: LLM=%s NID-derived=%s — using NID-derived", raw_date, nid_date)
        raw_date = nid_date
    out["تاريخ الميلاد"] = raw_date

    # Address — strip any district bleed
    out["العنوان بالكامل"] = _normalise_address(
        out.get("العنوان بالكامل"),
        out.get("المنطقة والمحافظة"),
    )

    # District — basic cleanup
    dist = (out.get("المنطقة والمحافظة") or "").strip().strip("-").strip()
    out["المنطقة والمحافظة"] = dist or None

    # Card serial
    out["رقم البطاقة"] = _normalise_serial(out.get("رقم البطاقة") or "")

    return out


# ══════════════════════════════════════════════════════════════════════════════
# Provider: Google Gemini
# ══════════════════════════════════════════════════════════════════════════════

_GEMINI_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
]


def _gemini_call(jpeg_bytes: bytes, prompt: str, max_tokens: int = 1500) -> str | None:
    """
    Single Gemini call. Tries each model in _GEMINI_MODELS.
    Rate-limit (429) → cascade to next model.
    Returns raw text or None.

    Note: Gemini 2.5 Flash is a thinking model; it may use several hundred
    tokens for internal reasoning before emitting the JSON.  Use max_tokens ≥
    1500 for the full-card prompt to avoid truncating the JSON response.
    """
    api_key = os.environ.get("GOOGLE_API_KEY", "")
    if not api_key:
        return None
    try:
        from google import genai
        from google.genai import types
        client = genai.Client(api_key=api_key)
    except Exception as exc:
        logger.warning("Gemini client init failed: %s", exc)
        return None

    for model in _GEMINI_MODELS:
        for attempt in range(2):   # 1 retry per model on rate-limit
            try:
                resp = client.models.generate_content(
                    model=model,
                    contents=[
                        types.Part.from_bytes(data=jpeg_bytes, mime_type="image/jpeg"),
                        prompt,
                    ],
                    config=types.GenerateContentConfig(
                        temperature=0,
                        max_output_tokens=max_tokens,
                    ),
                )
                return resp.text
            except Exception as exc:
                err = str(exc)
                is_quota  = "429" in err or "RESOURCE_EXHAUSTED" in err
                is_unavail = "503" in err or "UNAVAILABLE" in err
                if (is_quota or is_unavail) and attempt == 0:
                    wait = 38 if is_quota else 5
                    logger.info("Gemini %s %s — waiting %ds …",
                                model, "rate-limited" if is_quota else "unavailable", wait)
                    time.sleep(wait)
                    continue
                if is_quota or is_unavail:
                    logger.warning("Gemini %s still unavailable — trying next model", model)
                    break   # cascade to next model
                logger.warning("Gemini %s error: %s", model, exc)
                break       # non-quota error — try next model

    return None


# ══════════════════════════════════════════════════════════════════════════════
# Provider: Groq
# ══════════════════════════════════════════════════════════════════════════════

_GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"


def _groq_retry_wait(err: str) -> float:
    """
    Parse 'Please try again in Xs' from a Groq 429 error and return
    that many seconds + 2 buffer.  Falls back to 15 if not parseable.
    """
    import re as _re
    m = _re.search(r"try again in (\d+(?:\.\d+)?)s", err)
    return float(m.group(1)) + 2.0 if m else 15.0


def _groq_call(jpeg_bytes: bytes, prompt: str, max_tokens: int = 600) -> str | None:
    """Groq vision call — up to 4 attempts with parsed retry-after waits."""
    api_key = os.environ.get("GROQ_API_KEY", "")
    if not api_key:
        return None
    try:
        from groq import Groq
        client = Groq(api_key=api_key)
    except Exception as exc:
        logger.warning("Groq client init failed: %s", exc)
        return None

    b64 = base64.b64encode(jpeg_bytes).decode()
    for attempt in range(4):
        try:
            resp = client.chat.completions.create(
                model=_GROQ_MODEL,
                max_tokens=max_tokens,
                temperature=0,
                seed=42,
                messages=[{
                    "role": "user",
                    "content": [
                        {"type": "image_url",
                         "image_url": {"url": f"data:image/jpeg;base64,{b64}"}},
                        {"type": "text", "text": prompt},
                    ],
                }],
            )
            return resp.choices[0].message.content.strip()
        except Exception as exc:
            err = str(exc)
            is_rate = "429" in err or "rate_limit" in err.lower()
            if attempt < 3:
                wait = _groq_retry_wait(err) if is_rate else 3.0
                logger.warning("Groq attempt %d failed (%s) — retrying in %.1fs …",
                               attempt + 1, "rate-limit" if is_rate else exc, wait)
                time.sleep(wait)
            else:
                logger.warning("Groq call failed after 4 attempts: %s", exc)
    return None


# ══════════════════════════════════════════════════════════════════════════════
# Extraction passes
# ══════════════════════════════════════════════════════════════════════════════

def _pass1_all_fields(image_path: str, enhanced: bool = False) -> dict | None:
    """
    Pass 1 — send the full card image with the 6-field prompt.
    Returns post-processed dict or None if both providers fail.
    enhanced=True uses stronger preprocessing for low-quality images.
    """
    try:
        full_jpeg = _prep_full_card(image_path, enhanced=enhanced)
    except Exception as exc:
        logger.error("Pass1: image load error: %s", exc)
        return None

    raw = None

    if os.environ.get("GOOGLE_API_KEY"):
        raw = _gemini_call(full_jpeg, _FULL_CARD_PROMPT, max_tokens=1500)
        if raw:
            logger.debug("Pass1 Gemini raw: %.300s", raw)

    if not raw and os.environ.get("GROQ_API_KEY"):
        raw = _groq_call(full_jpeg, _FULL_CARD_PROMPT, max_tokens=1500)
        if raw:
            logger.debug("Pass1 Groq raw: %.300s", raw)

    if not raw:
        return None

    parsed = _parse_json(raw)
    if not parsed:
        # Log enough to diagnose any future parsing regression
        preview = (raw or "").strip()[:600].replace("\n", " ")
        logger.warning("Pass1: JSON parse failed — raw[0:600]: %s", preview)
        return None

    result = _post_process({k: parsed.get(k) for k in _FIELD_KEYS})
    extracted = sum(1 for v in result.values() if v)
    logger.info("Pass1 extracted %d/6 fields", extracted)
    return result if extracted > 0 else None


def _build_nid_hint_prompt(known_date: str | None) -> str:
    """
    Build a NID extraction prompt enhanced with the known date prefix.
    When the date is known, the first 7 NID digits are mathematically certain
    (century + YY + MM + DD), so Groq only needs to read the last 7 digits.
    """
    if not known_date:
        return _NID_ONLY_PROMPT
    date_la = known_date.translate(_AR2LA)
    m = re.match(r"(\d{4})/(\d{2})/(\d{2})", date_la)
    if not m:
        return _NID_ONLY_PROMPT
    y, mo, dd = m.groups()
    century = "3" if int(y) >= 2000 else "2"
    prefix_la = century + y[2:] + mo + dd        # e.g. "3040527"
    prefix_ar = prefix_la.translate(_LA2AR)       # Arabic-Indic
    return (
        _NID_ONLY_PROMPT
        + f"\n\nIMPORTANT HINT: The date of birth on this card is {known_date}.\n"
        f"Therefore the NID MUST start with {prefix_ar} (these 7 digits are certain).\n"
        f"Focus only on reading the last 7 digits after position 7 in the NID strip.\n"
        f"Output the full 14-digit NID: {prefix_ar} + [7 more digits you read]."
    )


def _nid_matches_date(nid_la: str, date_arabic: str) -> bool:
    """
    Cross-check: the NID encodes YYMMDD starting at position 1.
    If we have a separately-extracted date, verify the NID encodes the same date.
    """
    if not nid_la or len(nid_la) < 7 or not date_arabic:
        return True  # can't check → don't reject
    date_la = date_arabic.translate(_AR2LA)
    m = re.match(r"(\d{4})/(\d{2})/(\d{2})", date_la)
    if not m:
        return True
    y_full, mo, dd = m.groups()
    yy = y_full[2:]  # last 2 digits of year
    expected_prefix = yy + mo + dd   # e.g. "040527" for 2004/05/27
    nid_date_part   = nid_la[1:7]    # digits 1-6 of NID
    return nid_date_part == expected_prefix


def _ask_nid(jpeg_bytes: bytes, prompt: str) -> str | None:
    """Send jpeg_bytes to active LLM provider and return raw NID text."""
    raw = None
    if os.environ.get("GOOGLE_API_KEY"):
        raw = _gemini_call(jpeg_bytes, prompt, max_tokens=80)
    if not raw and os.environ.get("GROQ_API_KEY"):
        raw = _groq_call(jpeg_bytes, prompt, max_tokens=80)
    return raw


def _pass2_nid_only(image_path: str, known_date: str | None = None) -> str | None:
    """
    Pass 2 — crop and zoom the NID strip, ask for just the 14-digit number.

    Tries three preprocessing variants × four crop ratios (Layer 5):
      binary / color / tophat  at  top_frac 0.55, 0.50, 0.60, 0.65

    Each variant gets two prompts: generic then date-hint (if known).
    Checksum-passing candidates are returned immediately (Layer 3).
    Structural-only candidates are queued and returned as last resort.
    """
    hint_prompt = _build_nid_hint_prompt(known_date)
    fallback_candidates: list[str] = []

    def _valid_struct(digits_ar: str | None) -> bool:
        if not digits_ar:
            return False
        la = digits_ar.translate(_AR2LA)
        if not _validate_nid(la):
            return False
        if known_date and not _nid_matches_date(la, known_date):
            logger.info("NID date part %s doesn't match extracted date %s — discarding",
                        la[1:7], known_date)
            return False
        return True

    def _try(label: str, jpeg_fn) -> str | None:
        try:
            jpeg = jpeg_fn()
        except Exception as exc:
            logger.error("Pass2 %s prep error: %s", label, exc)
            return None
        for pname, prompt in [("generic", _NID_ONLY_PROMPT), ("hint", hint_prompt)]:
            if pname == "hint" and hint_prompt == _NID_ONLY_PROMPT:
                break
            raw = _ask_nid(jpeg, prompt)
            if not raw:
                continue
            digits_ar = _parse_nid_digits(raw)
            if _valid_struct(digits_ar):
                la = digits_ar.translate(_AR2LA)
                if _nid_checksum_ok(la):
                    logger.info("Pass2 NID (%s/%s, checksum OK): %s", label, pname, digits_ar)
                    return digits_ar          # best possible — return immediately
                logger.info("Pass2 NID (%s/%s, checksum FAIL — queued): %s", label, pname, digits_ar)
                fallback_candidates.append(digits_ar)
            else:
                logger.info("Pass2 NID (%s/%s) invalid: %r", label, pname, (raw or "").strip()[:50])
        return None

    # Four crop ratios × three preprocessing variants
    for top_frac in [0.55, 0.50, 0.60, 0.65]:
        r = _try(f"binary@{top_frac}", lambda tf=top_frac: _prep_nid_strip(image_path, color=False, top_frac=tf))
        if r: return r
        r = _try(f"color@{top_frac}",  lambda tf=top_frac: _prep_nid_strip(image_path, color=True,  top_frac=tf))
        if r: return r
        r = _try(f"tophat@{top_frac}", lambda tf=top_frac: _prep_nid_strip_tophat(image_path, top_frac=tf))
        if r: return r

    if fallback_candidates:
        logger.warning("Pass2: all checksums failed — returning best structural candidate: %s",
                       fallback_candidates[0])
        return fallback_candidates[0]
    return None


def _pass_address_only(image_path: str) -> str | None:
    """
    Dedicated address extraction pass using a zoomed crop of the middle
    section of the card where the street address is printed.
    """
    try:
        addr_jpeg = _prep_address_zone(image_path)
    except Exception as exc:
        logger.error("Address zone prep error: %s", exc)
        return None

    raw = None
    if os.environ.get("GOOGLE_API_KEY"):
        raw = _gemini_call(addr_jpeg, _ADDRESS_ZONE_PROMPT, max_tokens=100)
    if not raw and os.environ.get("GROQ_API_KEY"):
        raw = _groq_call(addr_jpeg, _ADDRESS_ZONE_PROMPT, max_tokens=100)

    if not raw:
        return None

    cleaned = _coerce_null(raw.strip())
    if cleaned:
        logger.info("Address zone extracted: %s", cleaned)
    else:
        logger.info("Address zone returned null-like: %r", raw.strip()[:30])
    return cleaned


def _pass_date_only(image_path: str) -> str | None:
    """
    Dedicated date-of-birth extraction pass using a zoomed crop of the
    lower-left area of the card, where the date is always printed.
    Returns a normalised YYYY/MM/DD Arabic-Indic string or None.
    """
    try:
        date_jpeg = _prep_date_zone(image_path)
    except Exception as exc:
        logger.error("Date zone prep error: %s", exc)
        return None

    raw = None
    if os.environ.get("GOOGLE_API_KEY"):
        raw = _gemini_call(date_jpeg, _DATE_ONLY_PROMPT, max_tokens=80)
    if not raw and os.environ.get("GROQ_API_KEY"):
        raw = _groq_call(date_jpeg, _DATE_ONLY_PROMPT, max_tokens=80)

    if not raw:
        return None

    # _normalise_date accepts both YYYY/MM/DD and DD/MM/YYYY
    result = _normalise_date(raw.strip())
    if result:
        logger.info("Date zone extracted: %s", result)
    else:
        logger.info("Date zone raw was unparseable: %r", raw.strip()[:30])
    return result


# ══════════════════════════════════════════════════════════════════════════════
# Perspective correction (Layer 1)
# ══════════════════════════════════════════════════════════════════════════════

def _auto_deskew(image_path: str) -> str:
    """
    Detect the ID card's 4 corners and apply perspective correction.
    Returns path to a corrected temp image, or the original path if no
    quadrilateral is found.  Card aspect ratio: 85.6×54 mm → ~1.585:1.
    """
    import tempfile as _tf
    img = cv2.imread(image_path)
    if img is None:
        return image_path

    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.bilateralFilter(gray, 9, 75, 75)
    edges = cv2.Canny(gray, 30, 100)
    edges = cv2.dilate(edges, cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5)), iterations=2)

    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)[:10]

    quad = None
    min_area = w * h * 0.20
    for cnt in contours:
        peri   = cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, 0.02 * peri, True)
        if len(approx) == 4 and cv2.contourArea(approx) > min_area:
            quad = approx.reshape(4, 2).astype(np.float32)
            break

    if quad is None:
        logger.debug("_auto_deskew: no quadrilateral found — using original")
        return image_path

    # Sort corners: TL, TR, BR, BL
    s    = quad.sum(axis=1)
    diff = np.diff(quad, axis=1).flatten()
    tl = quad[np.argmin(s)]
    br = quad[np.argmax(s)]
    tr = quad[np.argmin(diff)]
    bl = quad[np.argmax(diff)]

    card_w, card_h = 800, int(800 / 1.585)
    src = np.array([tl, tr, br, bl], dtype=np.float32)
    dst = np.array([[0, 0], [card_w, 0], [card_w, card_h], [0, card_h]], dtype=np.float32)

    M = cv2.getPerspectiveTransform(src, dst)
    corrected = cv2.warpPerspective(img, M, (card_w, card_h), flags=cv2.INTER_LANCZOS4)

    suffix = os.path.splitext(image_path)[1] or ".jpg"
    tmp = _tf.NamedTemporaryFile(suffix=suffix, delete=False)
    tmp.close()
    cv2.imwrite(tmp.name, corrected)
    logger.info("_auto_deskew: perspective corrected → %s", tmp.name)
    return tmp.name


# ══════════════════════════════════════════════════════════════════════════════
# Derived fields & confidence (Layers 6 + 7)
# ══════════════════════════════════════════════════════════════════════════════

def _derive_from_nid_full(nid_western: str) -> dict:
    """
    Derive gender, governorate name, and age from a validated 14-digit NID.
    Returns empty dict if NID is invalid.
    """
    if not _validate_nid(nid_western):
        return {}

    century  = "19" if nid_western[0] == "2" else "20"
    year     = int(century + nid_western[1:3])
    month    = int(nid_western[3:5])
    day      = int(nid_western[5:7])
    gov_code = nid_western[7:9]
    serial_d = int(nid_western[12])    # digit 13 (0-indexed): odd=male, even=female

    gender      = "ذكر" if serial_d % 2 != 0 else "أنثى"
    governorate = _GOV_NAMES.get(gov_code, "")

    age = None
    try:
        birth = datetime.date(year, month, day)
        today = datetime.date.today()
        age   = (today.year - birth.year
                 - ((today.month, today.day) < (birth.month, birth.day)))
    except ValueError:
        pass

    out: dict = {"gender": gender, "governorate": governorate}
    if age is not None:
        out["age"] = age
    return out


def _confidence(
    result: dict,
    pass1_fields: set[str],
    zone_fields: set[str],
) -> dict[str, str]:
    """
    Assign per-field confidence.
    high   — Pass 1 extracted it AND (if NID) checksum passes
    medium — zone/recovery pass extracted it
    low    — NID has 14 digits but failed checksum
    null   — field not extracted
    """
    conf: dict[str, str] = {}
    for key in _FIELD_KEYS:
        val = result.get(key)
        if not val:
            conf[key] = "null"
        elif key in pass1_fields:
            if key == "الرقم القومي":
                la = val.translate(_AR2LA)
                conf[key] = "high" if _nid_checksum_ok(la) else "medium"
            else:
                conf[key] = "high"
        elif key in zone_fields:
            if key == "الرقم القومي":
                la = val.translate(_AR2LA)
                conf[key] = "medium" if _nid_checksum_ok(la) else "low"
            else:
                conf[key] = "medium"
        else:
            conf[key] = "low"
    return conf


# ══════════════════════════════════════════════════════════════════════════════
# Public API
# ══════════════════════════════════════════════════════════════════════════════

def llm_extract(image_path: str, _meta: dict | None = None) -> dict | None:
    """
    Multi-pass NID extraction pipeline with parallel execution.

    Pass 1 + date-zone + NID-strip run in parallel (Layer 4).
    Perspective correction applied first if a card quad is detected (Layer 1).

    If _meta dict is provided it is populated with:
      method_detail  — which passes fired (e.g. "pass1+nid_strip")
      deskewed       — True if perspective correction was applied
      confidence     — per-field level: high / medium / low / null  (Layer 6)
      derived_fields — gender / governorate / age from NID           (Layer 7)

    Returns dict with _FIELD_KEYS, or None if no LLM key is configured.
    """
    if not has_llm_key():
        return None

    # ── Layer 1: Perspective correction ──────────────────────────────────────
    deskewed    = False
    deskew_path = image_path
    try:
        deskew_path = _auto_deskew(image_path)
        deskewed    = deskew_path != image_path
    except Exception as exc:
        logger.warning("Deskew failed: %s — using original", exc)
        deskew_path = image_path

    method_parts:  list[str]  = []
    pass1_fields:  set[str]   = set()
    zone_fields:   set[str]   = set()

    # Use true parallelism only when Gemini is available (high quota).
    # Groq free tier (30K TPM) can't handle 3 simultaneous vision calls —
    # stagger submissions by 3 s so token windows don't collide.
    _groq_only = bool(os.environ.get("GROQ_API_KEY")) and not os.environ.get("GOOGLE_API_KEY")

    try:
        # ── Layer 4: Parallel Pass 1 + date zone + NID strip ─────────────────
        with ThreadPoolExecutor(max_workers=3) as ex:
            f_full = ex.submit(_pass1_all_fields, deskew_path)
            if _groq_only:
                time.sleep(3)   # stagger to avoid simultaneous TPM hits
            f_date = ex.submit(_pass_date_only,   deskew_path)
            if _groq_only:
                time.sleep(3)
            f_nid  = ex.submit(_pass2_nid_only,   deskew_path, None)

            r_full         = f_full.result()
            date_from_zone = f_date.result()
            nid_from_strip = f_nid.result()

        # ── Pass 1 result ─────────────────────────────────────────────────────
        if r_full is None:
            logger.warning("llm_extract: Pass1 returned nothing — trying enhanced")
            r_full = _pass1_all_fields(deskew_path, enhanced=True)
            if r_full is None:
                return None
            method_parts.append("pass1b")
        else:
            method_parts.append("pass1")

        result       = r_full
        pass1_fields = {k for k, v in result.items() if v}
        extracted_p1 = len(pass1_fields)

        # ── Pass 1b: enhanced retry when yield is low ─────────────────────────
        if extracted_p1 < 3:
            logger.info("Low extraction (%d/6) — retrying with enhanced preprocessing …",
                        extracted_p1)
            result2 = _pass1_all_fields(deskew_path, enhanced=True)
            if result2:
                before = extracted_p1
                for key in _FIELD_KEYS:
                    if not result.get(key) and result2.get(key):
                        result[key] = result2[key]
                        pass1_fields.add(key)
                added = sum(1 for v in result.values() if v) - before
                logger.info("Enhanced retry filled in %d additional fields", added)
                if "pass1b" not in method_parts:
                    method_parts.append("pass1b")

        # ── Merge date from zone pass ─────────────────────────────────────────
        if date_from_zone and not result.get("تاريخ الميلاد"):
            result["تاريخ الميلاد"] = date_from_zone
            zone_fields.add("تاريخ الميلاد")
            method_parts.append("date_zone")

        known_date = result.get("تاريخ الميلاد")

        # ── Cross-validate existing NID against date ──────────────────────────
        nid_ar = result.get("الرقم القومي")
        if nid_ar and known_date:
            nid_la           = nid_ar.translate(_AR2LA)
            date_mismatch    = len(nid_la) == 14 and not _nid_matches_date(nid_la, known_date)
            structurally_bad = not _validate_nid(nid_la)
            if date_mismatch or structurally_bad:
                logger.warning(
                    "NID %s cleared (structurally_bad=%s date_mismatch=%s) — triggering recovery",
                    nid_la, structurally_bad, date_mismatch)
                result["الرقم القومي"] = None
                pass1_fields.discard("الرقم القومي")
                nid_ar = None

        # ── Adopt parallel NID strip result (with date cross-check) ──────────
        if not result.get("الرقم القومي") and nid_from_strip:
            la_strip = nid_from_strip.translate(_AR2LA)
            if not known_date or _nid_matches_date(la_strip, known_date):
                result["الرقم القومي"] = nid_from_strip
                zone_fields.add("الرقم القومي")
                method_parts.append("nid_strip")
                logger.info("Parallel NID strip accepted: %s", nid_from_strip)
            else:
                logger.info("Parallel NID strip fails date check — will re-run with hint")
                nid_from_strip = None

        # ── Pass 2 + 3: NID recovery with date hint ───────────────────────────
        if not result.get("الرقم القومي"):
            logger.info("NID missing — running NID recovery with date hint …")
            nid_ar = _pass2_nid_only(deskew_path, known_date=known_date)

            if not nid_ar:
                logger.info("Pass2 failed — running Pass3 (full-card NID focus) …")
                try:
                    full_jpeg = _prep_full_card(deskew_path)
                    raw3      = _ask_nid(full_jpeg, _NID_FULLCARD_PROMPT)
                    if raw3:
                        digits_ar = _parse_nid_digits(raw3)
                        if digits_ar:
                            la3 = digits_ar.translate(_AR2LA)
                            if known_date and not _nid_matches_date(la3, known_date):
                                logger.info("Pass3 NID fails date check — discarding")
                            else:
                                nid_ar = digits_ar
                                logger.info("Pass3 NID extracted: %s", digits_ar)
                except Exception as exc:
                    logger.warning("Pass3 error: %s", exc)

            if nid_ar:
                result["الرقم القومي"] = nid_ar
                zone_fields.add("الرقم القومي")
                method_parts.append("nid_recovery")
                if not result.get("تاريخ الميلاد"):
                    nid_la = nid_ar.translate(_AR2LA)
                    if _validate_nid(nid_la):
                        century = "19" if nid_la[0] == "2" else "20"
                        y  = century + nid_la[1:3]
                        mo = nid_la[3:5]
                        d  = nid_la[5:7]
                        result["تاريخ الميلاد"] = _normalise_date(f"{y}/{mo}/{d}")
                        zone_fields.add("تاريخ الميلاد")
                        logger.info("Date derived from recovered NID")

        # ── Address recovery ──────────────────────────────────────────────────
        if not result.get("العنوان بالكامل"):
            logger.info("Address missing — running dedicated address-zone extraction …")
            addr = _pass_address_only(deskew_path)
            if addr:
                result["العنوان بالكامل"] = addr
                zone_fields.add("العنوان بالكامل")
                method_parts.append("addr_zone")

        extracted = sum(1 for v in result.values() if v)
        logger.info("llm_extract final: %d/6 fields  method=%s  deskewed=%s",
                    extracted, "+".join(method_parts), deskewed)

        # ── Populate caller-supplied meta dict ────────────────────────────────
        if _meta is not None:
            _meta["method_detail"] = "+".join(method_parts) if method_parts else "pass1"
            _meta["deskewed"]      = deskewed
            _meta["confidence"]    = _confidence(result, pass1_fields, zone_fields)
            nid_val  = result.get("الرقم القومي") or ""
            nid_la_f = nid_val.translate(_AR2LA)
            _meta["derived_fields"] = _derive_from_nid_full(nid_la_f)

        return result

    finally:
        if deskewed and deskew_path != image_path:
            try:
                os.unlink(deskew_path)
            except OSError:
                pass


def has_llm_key() -> bool:
    """True if at least one LLM API key is set in the environment."""
    return bool(os.environ.get("GOOGLE_API_KEY") or os.environ.get("GROQ_API_KEY"))
