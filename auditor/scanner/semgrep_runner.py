"""
Semgrep Scanner.
Shells out to the semgrep CLI and normalises results into
DevShield's unified finding schema.
"""

import subprocess, json
from typing import List, Dict
from config import settings

_SEVERITY_MAP = {"ERROR": "high", "WARNING": "medium", "INFO": "low"}


def run_semgrep(file_path: str) -> List[Dict]:
    """Run semgrep --config auto on a single file. Returns normalised findings."""
    try:
        proc = subprocess.run(
            ["semgrep", "--config", "auto", "--json",
             "--quiet", "--no-git-ignore", file_path],
            capture_output=True, text=True,
            timeout=settings.SEMGREP_TIMEOUT
        )
        # exit 0 = clean, exit 1 = findings found — both are valid
        if proc.returncode not in (0, 1):
            print(f"[Semgrep] Unexpected exit {proc.returncode}: {proc.stderr[:200]}")
            return []

        data = json.loads(proc.stdout)
        return [_normalise(r) for r in data.get("results", [])]

    except subprocess.TimeoutExpired:
        print("[Semgrep] Timed out")
        return []
    except (json.JSONDecodeError, FileNotFoundError) as e:
        print(f"[Semgrep] Error: {e}")
        return []


def _normalise(r: dict) -> dict:
    meta = r.get("extra", {})
    return {
        "id":           f"semgrep::{r.get('check_id','?')}::{r['start']['line']}",
        "tool":         "semgrep",
        "rule_id":      r.get("check_id", ""),
        "severity":     _SEVERITY_MAP.get(meta.get("severity","INFO").upper(), "low"),
        "message":      meta.get("message", ""),
        "line_start":   r["start"]["line"],
        "line_end":     r["end"]["line"],
        "code_snippet": meta.get("lines", ""),
        "cwe":          meta.get("metadata", {}).get("cwe", []),
        "owasp":        meta.get("metadata", {}).get("owasp", []),
        "confidence":   "high",
    }
