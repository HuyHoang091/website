"""
Configuration and environment variables for the RAG service
"""
import os
from pathlib import Path
from dotenv import load_dotenv
import torch

# load .env (current folder or parent)
_here = Path(__file__).resolve().parent
_env_path = _here / ".env"
if not _env_path.exists():
    _env_path = _here.parent / ".env"
if _env_path.exists():
    load_dotenv(dotenv_path=_env_path)

# API keys
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY") or os.getenv("OPENROUTER_API_KEY")
OPENAI_API_BASE = os.getenv("OPENAI_API_BASE") or (
    "https://openrouter.ai/api/v1" if os.getenv("OPENROUTER_API_KEY") else "https://api.openai.com"
)
if OPENAI_API_KEY:
    os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY
    os.environ["OPENAI_API_BASE"] = OPENAI_API_BASE

# Constants
EMBEDDING_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
RERANKER_MODEL = "itdainb/PhoRanker"
DEFAULT_TOP_K = 20

# Check if BM25 is available
try:
    from rank_bm25 import BM25Okapi
    HAS_BM25 = True
    print("OK: BM25 is available")
except Exception:
    HAS_BM25 = False
    print("Warning: BM25 is NOT available")

# Detect device
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {DEVICE}")