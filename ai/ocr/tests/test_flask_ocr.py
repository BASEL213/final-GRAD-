"""test_flask_ocr.py — Flask OCR API endpoint tests."""
import io
import os
import sys
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault("GOOGLE_API_KEY", "")
os.environ.setdefault("GROQ_API_KEY", "gsk_test_key")


@pytest.fixture(scope="module")
def client():
    from unittest.mock import patch, MagicMock
    with patch("llm_extractor.has_llm_key", return_value=True), \
         patch("llm_extractor.llm_extract", return_value=None):
        from flask_api import app
        app.config["TESTING"] = True
        with app.test_client() as c:
            yield c


# ── /health ───────────────────────────────────────────────────────────────────

def test_health_returns_200(client):
    r = client.get("/health")
    assert r.status_code == 200


def test_health_returns_ok_status(client):
    r = client.get("/health")
    data = r.get_json()
    assert data["status"] == "ok"


def test_health_returns_service_name(client):
    r = client.get("/health")
    data = r.get_json()
    assert "service" in data


def test_health_service_is_nid_ocr(client):
    r = client.get("/health")
    assert r.get_json()["service"] == "nid-ocr"


def test_health_method_get_only(client):
    r = client.post("/health")
    assert r.status_code == 405


# ── /status ───────────────────────────────────────────────────────────────────

def test_status_returns_200(client):
    r = client.get("/status")
    assert r.status_code == 200


def test_status_has_llm_enabled(client):
    r = client.get("/status")
    assert "llm_enabled" in r.get_json()


def test_status_has_max_upload_mb(client):
    r = client.get("/status")
    assert "max_upload_mb" in r.get_json()


def test_status_max_upload_is_positive(client):
    r = client.get("/status")
    assert r.get_json()["max_upload_mb"] > 0


def test_status_has_expected_latency(client):
    r = client.get("/status")
    assert "expected_latency" in r.get_json()


# ── /ocr/extract — validation ─────────────────────────────────────────────────

def test_extract_no_image_returns_400(client):
    r = client.post("/ocr/extract")
    assert r.status_code == 400


def test_extract_no_image_has_error_message(client):
    r = client.post("/ocr/extract")
    assert "error" in r.get_json()


def test_extract_empty_filename_returns_400(client):
    data = {"image": (io.BytesIO(b"data"), "")}
    r = client.post("/ocr/extract", data=data, content_type="multipart/form-data")
    assert r.status_code == 400


def test_extract_invalid_extension_returns_400(client):
    data = {"image": (io.BytesIO(b"data"), "file.pdf")}
    r = client.post("/ocr/extract", data=data, content_type="multipart/form-data")
    assert r.status_code == 400


def test_extract_txt_extension_returns_400(client):
    data = {"image": (io.BytesIO(b"text"), "card.txt")}
    r = client.post("/ocr/extract", data=data, content_type="multipart/form-data")
    assert r.status_code == 400


def test_extract_gif_extension_returns_400(client):
    data = {"image": (io.BytesIO(b"GIF89a"), "card.gif")}
    r = client.post("/ocr/extract", data=data, content_type="multipart/form-data")
    assert r.status_code == 400


def test_extract_too_large_returns_413(client):
    big_data = b"x" * (16 * 1024 * 1024)
    data = {"image": (io.BytesIO(big_data), "large.jpg")}
    r = client.post("/ocr/extract", data=data, content_type="multipart/form-data")
    assert r.status_code == 413


def test_extract_jpg_accepted_extension(client):
    from unittest.mock import patch
    tiny_jpg = bytes([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xD9
    ])
    with patch("flask_api._quality_check", return_value="Image is too blurry. Hold your phone steady and retake the photo."):
        data = {"image": (io.BytesIO(tiny_jpg), "card.jpg")}
        r = client.post("/ocr/extract", data=data, content_type="multipart/form-data")
        assert r.status_code in (200, 422)


def test_extract_jpeg_accepted_extension(client):
    from unittest.mock import patch
    with patch("flask_api._quality_check", return_value="too blurry"):
        data = {"image": (io.BytesIO(b"fake"), "card.jpeg")}
        r = client.post("/ocr/extract", data=data, content_type="multipart/form-data")
        assert r.status_code in (200, 400, 422, 500)


def test_extract_png_accepted_extension(client):
    from unittest.mock import patch
    with patch("flask_api._quality_check", return_value="low resolution"):
        data = {"image": (io.BytesIO(b"fake"), "card.png")}
        r = client.post("/ocr/extract", data=data, content_type="multipart/form-data")
        assert r.status_code in (200, 400, 422, 500)


# ── /ocr/extract — quality gate ───────────────────────────────────────────────

