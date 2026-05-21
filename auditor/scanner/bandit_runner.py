"""
Bandit Scanner — Python files only.

WHY PYTHON ONLY:
Bandit is an AST-based static analysis tool built exclusively
for Python. It uses Python's stdlib `ast` module to parse source
and runs security-focused visitor plugins against the tree.
It cannot parse any other language by design.

For all non-Python files, Semgrep (semgrep_runner.py) is the
responsible scanner and covers 30+ languages natively.

Bandit adds Python-specific depth:
  - Dangerous function calls (eval, exec, pickle, yaml.load)
  - Hardcoded credentials and secrets
  - Weak cryptography (MD5, SHA1, DES)
  - SQL injection patterns
  - Flask/Django misconfigurations
  - Assert usage in production code
  - Subprocess shell injection
"""

import subprocess
import json
import os
from typing import List, Dict

from config import settings

# ─── Severity / Confidence Normalisation ─────────────────────────────────────

_SEVERITY_MAP = {
    "HIGH":   "high",
    "MEDIUM": "medium",
    "LOW":    "low",
}

_CONFIDENCE_MAP = {
    "HIGH":   "high",
    "MEDIUM": "medium",
    "LOW":    "low",
}

# ─── Public API ──────────────────────────────────────────────────────────────

def run_bandit(file_path: str) -> List[Dict]:
    """
    Run Bandit on a Python source file.

    Returns an empty list (not an error) for:
      - Non-Python files     → Semgrep handles these
      - Files under 2 lines  → Nothing meaningful to scan
      - Bandit not installed → Logged, pipeline continues

    Returns normalised findings on success.
    """
    # ── Guard: Python files only ──────────────────────────────────────────
    if not _is_python_file(file_path):
        return []

    # ── Guard: Skip empty / trivial files ────────────────────────────────
    if not _is_scannable(file_path):
        return []

    try:
        proc = subprocess.run(
            [
                "bandit",
                "--format",    "json",
                "--level",     "low",       # low severity and above
                "--confidence","low",       # low confidence and above
                "--recursive",             # safe on single files too
                file_path,
            ],
            capture_output=True,
            text=True,
            timeout=settings.BANDIT_TIMEOUT,
        )

        # Exit codes:
        #   0 → no issues found
        #   1 → issues found       (both are success states for us)
        #   2 → Bandit usage error (bad flags etc.)
        if proc.returncode == 2:
            print(f"[Bandit] Usage error: {proc.stderr[:200]}")
            return []

        # Bandit sometimes writes partial JSON even on non-zero exit
        if not proc.stdout.strip():
            return []

        data = json.loads(proc.stdout)
        raw  = data.get("results", [])

        print(f"[Bandit] {len(raw)} finding(s) in {file_path}")
        return [_normalise(r) for r in raw]

    except subprocess.TimeoutExpired:
        print(f"[Bandit] Timed out after {settings.BANDIT_TIMEOUT}s: {file_path}")
        return []

    except json.JSONDecodeError as e:
        print(f"[Bandit] JSON parse error: {e}")
        return []

    except FileNotFoundError:
        # Bandit is not installed — degrade gracefully, Semgrep still runs
        print("[Bandit] Not installed. Run: pip install bandit")
        return []

    except Exception as e:
        print(f"[Bandit] Unexpected error on {file_path}: {e}")
        return []


# ─── Normalisation ───────────────────────────────────────────────────────────

def _normalise(r: dict) -> dict:
    """
    Map a raw Bandit result to DevShield's unified finding schema.
    Same schema as Semgrep output so the aggregator needs no special cases.
    """
    cwe_info = r.get("issue_cwe", {})
    cwe_id   = cwe_info.get("id", "")
    cwe_link = cwe_info.get("link", "")

    return {
        # ── Identity ──────────────────────────────────────────────────────
        "id":           f"bandit::{r.get('test_id', '?')}::{r.get('line_number', 0)}",
        "tool":         "bandit",
        "rule_id":      r.get("test_id", ""),
        "rule_name":    r.get("test_name", ""),

        # ── Classification ────────────────────────────────────────────────
        "severity":     _SEVERITY_MAP.get(
                            r.get("issue_severity", "LOW").upper(), "low"
                        ),
        "confidence":   _CONFIDENCE_MAP.get(
                            r.get("issue_confidence", "LOW").upper(), "low"
                        ),

        # ── Location ──────────────────────────────────────────────────────
        "line_start":   r.get("line_number", 0),
        "line_end":     r.get("line_number", 0),   # Bandit reports single lines
        "col_offset":   r.get("col_offset", 0),

        # ── Content ───────────────────────────────────────────────────────
        "message":      r.get("issue_text", ""),
        "code_snippet": r.get("code", "").strip(),

        # ── References ───────────────────────────────────────────────────
        "cwe":          str(cwe_id) if cwe_id else "",
        "cwe_link":     cwe_link,
        "more_info":    r.get("more_info", ""),

        # ── Meta ─────────────────────────────────────────────────────────
        "owasp":        [],   # Bandit does not map to OWASP natively
        "filename":     r.get("filename", ""),
    }


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _is_python_file(path: str) -> bool:
    """
    Accept .py files only.
    .pyw (Python Windows scripts) are also valid Python — include them.
    """
    return path.lower().endswith((".py", ".pyw"))


def _is_scannable(path: str) -> bool:
    """
    Skip files that are too small to contain meaningful vulnerabilities.
    Bandit can error on completely empty files.
    """
    try:
        return os.path.getsize(path) > 10
    except OSError:
        return False
