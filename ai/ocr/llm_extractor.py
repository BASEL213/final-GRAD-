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
import json
import logging
import os
import re
import time

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


def _prep_nid_strip(image_path: str, color: bool = False) -> bytes:
    """
    Crop the bottom ~45% of the card (where the NID lives), scale 3×,
    apply binarisation to maximise digit contrast → JPEG bytes.

    color=True skips binarization and returns the color strip instead —
    useful for old-style cards where binarization washes out gold-toned digits.
    """
    img = cv2.imread(image_path)
    if img is None:
        raise FileNotFoundError(f"Cannot read image: {image_path}")

    h, w = img.shape[:2]
    strip = img[int(h * 0.55):, :]        # bottom 45% — safer for tilted shots

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


def _prep_nid_strip_tophat(image_path: str) -> bytes:
    """
    Specialized strip preprocessing for OLD-style Egyptian NID cards (gold/amber
    background with pyramid watermark).

    Key insight: gold is HIGH in the red channel, dark ink is LOW in red.
    A morphological black top-hat on the red channel isolates dark digit strokes
    from the uneven gold background far better than standard CLAHE + Otsu.
    """
    img = cv2.imread(image_path)
    if img is None:
        raise FileNotFoundError(f"Cannot read image: {image_path}")

    h, w = img.shape[:2]
    strip = img[int(h * 0.55):, :]

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


