"""test_config.py — Config module unit tests."""
import os
import pytest


def test_api_key_loaded():
    import config
    assert config.API_KEY != ""


def test_groq_model_default():
    import config
    assert config.GROQ_MODEL == "llama-3.3-70b-versatile"


def test_gemini_model_default():
    import config
    assert config.GEMINI_MODEL == "gemini-2.0-flash"


def test_top_k_results_positive():
    import config
    assert config.TOP_K_RESULTS > 0


def test_max_chat_history_positive():
    import config
    assert config.MAX_CHAT_HISTORY > 0


def test_chunk_size_positive():
    import config
    assert config.CHUNK_SIZE > 0


def test_chunk_overlap_non_negative():
    import config
    assert config.CHUNK_OVERLAP >= 0


def test_chunk_overlap_less_than_chunk_size():
    import config
    assert config.CHUNK_OVERLAP < config.CHUNK_SIZE


def test_chroma_db_path_defined():
    import config
    assert config.CHROMA_DB_PATH is not None
    assert "chroma_db" in config.CHROMA_DB_PATH


def test_chroma_collection_name_defined():
    import config
    assert config.CHROMA_COLLECTION_NAME == "real_estate_arabic"


def test_uploads_dir_defined():
    import config
    assert config.UPLOADS_DIR is not None


def test_applications_dir_defined():
    import config
    assert config.APPLICATIONS_DIR is not None


def test_allowed_origins_is_list():
    import config
    assert isinstance(config.ALLOWED_ORIGINS, list)


def test_allowed_origins_not_empty():
    import config
    assert len(config.ALLOWED_ORIGINS) > 0


def test_embedding_model_defined():
    import config
    assert config.EMBEDDING_MODEL != ""


def test_redis_url_default_empty():
    import config
    assert isinstance(config.REDIS_URL, str)
