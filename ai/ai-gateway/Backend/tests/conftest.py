"""conftest.py — shared pytest fixtures for the AI-gateway test suite."""
import os
import sys

# Ensure Backend/ is on sys.path so all sibling modules resolve
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set required env vars before any module import
os.environ.setdefault("API_KEY",       "test-api-key-for-pytest")
os.environ.setdefault("GROQ_API_KEY",  "gsk_test_key")
os.environ.setdefault("GEMINI_API_KEY","")
os.environ.setdefault("MONGODB_URI",   "")
os.environ.setdefault("REDIS_URL",     "")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:3000")

import pytest
from unittest.mock import MagicMock, patch


@pytest.fixture
def api_key():
    return "test-api-key-for-pytest"


@pytest.fixture
def auth_headers(api_key):
    return {"x-api-key": api_key}


@pytest.fixture
def mock_chat_response():
    return {
        "answer": "يمكنني مساعدتك في إيجاد مسكن مناسب.",
        "sources": ["North_coast.csv"],
        "session_id": "test-session",
        "plan": "B",
    }
