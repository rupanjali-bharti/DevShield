"""
DevShield Auditor Configuration.
Loads settings from environment variables with sensible defaults for development.
"""

import os
from typing import List
from dotenv import load_dotenv

# Load .env file if it exists
load_dotenv()

# ─── FastAPI / CORS ──────────────────────────────────────────────────────────

ALLOWED_ORIGINS: List[str] = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")

# ─── Workspace Paths ─────────────────────────────────────────────────────────

# Where user workspaces are stored (absolute path)
# Example: /home/user/DevShield/workspaces or C:\Users\DevShield\workspaces
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# BASE_DIR = devshield/
WORKSPACES_PATH: str = os.getenv(
    "WORKSPACES_PATH",
    os.path.join(BASE_DIR, "workspaces")
)


# ─── MongoDB Configuration ───────────────────────────────────────────────────

MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME: str = os.getenv("MONGO_DB_NAME", "devshield")

# ─── LLM Provider Selection ──────────────────────────────────────────────────
# Valid values: "groq" (production) or "ollama" (local development)

LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "groq").lower()

# ─── Groq Configuration (Production LLM) ─────────────────────────────────────

GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL: str = os.getenv("GROQ_MODEL", "mixtral-8x7b-32768")
LLM_TIMEOUT_GROQ: int = int(os.getenv("LLM_TIMEOUT_GROQ", "30"))

# ─── Ollama Configuration (Local Development LLM) ────────────────────────────

OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "mistral")
LLM_TIMEOUT_OLLAMA: int = int(os.getenv("LLM_TIMEOUT_OLLAMA", "60"))

# ─── Scanner Timeouts ───────────────────────────────────────────────────────

SEMGREP_TIMEOUT: int = int(os.getenv("SEMGREP_TIMEOUT", "45"))
BANDIT_TIMEOUT: int = int(os.getenv("BANDIT_TIMEOUT", "30"))

# ─── Finding Deduplication ──────────────────────────────────────────────────
# Findings within N lines of each other are considered duplicates

DEDUP_LINE_TOLERANCE: int = int(os.getenv("DEDUP_LINE_TOLERANCE", "3"))

# ─── LLM Few-Shot Learning ──────────────────────────────────────────────────
# Max number of recent accepted patches to inject as few-shot examples

MAX_FEW_SHOT_EXAMPLES: int = int(os.getenv("MAX_FEW_SHOT_EXAMPLES", "5"))

# ─── Code Context for LLM ───────────────────────────────────────────────────
# How many lines of context around a vulnerability to pass to LLM

MAX_CODE_CONTEXT_LINES: int = int(os.getenv("MAX_CODE_CONTEXT_LINES", "20"))

# ─── Validation ──────────────────────────────────────────────────────────────

if LLM_PROVIDER not in ("groq", "ollama"):
    raise ValueError(f"LLM_PROVIDER must be 'groq' or 'ollama', got '{LLM_PROVIDER}'")

if LLM_PROVIDER == "groq" and not GROQ_API_KEY:
    print("[⚠️  WARNING] GROQ_API_KEY is not set. Groq calls will fail.")
    print("  Set it via: export GROQ_API_KEY='your-key-here'")

# ─── Settings Object (for import compatibility) ────────────────────────────────

class _Settings:
    # CORS
    ALLOWED_ORIGINS: List[str] = ALLOWED_ORIGINS

    # Paths
    WORKSPACES_PATH: str = WORKSPACES_PATH

    # MongoDB
    MONGO_URI: str = MONGO_URI
    MONGO_DB_NAME: str = MONGO_DB_NAME

    # LLM
    LLM_PROVIDER: str = LLM_PROVIDER
    GROQ_API_KEY: str = GROQ_API_KEY
    GROQ_MODEL: str = GROQ_MODEL
    LLM_TIMEOUT_GROQ: int = LLM_TIMEOUT_GROQ
    OLLAMA_BASE_URL: str = OLLAMA_BASE_URL
    OLLAMA_MODEL: str = OLLAMA_MODEL
    LLM_TIMEOUT_OLLAMA: int = LLM_TIMEOUT_OLLAMA

    # Scanners
    SEMGREP_TIMEOUT: int = SEMGREP_TIMEOUT
    BANDIT_TIMEOUT: int = BANDIT_TIMEOUT

    # Tuning
    DEDUP_LINE_TOLERANCE: int = DEDUP_LINE_TOLERANCE
    MAX_FEW_SHOT_EXAMPLES: int = MAX_FEW_SHOT_EXAMPLES
    MAX_CODE_CONTEXT_LINES: int = MAX_CODE_CONTEXT_LINES

# Singleton instance — import this everywhere
settings = _Settings()
