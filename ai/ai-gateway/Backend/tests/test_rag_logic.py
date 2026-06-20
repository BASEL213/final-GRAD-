"""test_rag_logic.py — RAG engine logic and session management tests."""
import pytest
from unittest.mock import patch, MagicMock


# ── Helpers: _is_structured ───────────────────────────────────────────────────

def get_is_structured():
    import rag_engine
    return rag_engine._is_structured


def test_price_query_is_structured():
    fn = get_is_structured()
    assert fn("كم سعر الوحدات في العلمين؟") is True


def test_count_query_is_structured():
    fn = get_is_structured()
    assert fn("كم عدد الوحدات في المشروع؟") is True


def test_available_query_is_structured():
    fn = get_is_structured()
    assert fn("كم وحدة متاحة؟") is True


def test_floor_query_is_structured():
    fn = get_is_structured()
    assert fn("ما الدور الثالث؟") is True


def test_area_query_is_structured():
    fn = get_is_structured()
    assert fn("ما المساحة؟") is True


def test_open_ended_not_structured():
    fn = get_is_structured()
    assert fn("ما هو الفرق بين الايجار والتمليك؟") is False


def test_greeting_routes_through_structured():
    fn = get_is_structured()
    # Greetings are routed through the pandas path (layer 0) — returns True
    assert fn("مرحبا") is True


def test_conceptual_question_not_structured():
    fn = get_is_structured()
    assert fn("ما هي الإسكان الاجتماعي؟") is False


def test_installment_query_is_structured():
    fn = get_is_structured()
    assert fn("ما القسط الشهري؟") is True


def test_min_price_query_is_structured():
    fn = get_is_structured()
    assert fn("ما أرخص سعر؟") is True


# ── Session history ────────────────────────────────────────────────────────────

def test_get_history_empty_for_new_session():
    with patch("rag_engine._redis_client", None):
        import rag_engine
        rag_engine.chat_histories.clear()
        hist = rag_engine._get_history("brand-new-session-xyz")
        assert hist == []


def test_set_and_get_history_in_process():
    with patch("rag_engine._redis_client", None):
        import rag_engine
        rag_engine.chat_histories.clear()
        messages = [{"role": "user", "content": "مرحبا"}]
        rag_engine._set_history("sess-test", messages)
        assert rag_engine._get_history("sess-test") == messages


def test_history_overwrites_previous():
    with patch("rag_engine._redis_client", None):
        import rag_engine
        rag_engine._set_history("sess-ow", [{"role": "user", "content": "first"}])
        rag_engine._set_history("sess-ow", [{"role": "user", "content": "second"}])
        hist = rag_engine._get_history("sess-ow")
        assert hist[-1]["content"] == "second"


def test_different_sessions_isolated():
    with patch("rag_engine._redis_client", None):
        import rag_engine
        rag_engine._set_history("sess-a", [{"role": "user", "content": "session A"}])
        rag_engine._set_history("sess-b", [{"role": "user", "content": "session B"}])
        assert rag_engine._get_history("sess-a")[0]["content"] == "session A"
        assert rag_engine._get_history("sess-b")[0]["content"] == "session B"


def test_clear_history_removes_session():
    with patch("rag_engine._redis_client", None):
        import rag_engine
        rag_engine._set_history("sess-clr", [{"role": "user", "content": "hello"}])
        rag_engine.clear_history("sess-clr")
        assert rag_engine._get_history("sess-clr") == []


def test_clear_nonexistent_session_no_error():
    with patch("rag_engine._redis_client", None):
        import rag_engine
        rag_engine.clear_history("nonexistent-session-999")  # should not raise


def test_evict_stale_sessions_no_error():
    with patch("rag_engine._redis_client", None):
        import rag_engine
        rag_engine._evict_stale_sessions()  # should not raise


# ── chat() function ────────────────────────────────────────────────────────────

def test_chat_returns_dict():
    mock_completion = MagicMock()
    mock_completion.choices = [MagicMock(message=MagicMock(content="الإجابة هنا"))]
    with patch("rag_engine.client.chat.completions.create", return_value=mock_completion), \
         patch("rag_engine.query_documents", return_value=[{"text": "context", "source": "test.csv", "distance": 0.1}]), \
         patch("rag_engine._load_all_csvs", return_value=None), \
         patch("rag_engine._redis_client", None):
        import rag_engine
        result = rag_engine.chat("ما هي المشاريع؟", "sess-chat-test")
        assert isinstance(result, dict)


def test_chat_returns_answer_key():
    mock_completion = MagicMock()
    mock_completion.choices = [MagicMock(message=MagicMock(content="الإجابة"))]
    with patch("rag_engine.client.chat.completions.create", return_value=mock_completion), \
         patch("rag_engine.query_documents", return_value=[{"text": "context", "source": "test.csv", "distance": 0.1}]), \
         patch("rag_engine._load_all_csvs", return_value=None), \
         patch("rag_engine._redis_client", None):
        import rag_engine
        result = rag_engine.chat("أريد مساعدة", "sess-chat-key")
        assert "answer" in result


def test_chat_returns_session_id():
    mock_completion = MagicMock()
    mock_completion.choices = [MagicMock(message=MagicMock(content="رد"))]
    with patch("rag_engine.client.chat.completions.create", return_value=mock_completion), \
         patch("rag_engine.query_documents", return_value=[{"text": "ctx", "source": "f.csv", "distance": 0.2}]), \
         patch("rag_engine._load_all_csvs", return_value=None), \
         patch("rag_engine._redis_client", None):
        import rag_engine
        result = rag_engine.chat("سؤال", "my-session-id")
        assert result["session_id"] == "my-session-id"


def test_chat_chroma_error_handled_gracefully():
    mock_completion = MagicMock()
    mock_completion.choices = [MagicMock(message=MagicMock(content="رد آمن"))]
    with patch("rag_engine.client.chat.completions.create", return_value=mock_completion), \
         patch("rag_engine.query_documents", side_effect=Exception("ChromaDB crashed")), \
         patch("rag_engine._load_all_csvs", return_value=None), \
         patch("rag_engine._redis_client", None):
        import rag_engine
        result = rag_engine.chat("سؤال مفاهيمي", "sess-chroma-err")
        assert isinstance(result, dict)
        assert "answer" in result


# ── build_context ─────────────────────────────────────────────────────────────

def test_build_context_empty_docs():
    import rag_engine
    result = rag_engine.build_context([])
    assert "لا توجد" in result


def test_build_context_with_one_doc():
    import rag_engine
    docs = [{"text": "سعر الوحدة 500000 جنيه", "source": "North_coast.csv", "distance": 0.1}]
    result = rag_engine.build_context(docs)
    assert "500000" in result


def test_build_context_with_multiple_docs():
    import rag_engine
    docs = [
        {"text": "مشروع A بسعر 500K", "source": "csv1.csv", "distance": 0.1},
        {"text": "مشروع B بسعر 700K", "source": "csv2.csv", "distance": 0.2},
    ]
    result = rag_engine.build_context(docs)
    assert "مشروع A" in result
    assert "مشروع B" in result


def test_build_context_includes_source():
    import rag_engine
    docs = [{"text": "بيانات", "source": "North_coast.csv", "distance": 0.05}]
    result = rag_engine.build_context(docs)
    assert "North_coast" in result


# ── refresh_data ──────────────────────────────────────────────────────────────

def test_refresh_data_no_error():
    import rag_engine
    rag_engine.refresh_data()  # should not raise
