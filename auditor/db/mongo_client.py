"""
MongoDB client for DevShield.
Manages patch storage (few-shot data), patch history, and analytics.
"""

from datetime import datetime
from typing import List, Dict
from pymongo import MongoClient, DESCENDING

from config import settings

_client  = MongoClient(settings.MONGO_URI)
_db      = _client[settings.MONGO_DB_NAME]
patches  = _db["patches"]
audits   = _db["audits"]

# ─── Ensure indexes on startup ────────────────────────────────────────────────
patches.create_index([("project_name", 1), ("accepted_at", DESCENDING)])
audits.create_index([("project_name", 1), ("audited_at", DESCENDING)])


async def save_patch(data: dict) -> str:
    data["accepted_at"] = datetime.utcnow()
    result = patches.insert_one(data)
    return str(result.inserted_id)


async def get_patch_history(project_name: str) -> List[Dict]:
    cursor = patches.find(
        {"project_name": project_name}, {"_id": 0}
    ).sort("accepted_at", DESCENDING)
    return list(cursor)


async def get_recent_patches(limit: int = 5) -> List[Dict]:
    """Fetch recent patches for few-shot LLM context."""
    cursor = patches.find(
        {},
        {"original_code": 1, "patched_code": 1, "explanation": 1, "_id": 0}
    ).sort("accepted_at", DESCENDING).limit(limit)
    return list(cursor)


async def get_analytics(project_name: str) -> Dict:
    all_patches = list(patches.find({"project_name": project_name}))

    sev = {"high": 0, "medium": 0, "low": 0, "info": 0}
    for p in all_patches:
        key       = p.get("severity", "info").lower()
        sev[key]  = sev.get(key, 0) + 1

    score = max(0, 100 - (
        sev["high"]   * 15 +
        sev["medium"] * 7  +
        sev["low"]    * 3
    ))

    return {
        "project":            project_name,
        "total_fixes":        len(all_patches),
        "severity_breakdown": sev,
        "security_score":     score,
        "last_updated":       datetime.utcnow().isoformat(),
    }
