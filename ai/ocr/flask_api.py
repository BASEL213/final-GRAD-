"""
Flask REST API — Egyptian NID OCR
==================================
Run:  python flask_api.py

Endpoints
---------
  POST /ocr/extract   multipart/form-data, field "image"
  GET  /health        liveness probe
  GET  /status        shows which extraction method is active
"""

from __future__ import annotations

import hashlib
import logging
import os
import re
import tempfile
import time as _time
import uuid

# ── Paddle inference flags (must be set before any paddle import) ──────────────
os.environ.setdefault("FLAGS_use_mkldnn",     "0")
os.environ.setdefault("FLAGS_enable_pir_api", "0")
os.environ.setdefault("PADDLE_DISABLE_MKLDNN","1")

# ── Load .env before any import that reads env vars ───────────────────────────
try:
    from dotenv import load_dotenv
    import pathlib
    load_dotenv(pathlib.Path(__file__).parent / ".env", override=True)
except ImportError:
    pass

from flask import Flask, request, jsonify

try:
    from flask_cors import CORS as _CORS
    _has_cors = True
except ImportError:
    _has_cors = False

from llm_extractor import llm_extract, has_llm_key, _validate_nid, _AR2LA, _LA2AR

class _RidFilter(logging.Filter):
    """Inject a default request_id into records that don't supply one."""
    def filter(self, record: logging.LogRecord) -> bool:
        if not hasattr(record, "request_id"):
            record.request_id = "-"
        return True

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)s  [%(request_id)s]  %(message)s",
)
for _h in logging.root.handlers:
    _h.addFilter(_RidFilter())

logger = logging.getLogger(__name__)

# ── App setup ─────────────────────────────────────────────────────────────────

app = Flask(__name__)
if _has_cors:
    _CORS(app, resources={r"/*": {"origins": "*"}})

# ── Extraction strategy ───────────────────────────────────────────────────────

_USE_LLM        = has_llm_key()
_MAX_UPLOAD_MB  = 15
_MAX_UPLOAD_B   = _MAX_UPLOAD_MB * 1024 * 1024
_ALLOWED_EXT    = {"jpg", "jpeg", "png", "webp", "bmp"}

# ── Layer 8: Image-hash result cache ─────────────────────────────────────────
_RESULT_CACHE: dict[str, tuple[dict, float]] = {}  # md5 → (payload, timestamp)
_CACHE_TTL    = 300   # seconds (5 minutes)


def _img_hash(path: str) -> str:
    with open(path, "rb") as f:
        return hashlib.md5(f.read()).hexdigest()


# ── Layer 2: Image quality gate ───────────────────────────────────────────────

def _quality_check(path: str) -> str | None:
    """
    Pre-flight sanity check before spending any API quota.
    Returns a user-friendly error string on failure, None on pass.
    """
    try:
        import cv2 as _cv2
        img = _cv2.imread(path)
        if img is None:
            return "Could not decode the image file. Please try a different photo."
        h, w = img.shape[:2]
        if min(h, w) < 300:
            return ("Image resolution is too low. "
                    "Please use a higher-quality camera setting and retake the photo.")
        ratio = w / h
        if ratio < 0.8 or ratio > 2.5:
            return ("Please photograph only the ID card so the full card fills the frame.")
        gray = _cv2.cvtColor(img, _cv2.COLOR_BGR2GRAY)
        if float(gray.mean()) < 40:
            return ("Image is too dark. Use better lighting or flash and retake the photo.")
        blur_score = float(_cv2.Laplacian(gray, _cv2.CV_64F).var())
        if blur_score < 30:
            return ("Image is too blurry. Hold your phone steady and retake the photo.")
        return None
    except Exception as exc:
        logger.warning("Quality check error (skipping gate): %s", exc)
        return None   # never block on quality-check failures

if _USE_LLM:
    logger.info("LLM extraction ENABLED — provider: OpenRouter (%s)",
                os.environ.get("OPENROUTER_VISION_MODEL", "google/gemini-2.0-flash-exp:free"))
else:
    logger.info("No OPENROUTER_API_KEY found — set it in .env to enable LLM OCR.")

# ── Warm-up PaddleOCR (only when it will be the primary path) ─────────────────

if not _USE_LLM:
    try:
        from egyptian_id_ocr import get_ocr_engine
        logger.info("Pre-loading PaddleOCR model …")
        get_ocr_engine()
        logger.info("PaddleOCR model ready.")
    except Exception as _e:
        logger.warning("OCR pre-load failed (will retry on first request): %s", _e)