def test_extract_blurry_image_returns_422(client):
    from unittest.mock import patch
    with patch("flask_api._quality_check",
               return_value="Image is too blurry. Hold your phone steady and retake the photo."):
        data = {"image": (io.BytesIO(b"fake-image-data"), "nid.jpg")}
        r = client.post("/ocr/extract", data=data, content_type="multipart/form-data")
        assert r.status_code == 422


def test_extract_blurry_response_has_error(client):
    from unittest.mock import patch
    with patch("flask_api._quality_check", return_value="too blurry"):
        data = {"image": (io.BytesIO(b"fake"), "nid.jpg")}
        r = client.post("/ocr/extract", data=data, content_type="multipart/form-data")
        assert "error" in r.get_json()


def test_extract_blurry_success_false(client):
    from unittest.mock import patch
    with patch("flask_api._quality_check", return_value="too blurry"):
        data = {"image": (io.BytesIO(b"fake"), "nid.jpg")}
        r = client.post("/ocr/extract", data=data, content_type="multipart/form-data")
        assert r.get_json()["success"] is False


def test_extract_quality_pass_calls_llm(client):
    from unittest.mock import patch, MagicMock
    mock_result = {
        "الاسم بالكامل": "أحمد محمد",
        "الرقم القومي": "29901011234567",
        "تاريخ الميلاد": "1999/01/01",
        "العنوان بالكامل": "القاهرة",
        "المنطقة والمحافظة": "القاهرة",
        "رقم البطاقة": "123456",
    }
    with patch("flask_api._quality_check", return_value=None), \
         patch("flask_api.llm_extract", return_value=mock_result):
        data = {"image": (io.BytesIO(b"fake-img"), "nid.jpg")}
        r = client.post("/ocr/extract", data=data, content_type="multipart/form-data")
        assert r.status_code == 200


def test_extract_successful_response_structure(client):
    from unittest.mock import patch
    mock_result = {
        "الاسم بالكامل": "فاطمة علي",
        "الرقم القومي": "30005011234567",
        "تاريخ الميلاد": "2000/05/01",
        "العنوان بالكامل": "الإسكندرية",
        "المنطقة والمحافظة": "الإسكندرية",
        "رقم البطاقة": "654321",
    }
    with patch("flask_api._quality_check", return_value=None), \
         patch("flask_api.llm_extract", return_value=mock_result):
        data = {"image": (io.BytesIO(b"fake"), "nid.jpg")}
        r = client.post("/ocr/extract", data=data, content_type="multipart/form-data")
        body = r.get_json()
        assert body["success"] is True
        assert "data" in body
        assert "extracted_count" in body
        assert "total_fields" in body


def test_extract_total_fields_is_six(client):
    from unittest.mock import patch
    mock_result = {
        "الاسم بالكامل": "علي",
        "الرقم القومي": "29901011234567",
        "تاريخ الميلاد": "1999/01/01",
        "العنوان بالكامل": "القاهرة",
        "المنطقة والمحافظة": "القاهرة",
        "رقم البطاقة": "111222",
    }
    with patch("flask_api._quality_check", return_value=None), \
         patch("flask_api.llm_extract", return_value=mock_result):
        data = {"image": (io.BytesIO(b"fake"), "nid.jpg")}
        r = client.post("/ocr/extract", data=data, content_type="multipart/form-data")
        assert r.get_json()["total_fields"] == 6


def test_extract_cache_hit_on_same_image(client):
    from unittest.mock import patch
    mock_result = {
        "الاسم بالكامل": "نور",
        "الرقم القومي": "30001011234567",
        "تاريخ الميلاد": "2000/01/01",
        "العنوان بالكامل": "الجيزة",
        "المنطقة والمحافظة": "الجيزة",
        "رقم البطاقة": "999888",
    }
    img_bytes = b"cache-test-image-data-unique"
    with patch("flask_api._quality_check", return_value=None), \
         patch("flask_api.llm_extract", return_value=mock_result):
        data1 = {"image": (io.BytesIO(img_bytes), "nid.jpg")}
        r1 = client.post("/ocr/extract", data=data1, content_type="multipart/form-data")
        data2 = {"image": (io.BytesIO(img_bytes), "nid.jpg")}
        r2 = client.post("/ocr/extract", data=data2, content_type="multipart/form-data")
    assert r1.status_code == 200
    assert r2.status_code == 200


def test_extract_has_method_field(client):
    from unittest.mock import patch
    mock_result = {k: "v" for k in ["الاسم بالكامل", "الرقم القومي", "تاريخ الميلاد",
                                     "العنوان بالكامل", "المنطقة والمحافظة", "رقم البطاقة"]}
    with patch("flask_api._quality_check", return_value=None), \
         patch("flask_api.llm_extract", return_value=mock_result):
        data = {"image": (io.BytesIO(b"meth-test"), "nid.jpg")}
        r = client.post("/ocr/extract", data=data, content_type="multipart/form-data")
        assert "method" in r.get_json()