def _groq_call(jpeg_bytes: bytes, prompt: str, max_tokens: int = 600) -> str | None:
    """Groq vision call with up to 3 attempts. Returns raw text or None."""
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
    for attempt in range(3):
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
            is_rate = "429" in err or "rate" in err.lower()
            if attempt < 2:
                wait = 5 if is_rate else 3
                logger.warning("Groq attempt %d failed (%s) — retrying in %ds …",
                               attempt + 1, exc, wait)
                time.sleep(wait)
            else:
                logger.warning("Groq call failed after 3 attempts: %s", exc)
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
    Tries three preprocessing variants in order:
      1. Binary (standard adaptive — works on modern blue cards)
      2. Color  (color CLAHE — intermediate)
      3. Top-hat on red channel (best for old gold/amber-background cards)

    Each variant is tried twice:
      - First with the generic NID prompt
      - Then with a date-prefix hint prompt (if date is known) — reduces
        the problem from reading 14 digits to reading only the last 7

    known_date: if provided, discard NIDs whose date portion doesn't match.
    """
    hint_prompt = _build_nid_hint_prompt(known_date)

    def _valid(digits_ar: str | None) -> bool:
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
        # Try generic prompt first, then hint-enhanced prompt
        for pname, prompt in [("generic", _NID_ONLY_PROMPT), ("hint", hint_prompt)]:
            if pname == "hint" and hint_prompt == _NID_ONLY_PROMPT:
                break  # no date → no point retrying same prompt
            raw = _ask_nid(jpeg, prompt)
            if not raw:
                continue
            digits_ar = _parse_nid_digits(raw)
            if _valid(digits_ar):
                logger.info("Pass2 NID extracted (%s/%s): %s", label, pname, digits_ar)
                return digits_ar
            logger.info("Pass2 NID (%s/%s) invalid: %r", label, pname, (raw or "").strip()[:50])
        return None

    r = _try("binary",  lambda: _prep_nid_strip(image_path, color=False))
    if r: return r
    r = _try("color",   lambda: _prep_nid_strip(image_path, color=True))
    if r: return r
    logger.info("Pass2 binary+color failed — retrying with top-hat (gold card) …")
    r = _try("tophat",  lambda: _prep_nid_strip_tophat(image_path))
    return r


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
# Public API
# ══════════════════════════════════════════════════════════════════════════════

def llm_extract(image_path: str) -> dict | None:
    """
    Multi-pass NID extraction pipeline.

    Pass 1   — full card image → all 6 fields at once
    Pass 1b  — enhanced preprocessing retry when fewer than 3 fields found
    Pass 2   — NID strip zoom (binary → color → top-hat) when NID still missing
    Pass 3   — full-card NID-focused prompt when strip zooms all fail
    Pass 4   — dedicated date-zone crop when date still missing
    Cross-val — NID date part verified against independently-extracted date

    Returns dict with _FIELD_KEYS, or None if no LLM key is configured.
    """
    if not has_llm_key():
        return None

    # ── Pass 1: full card → all fields ───────────────────────────────────────
    result = _pass1_all_fields(image_path)
    if result is None:
        logger.warning("llm_extract: Pass1 returned nothing")
        return None

    # ── Pass 1b: enhanced retry when confidence is low ────────────────────────
    extracted_p1 = sum(1 for v in result.values() if v)
    if extracted_p1 < 3:
        logger.info("Low extraction (%d/6) — retrying with enhanced preprocessing …", extracted_p1)
        result2 = _pass1_all_fields(image_path, enhanced=True)
        if result2:
            before = sum(1 for v in result.values() if v)
            for key in _FIELD_KEYS:
                if not result.get(key) and result2.get(key):
                    result[key] = result2[key]
            logger.info("Enhanced retry filled in %d additional fields",
                        sum(1 for v in result.values() if v) - before)

    # ── Pass 4 (early): recover date via dedicated zone crop ─────────────────
    # Run this BEFORE NID recovery so we can cross-validate the NID against the date.
    if not result.get("تاريخ الميلاد"):
        logger.info("Date missing — running dedicated date-zone extraction …")
        date_from_zone = _pass_date_only(image_path)
        if date_from_zone:
            result["تاريخ الميلاد"] = date_from_zone

    known_date = result.get("تاريخ الميلاد")

    # ── Cross-validate existing NID against date ──────────────────────────────
    nid_ar = result.get("الرقم القومي")
    if nid_ar and known_date:
        nid_la = nid_ar.translate(_AR2LA)
        # Clear if: date part of NID doesn't match extracted date,
        # OR NID is fully structurally invalid (month/day out of range).
        # This ensures recovery passes run with the date-prefix hint.
        date_mismatch = len(nid_la) == 14 and not _nid_matches_date(nid_la, known_date)
        structurally_bad = not _validate_nid(nid_la)
        if date_mismatch or structurally_bad:
            logger.warning(
                "NID %s cleared (structurally_bad=%s date_mismatch=%s) — triggering recovery",
                nid_la, structurally_bad, date_mismatch)
            result["الرقم القومي"] = None
            nid_ar = None

    # ── Pass 2 + 3: NID recovery ─────────────────────────────────────────────
    if not result.get("الرقم القومي"):
        logger.info("NID missing — running Pass2 (NID strip zoom: binary/color/tophat) …")
        nid_ar = _pass2_nid_only(image_path, known_date=known_date)

        # Pass 3: full-card NID-focused prompt as last resort
        if not nid_ar:
            logger.info("Pass2 failed — running Pass3 (full-card NID focus) …")
            try:
                full_jpeg = _prep_full_card(image_path)
                raw3 = _ask_nid(full_jpeg, _NID_FULLCARD_PROMPT)
                if raw3:
                    digits_ar = _parse_nid_digits(raw3)
                    # Accept pass 3 result only if it passes cross-validation
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
            # Derive date from NID if date-zone pass also failed
            if not result.get("تاريخ الميلاد"):
                nid_la = nid_ar.translate(_AR2LA)
                if _validate_nid(nid_la):
                    century = "19" if nid_la[0] == "2" else "20"
                    y  = century + nid_la[1:3]
                    mo = nid_la[3:5]
                    d  = nid_la[5:7]
                    result["تاريخ الميلاد"] = _normalise_date(f"{y}/{mo}/{d}")
                    logger.info("Date derived from recovered NID")

    # ── Address recovery: dedicated zone crop if still missing ──────────────────
    if not result.get("العنوان بالكامل"):
        logger.info("Address missing — running dedicated address-zone extraction …")
        addr = _pass_address_only(image_path)
        if addr:
            result["العنوان بالكامل"] = addr

    extracted = sum(1 for v in result.values() if v)
    logger.info("llm_extract final: %d/6 fields", extracted)
    return result


def has_llm_key() -> bool:
    """True if at least one LLM API key is set in the environment."""
    return bool(os.environ.get("GOOGLE_API_KEY") or os.environ.get("GROQ_API_KEY"))