# ══════════════════════════════════════════════════════════════════════════════
# Helpers
# ══════════════════════════════════════════════════════════════════════════════

def _allowed_ext(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in _ALLOWED_EXT


def _paddle_nid_fillin(tmp_path: str, result: dict, rid: str) -> str:
    """
    Run a targeted PaddleOCR zone scan on just the NID strip when the LLM
    extracted all other fields but missed the 14-digit national ID.

    Returns the method suffix: "+paddle_nid" if NID was found, "" otherwise.
    Modifies *result* in-place.
    """
    log = logging.LoggerAdapter(logger, {"request_id": rid})
    log.info("LLM missed NID — running targeted NID zone OCR …")
    try:
        import cv2
        from egyptian_id_ocr import (
            preprocess_photo, preprocess_enhanced,
            detect_image_type, _zone_ocr, _deduplicate_ocr,
            extract_fields, _nid_length_fix, _derive_from_nid,
        )

        img      = cv2.imread(tmp_path)
        img_type = detect_image_type(img)
        proc     = (preprocess_enhanced(img)
                    if img_type == "enhanced"
                    else preprocess_photo(img))
        ph       = proc.shape[0]

        # Three complementary passes over the NID strip
        tokens  = _zone_ocr(proc, "nid_r", scale=3, binary=False)
        tokens += _zone_ocr(proc, "nid_l", scale=3, binary=False)
        tokens += _zone_ocr(proc, "nid_r", scale=3, saturation_mask=True)
        tokens += _zone_ocr(proc, "nid_l", scale=3, saturation_mask=True)
        tokens  = _deduplicate_ocr(tokens)

        nid_fields = extract_fields(tokens, card_h=ph)
        nid_raw    = nid_fields.get("الرقم القومي") or ""
        nid_digits = re.sub(r"\D", "", nid_raw.translate(_AR2LA))

        # Try length correction (13/15 → 14 digit fixes)
        if not _validate_nid(nid_digits):
            fixed = _nid_length_fix(nid_digits)
            if fixed:
                nid_digits = fixed

        if _validate_nid(nid_digits):
            result["الرقم القومي"] = nid_digits.translate(_LA2AR)
            log.info("NID zone fill-in succeeded: %s", nid_digits)

            # Derive date-of-birth if also missing
            if not result.get("تاريخ الميلاد"):
                derived = _derive_from_nid(nid_digits)
                result["تاريخ الميلاد"] = derived["date"]
                log.info("Date derived from NID: %s", derived["date"])

            return "+paddle_nid"
        else:
            log.info("NID zone OCR also failed — NID remains null")
            return ""

    except Exception as exc:
        log.warning("NID zone fill-in error: %s", exc)
        return ""


# ══════════════════════════════════════════════════════════════════════════════
# Routes
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/health", methods=["GET"])
def health():
    """Liveness probe — always fast."""
    return jsonify({"status": "ok", "service": "nid-ocr"})


@app.route("/status", methods=["GET"])
def status():
    """Shows which extraction path is active and expected latency."""
    return jsonify({
        "llm_enabled":      _USE_LLM,
        "llm_provider":     os.environ.get("OPENROUTER_VISION_MODEL", "google/gemini-2.0-flash-exp:free") if _USE_LLM else None,
        "expected_latency": "3-10 s" if _USE_LLM else "~220 s",
        "max_upload_mb":    _MAX_UPLOAD_MB,
    })


@app.route("/ocr/extract", methods=["POST"])
def extract():
    """
    Main OCR endpoint.

    Accepts: multipart/form-data with field "image"
    Returns: JSON with "success", "data", "extracted_count", "total_fields", "method"
    """
    rid = str(uuid.uuid4())[:8]
    log = logging.LoggerAdapter(logger, {"request_id": rid})

    # ── Input validation ──────────────────────────────────────────────────────
    if "image" not in request.files:
        return jsonify({
            "success": False,
            "error":   'No image provided. Send as multipart/form-data with key "image".',
        }), 400

    file = request.files["image"]

    if not file.filename:
        return jsonify({"success": False, "error": "Empty filename."}), 400

    if not _allowed_ext(file.filename):
        return jsonify({
            "success": False,
            "error":   f"Unsupported format. Allowed: {', '.join(sorted(_ALLOWED_EXT))}",
        }), 400

    suffix   = "." + file.filename.rsplit(".", 1)[-1].lower()
    tmp_path = None

    try:
        # Save to temp file so both PaddleOCR (path-based) and LLM can use it
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            file.save(tmp.name)
            tmp_path = tmp.name

        # ── File-size guard (checked after save for simplicity) ───────────────
        size_b  = os.path.getsize(tmp_path)
        size_kb = size_b // 1024
        if size_b > _MAX_UPLOAD_B:
            return jsonify({
                "success": False,
                "error":   f"File too large ({size_kb} KB). Maximum: {_MAX_UPLOAD_MB} MB.",
            }), 413

        log.info("OCR request — %d KB  ext=%s", size_kb, suffix)

        # ── Layer 2: Quality gate ─────────────────────────────────────────────
        quality_err = _quality_check(tmp_path)
        if quality_err:
            log.info("Quality gate rejected: %s", quality_err)
            return jsonify({
                "success":    False,
                "error":      quality_err,
                "request_id": rid,
            }), 422

        # ── Layer 8: Cache lookup ─────────────────────────────────────────────
        img_md5   = _img_hash(tmp_path)
        cache_hit = False
        cached    = _RESULT_CACHE.get(img_md5)
        if cached:
            payload, ts = cached
            if _time.time() - ts < _CACHE_TTL:
                log.info("Cache hit (md5=%s) — returning cached result", img_md5)
                payload = dict(payload)   # shallow copy
                payload["request_id"] = rid
                payload["cache_hit"]  = True
                return jsonify(payload)
            else:
                del _RESULT_CACHE[img_md5]   # expired

        result      = None
        method_used = "paddle"
        ocr_meta: dict = {}

        # ── 1. LLM path (fast, ~3-15 s) ──────────────────────────────────────
        if _USE_LLM:
            result = llm_extract(tmp_path, _meta=ocr_meta)

            if result and any(v for v in result.values()):
                method_used   = f"openrouter+{ocr_meta.get('method_detail', 'pass1')}"
                log.info("LLM extraction succeeded (%s)", method_used)

                # Paddle NID fill-in if NID still missing after all LLM passes
                nid_ar = result.get("الرقم القومي") or ""
                nid_la = re.sub(r"\D", "", nid_ar.translate(_AR2LA))
                if not _validate_nid(nid_la):
                    method_used += _paddle_nid_fillin(tmp_path, result, rid)
            else:
                log.info("LLM returned no usable data — falling back to PaddleOCR …")
                result = None

        # ── 2. PaddleOCR fallback (offline, ~220 s) ───────────────────────────
        if result is None:
            try:
                from egyptian_id_ocr import extract_id_fields
                result      = extract_id_fields(tmp_path, verbose=False, save_debug=False)
                method_used = "paddle"
            except ModuleNotFoundError:
                return jsonify({
                    "success":    False,
                    "error":      "OCR service is temporarily busy. Please wait a moment "
                                  "and try again with a clear, well-lit photo of the NID card.",
                    "request_id": rid,
                }), 503

        # ── Summarise & build response ────────────────────────────────────────
        extracted = sum(1 for v in result.values() if v)
        log.info("Done — extracted %d/6 fields  method=%s  deskewed=%s",
                 extracted, method_used, ocr_meta.get("deskewed", False))

        payload = {
            "success":         True,
            "data":            result,
            "extracted_count": extracted,
            "total_fields":    6,
            "method":          method_used,
            "deskewed":        ocr_meta.get("deskewed", False),
            "cache_hit":       False,
            "request_id":      rid,
        }
        if ocr_meta.get("confidence"):
            payload["confidence"] = ocr_meta["confidence"]
        if ocr_meta.get("derived_fields"):
            payload["derived_fields"] = ocr_meta["derived_fields"]

        # ── Layer 8: Store in cache ───────────────────────────────────────────
        _RESULT_CACHE[img_md5] = (payload, _time.time())

        return jsonify(payload)

    except Exception as exc:
        log.error("OCR failed: %s", exc, exc_info=True)
        return jsonify({
            "success":    False,
            "error":      f"OCR processing error: {exc}",
            "request_id": rid,
        }), 500

    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except OSError:
                pass


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    logger.info("Starting NID OCR API on 0.0.0.0:%d", port)
    app.run(host="0.0.0.0", port=port, debug=False, threaded=True)
