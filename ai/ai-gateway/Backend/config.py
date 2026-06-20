import os
from dotenv import load_dotenv

_base = os.path.dirname(__file__)
load_dotenv(os.path.join(_base, ".env"))
load_dotenv(os.path.join(_base, "..", ".env"))

# OpenRouter — single key for all LLM calls (openrouter.ai)
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL   = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct:free")

# Legacy keys kept so existing imports don't break
GROQ_API_KEY  = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL    = OPENROUTER_MODEL
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL   = "gemini-2.0-flash"

# Embeddings (lightweight, runs on CPU)
EMBEDDING_MODEL = "sentence-transformers/paraphrase-multilingual-mpnet-base-v2"

# ChromaDB
CHROMA_DB_PATH = os.path.join(_base, "../chroma_db")
CHROMA_COLLECTION_NAME = "real_estate_arabic"

# Data directories
UPLOADS_DIR = os.path.join(_base, "../Data/uploads")
APPLICATIONS_DIR = os.path.join(_base, "../Data/applications")

# RAG
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 100
TOP_K_RESULTS = 5
MAX_CHAT_HISTORY = 10

# MongoDB
MONGODB_URI = os.getenv("MONGODB_URI", "")
MONGODB_DB  = os.getenv("MONGODB_DB",  "")    # empty = auto-detect first non-system DB
# Collections that hold housing/project data for the pandas router.
# Comma-separated. Leave empty to auto-detect (looks for priceRange/price columns).
MONGODB_HOUSING_COLLECTIONS = os.getenv("MONGODB_HOUSING_COLLECTIONS", "")

# Session store
# Set REDIS_URL to enable Redis-backed sessions (required for multi-instance scaling).
# When unset, sessions are stored in-process (single instance only).
# Example: redis://localhost:6379/0
REDIS_URL = os.getenv("REDIS_URL", "")

# Security
API_KEY = os.getenv("API_KEY", "")
if not API_KEY:
    raise RuntimeError("API_KEY environment variable must be set before starting the AI gateway.")

ALLOWED_ORIGINS_RAW = os.getenv("ALLOWED_ORIGINS", "")
ALLOWED_ORIGINS = (
    ALLOWED_ORIGINS_RAW.split(",")
    if ALLOWED_ORIGINS_RAW and ALLOWED_ORIGINS_RAW.strip() != "*"
    else ["http://localhost:5173", "http://localhost:3000", "http://192.168.1.8:5173", "http://192.168.1.8:3000"]
)
