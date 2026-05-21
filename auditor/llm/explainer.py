"""
LLM Explainer.
Handles routing between Groq (production) and Ollama (local dev),
injects few-shot examples from MongoDB, and safely parses responses.
"""

import json, httpx
from typing import List, Dict

from config import settings
from llm.prompts import build_audit_prompt
from db.mongo_client import get_recent_patches


async def explain_and_patch(findings: List[Dict], file_path: str) -> List[Dict]:
    """
    Enrich each finding with LLM explanation + patch suggestion.
    Reads source file once and reuses across all findings.
    """
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as fh:
            lines = fh.readlines()
    except OSError:
        lines = []

    few_shot = await get_recent_patches(limit=settings.MAX_FEW_SHOT_EXAMPLES)
    ctx      = settings.MAX_CODE_CONTEXT_LINES

    for finding in findings:
        ln    = max(0, finding.get("line_start", 1) - 1)
        start = max(0, ln - ctx // 2)
        end   = min(len(lines), ln + ctx // 2 + 1)
        snippet = "".join(lines[start:end])

        prompt            = build_audit_prompt(finding, snippet, few_shot)
        finding["llm"]    = await _call_llm(prompt)
        finding["source_context"] = {
            "lines": snippet,
            "start_line": start + 1,
            "end_line": end
        }

    return findings


# ─── LLM Routing ─────────────────────────────────────────────────────────────

async def _call_llm(prompt: str) -> Dict:
    if settings.LLM_PROVIDER == "groq":
        return await _groq(prompt)
    return await _ollama(prompt)


async def _groq(prompt: str) -> Dict:
    async with httpx.AsyncClient(timeout=settings.LLM_TIMEOUT_GROQ) as client:
        r = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}"},
            json={
                "model":       settings.GROQ_MODEL,
                "messages":    [{"role": "user", "content": prompt}],
                "temperature": 0.2,
                "max_tokens":  1024,
            },
        )
        r.raise_for_status()
        return _safe_parse(r.json()["choices"][0]["message"]["content"])


async def _ollama(prompt: str) -> Dict:
    async with httpx.AsyncClient(timeout=settings.LLM_TIMEOUT_OLLAMA) as client:
        r = await client.post(
            f"{settings.OLLAMA_BASE_URL}/api/generate",
            json={
                "model":   settings.OLLAMA_MODEL,
                "prompt":  prompt,
                "stream":  False,
                "options": {"temperature": 0.2},
            },
        )
        r.raise_for_status()
        return _safe_parse(r.json().get("response", ""))


def _safe_parse(raw: str) -> Dict:
    """Parse LLM JSON response with graceful fallback."""
    raw = raw.strip()
    # Strip accidental ```json ... ``` wrappers
    if raw.startswith("```"):
        parts = raw.split("```")
        raw   = parts[1].lstrip("json").strip() if len(parts) > 1 else raw

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {
            "plain_english": raw[:600] or "Analysis unavailable.",
            "why_dangerous": "",
            "patched_code":  "",
            "what_changed":  "",
        }
