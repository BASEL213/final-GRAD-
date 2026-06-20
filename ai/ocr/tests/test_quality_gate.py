"""test_quality_gate.py — Image quality gate and LLM extractor helper tests."""
import os
import sys
import re
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault("GOOGLE_API_KEY", "")
os.environ.setdefault("GROQ_API_KEY",   "gsk_test_key")


# ── _validate_nid ─────────────────────────────────────────────────────────────

def test_validate_nid_valid_14_digits():
    from llm_extractor import _validate_nid
    assert _validate_nid("29901011234567") is True


def test_validate_nid_starts_with_2():
    from llm_extractor import _validate_nid
    assert _validate_nid("29501011234567") is True


def test_validate_nid_starts_with_3():
    from llm_extractor import _validate_nid
    assert _validate_nid("30001011234567") is True


def test_validate_nid_too_short():
    from llm_extractor import _validate_nid
    assert _validate_nid("2990101123456") is False


def test_validate_nid_too_long():
    from llm_extractor import _validate_nid
    assert _validate_nid("299010112345678") is False


def test_validate_nid_wrong_prefix():
    from llm_extractor import _validate_nid
    assert _validate_nid("19901011234567") is False


def test_validate_nid_wrong_prefix_4():
    from llm_extractor import _validate_nid
    assert _validate_nid("49901011234567") is False


def test_validate_nid_empty_string():
    from llm_extractor import _validate_nid
    assert _validate_nid("") is False


def test_validate_nid_with_letters():
    from llm_extractor import _validate_nid
    assert _validate_nid("2990101ABCDEFG") is False


def test_validate_nid_all_zeros():
    from llm_extractor import _validate_nid
    assert _validate_nid("00000000000000") is False


def test_validate_nid_starts_with_29():
    from llm_extractor import _validate_nid
    assert _validate_nid("29012311234567") is True


def test_validate_nid_starts_with_30():
    from llm_extractor import _validate_nid
    assert _validate_nid("30012311234567") is True


# ── Arabic ↔ Latin digit translation ─────────────────────────────────────────

def test_ar2la_translates_arabic_digits():
    from llm_extractor import _AR2LA
    arabic = "٢٩٩٠١٠١١٢٣٤٥٦٧"
    result = arabic.translate(_AR2LA)
    assert result == "29901011234567"


def test_la2ar_translates_latin_digits():
    from llm_extractor import _LA2AR
    latin = "29901011234567"
    result = latin.translate(_LA2AR)
    assert result == "٢٩٩٠١٠١١٢٣٤٥٦٧"


def test_ar2la_mixed_string():
    from llm_extractor import _AR2LA
    mixed = "رقم: ٢٩٩٠١"
    result = mixed.translate(_AR2LA)
    assert "29901" in result


def test_la2ar_round_trip():
    from llm_extractor import _AR2LA, _LA2AR
    original = "12345678901234"
    arabic = original.translate(_LA2AR)
    back = arabic.translate(_AR2LA)
    assert back == original


# ── has_llm_key ───────────────────────────────────────────────────────────────

def test_has_llm_key_true_with_groq_key():
    import importlib, llm_extractor
    original = os.environ.get("GROQ_API_KEY", "")
    os.environ["GROQ_API_KEY"] = "gsk_some_key"
    os.environ["GOOGLE_API_KEY"] = ""
    result = llm_extractor.has_llm_key()
    os.environ["GROQ_API_KEY"] = original
    assert result is True


def test_has_llm_key_false_with_no_keys():
    import llm_extractor
    orig_groq = os.environ.get("GROQ_API_KEY", "")
    orig_google = os.environ.get("GOOGLE_API_KEY", "")
    os.environ["GROQ_API_KEY"] = ""
    os.environ["GOOGLE_API_KEY"] = ""
    result = llm_extractor.has_llm_key()
    os.environ["GROQ_API_KEY"] = orig_groq
    os.environ["GOOGLE_API_KEY"] = orig_google
    assert result is False


