"""
Finding Aggregator.
Merges scanner outputs, deduplicates by line proximity,
and sorts by severity.
"""

from typing import List, Dict
from config import settings

_SEV_RANK = {"high": 0, "medium": 1, "low": 2, "info": 3}


def aggregate_findings(*scanner_outputs: List[Dict]) -> List[Dict]:
    """
    Accept any number of scanner result lists.
    Returns a single deduplicated, severity-sorted list.
    """
    combined = [finding for output in scanner_outputs for finding in output]
    deduped  = _deduplicate(combined)
    deduped.sort(key=lambda f: _SEV_RANK.get(f.get("severity", "info"), 3))

    for i, f in enumerate(deduped):
        f["index"] = i          # stable frontend reference

    return deduped


def _deduplicate(findings: List[Dict]) -> List[Dict]:
    """
    Collapse findings within DEDUP_LINE_TOLERANCE lines of each other.
    When collapsing, keep the higher-severity entry.
    """
    tol     = settings.DEDUP_LINE_TOLERANCE
    buckets: dict[int, Dict] = {}

    for f in findings:
        line = f.get("line_start", 0)
        matched = next(
            (k for k in buckets if abs(k - line) <= tol), None
        )
        if matched is None:
            buckets[line] = f
        else:
            if _SEV_RANK.get(f.get("severity","info"), 3) \
             < _SEV_RANK.get(buckets[matched].get("severity","info"), 3):
                buckets[matched] = f

    return list(buckets.values())
