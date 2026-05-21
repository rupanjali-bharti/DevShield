"""
Prompt templates for DevShield's LLM calls.
All prompts live here — easy to version and tune.
"""


def build_audit_prompt(finding: dict, code_snippet: str,
                       patch_history: list) -> str:
    """
    Security explanation + patch suggestion prompt.
    Injects accepted patch history as few-shot examples.
    """
    few_shot = _build_few_shot_block(patch_history)

    return f"""You are a senior application security engineer.
Your job is to explain a detected vulnerability clearly and suggest a minimal, correct fix.

## Detected Vulnerability
- Tool      : {finding.get('tool', 'unknown')}
- Rule      : {finding.get('rule_id', '')}
- Severity  : {finding.get('severity', '').upper()}
- Line      : {finding.get('line_start', '?')}
- Message   : {finding.get('message', '')}
- CWE       : {finding.get('cwe', 'N/A')}

## Vulnerable Code
{few_shot}
## Instructions
1. Explain the vulnerability in 2-3 plain sentences a junior developer can understand.
2. State concisely why it is dangerous.
3. Provide ONLY the corrected version of the code snippet above.
4. Briefly explain what you changed.

## Required Output — strict JSON, no markdown wrapper
{{
  "plain_english" : "...",
  "why_dangerous" : "...",
  "patched_code"  : "...",
  "what_changed"  : "..."
}}"""


def _build_few_shot_block(history: list) -> str:
    if not history:
        return ""
    lines = ["\n## Examples of Previously Accepted Fixes\n"]
    for ex in history:
        lines.append(f"**Issue:** {ex.get('explanation','')}")
        lines.append(f"**Before:**\n```\n{ex.get('original_code','')}\n```")
        lines.append(f"**After:**\n```\n{ex.get('patched_code','')}\n```\n")
    return "\n".join(lines)