def test_has_llm_key_true_with_google_key():
    import llm_extractor
    orig_groq = os.environ.get("GROQ_API_KEY", "")
    orig_google = os.environ.get("GOOGLE_API_KEY", "")
    os.environ["GROQ_API_KEY"] = ""
    os.environ["GOOGLE_API_KEY"] = "AIzaTestKey"
    result = llm_extractor.has_llm_key()
    os.environ["GROQ_API_KEY"] = orig_groq
    os.environ["GOOGLE_API_KEY"] = orig_google
    assert result is True


# ── Quality check logic ────────────────────────────────────────────────────────

def test_quality_check_import():
    from flask_api import _quality_check
    assert callable(_quality_check)


def test_quality_check_non_image_bytes_returns_none():
    import tempfile, os
    from flask_api import _quality_check
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as f:
        f.write(b"not a real image")
        tmp = f.name
    try:
        result = _quality_check(tmp)
        assert result is None or isinstance(result, str)
    finally:
        os.unlink(tmp)


def test_quality_check_missing_file_returns_error_or_none():
    from flask_api import _quality_check
    result = _quality_check("/nonexistent/path/file.jpg")
    # Returns either None or an error string — never raises an exception
    assert result is None or isinstance(result, str)


# ── Image hash ────────────────────────────────────────────────────────────────

def test_img_hash_consistent():
    import tempfile, os
    from flask_api import _img_hash
    content = b"test image content for hashing"
    with tempfile.NamedTemporaryFile(delete=False) as f:
        f.write(content)
        tmp = f.name
    try:
        h1 = _img_hash(tmp)
        h2 = _img_hash(tmp)
        assert h1 == h2
    finally:
        os.unlink(tmp)


def test_img_hash_different_content_different_hash():
    import tempfile, os
    from flask_api import _img_hash
    with tempfile.NamedTemporaryFile(delete=False) as f1, \
         tempfile.NamedTemporaryFile(delete=False) as f2:
        f1.write(b"content-a")
        f2.write(b"content-b")
        tmp1, tmp2 = f1.name, f2.name
    try:
        assert _img_hash(tmp1) != _img_hash(tmp2)
    finally:
        os.unlink(tmp1)
        os.unlink(tmp2)


def test_img_hash_returns_string():
    import tempfile, os
    from flask_api import _img_hash
    with tempfile.NamedTemporaryFile(delete=False) as f:
        f.write(b"data")
        tmp = f.name
    try:
        result = _img_hash(tmp)
        assert isinstance(result, str)
    finally:
        os.unlink(tmp)


def test_img_hash_length():
    import tempfile, os
    from flask_api import _img_hash
    with tempfile.NamedTemporaryFile(delete=False) as f:
        f.write(b"hash length test")
        tmp = f.name
    try:
        result = _img_hash(tmp)
        assert len(result) == 32  # MD5 hex digest
    finally:
        os.unlink(tmp)


# ── Allowed extension check ───────────────────────────────────────────────────

def test_allowed_ext_jpg():
    from flask_api import _allowed_ext
    assert _allowed_ext("photo.jpg") is True


def test_allowed_ext_jpeg():
    from flask_api import _allowed_ext
    assert _allowed_ext("photo.jpeg") is True


def test_allowed_ext_png():
    from flask_api import _allowed_ext
    assert _allowed_ext("photo.png") is True


def test_allowed_ext_webp():
    from flask_api import _allowed_ext
    assert _allowed_ext("photo.webp") is True


def test_allowed_ext_bmp():
    from flask_api import _allowed_ext
    assert _allowed_ext("photo.bmp") is True


def test_not_allowed_ext_pdf():
    from flask_api import _allowed_ext
    assert _allowed_ext("doc.pdf") is False


def test_not_allowed_ext_txt():
    from flask_api import _allowed_ext
    assert _allowed_ext("doc.txt") is False


def test_not_allowed_ext_gif():
    from flask_api import _allowed_ext
    assert _allowed_ext("anim.gif") is False


def test_not_allowed_ext_mp4():
    from flask_api import _allowed_ext
    assert _allowed_ext("video.mp4") is False


def test_not_allowed_no_extension():
    from flask_api import _allowed_ext
    assert _allowed_ext("noextension") is False


def test_allowed_ext_uppercase():
    from flask_api import _allowed_ext
    assert _allowed_ext("PHOTO.JPG") is True


def test_allowed_ext_mixed_case():
    from flask_api import _allowed_ext
    assert _allowed_ext("Photo.Png") is True
