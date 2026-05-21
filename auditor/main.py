"""
DevShield Auditor — FastAPI Application
Entry point. Registers all routes, middleware, and startup events.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os

from config import settings
from parser.ast_parser import parse_file
from parser.graph_builder import build_dependency_graph
from scanner.semgrep_runner import run_semgrep
from scanner.bandit_runner import run_bandit
from scanner.aggregator import aggregate_findings
from llm.explainer import explain_and_patch
from db.mongo_client import save_patch, get_patch_history, get_analytics
from parser.ast_parser import get_supported_extensions

# ─── App Init ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="DevShield Auditor",
    description="AI-powered security analysis engine",
    version="1.0.0",
    docs_url="/docs",       # Swagger UI — useful during development
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Request / Response Schemas ──────────────────────────────────────────────

class AuditRequest(BaseModel):
    project_name: str
    file_path: str      # relative path inside workspace e.g. "src/app.py"

class PatchAcceptRequest(BaseModel):
    project_name: str
    file_path: str
    vulnerability_id: str
    original_code: str
    patched_code: str
    explanation: str
    severity: str

# ─── Routes ──────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status":               "ok",
        "service":              "devshield-auditor",
        "version":              "1.0.0",
        "supported_languages":  get_supported_extensions(),
        "llm_provider":         settings.LLM_PROVIDER,
    }

@app.post("/audit")
async def audit_file(req: AuditRequest):
    """
    Full audit pipeline for a single file:
      parse → scan → aggregate → LLM enrich → return
    """
    # ── 1. Resolve and validate path ──────────────────────────────────────
    abs_path = os.path.abspath(
        os.path.join(settings.WORKSPACES_PATH, req.project_name, req.file_path)
    )
    workspace_root = os.path.abspath(
        os.path.join(settings.WORKSPACES_PATH, req.project_name)
    )

    # 👉 ADD THESE PRINT STATEMENTS HERE 👈
    print("\n" + "="*50)
    print("🕵️‍♂️ DEBUG: AUDIT REQUEST RECEIVED")
    print(f"Project Name:    {req.project_name}")
    print(f"Requested File:  {req.file_path}")
    print(f"Workspace Root:  {workspace_root}")
    print(f"Absolute Path:   {abs_path}")
    print(f"Is this a File?: {os.path.isfile(abs_path)}")
    print(f"Is this a Dir?:  {os.path.isdir(abs_path)}")
    print("="*50 + "\n")

    # Block path traversal attacks (e.g. ../../etc/passwd)
    if not abs_path.startswith(workspace_root):
        raise HTTPException(status_code=400, detail="Invalid file path.")

    # 🚨 If you pass a folder, this line stops the audit and throws an error!
    if not os.path.isfile(abs_path):
        raise HTTPException(status_code=404, detail=f"File not found: {req.file_path}")

    try:
        # ── 2. AST Parsing ────────────────────────────────────────────────
        ast_result   = parse_file(abs_path)
        dep_graph    = build_dependency_graph(ast_result)

        # ── 3. Static Scanning ───────────────────────────────────────────
        semgrep_hits = run_semgrep(abs_path)
        bandit_hits  = run_bandit(abs_path)

        # ── 4. Merge + Deduplicate ────────────────────────────────────────
        findings     = aggregate_findings(semgrep_hits, bandit_hits)

        # ── 5. LLM Enrichment ────────────────────────────────────────────
        enriched     = await explain_and_patch(findings, abs_path)

        return {
            "status":             "success",
            "file":               req.file_path,
            "vulnerability_count": len(enriched),
            "findings":           enriched,
            "dependency_graph":   dep_graph,
            "ast_summary":        ast_result.get("summary", {}),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audit failed: {str(e)}")

    """
    Full audit pipeline for a single file:
      parse → scan → aggregate → LLM enrich → return
    """
    # ── 1. Resolve and validate path ──────────────────────────────────────
    abs_path = os.path.abspath(
        os.path.join(settings.WORKSPACES_PATH, req.project_name, req.file_path)
    )
    workspace_root = os.path.abspath(
        os.path.join(settings.WORKSPACES_PATH, req.project_name)
    )

    # Block path traversal attacks (e.g. ../../etc/passwd)
    if not abs_path.startswith(workspace_root):
        raise HTTPException(status_code=400, detail="Invalid file path.")

    if not os.path.isfile(abs_path):
        raise HTTPException(status_code=404, detail=f"File not found: {req.file_path}")

    try:
        # ── 2. AST Parsing ────────────────────────────────────────────────
        ast_result   = parse_file(abs_path)
        dep_graph    = build_dependency_graph(ast_result)

        # ── 3. Static Scanning ───────────────────────────────────────────
        semgrep_hits = run_semgrep(abs_path)
        bandit_hits  = run_bandit(abs_path)

        # ── 4. Merge + Deduplicate ────────────────────────────────────────
        findings     = aggregate_findings(semgrep_hits, bandit_hits)

        # ── 5. LLM Enrichment ────────────────────────────────────────────
        enriched     = await explain_and_patch(findings, abs_path)

        return {
            "status":             "success",
            "file":               req.file_path,
            "vulnerability_count": len(enriched),
            "findings":           enriched,
            "dependency_graph":   dep_graph,
            "ast_summary":        ast_result.get("summary", {}),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audit failed: {str(e)}")


@app.post("/patches/accept")
async def accept_patch(req: PatchAcceptRequest):
    """
    User accepted a patch suggestion.
    Store it in MongoDB — becomes few-shot training data.
    """
    patch_id = await save_patch(req.model_dump())
    return {"status": "saved", "patch_id": patch_id}


@app.get("/patches/history/{project_name}")
async def patch_history(project_name: str):
    history = await get_patch_history(project_name)
    return {"project": project_name, "patches": history}


@app.get("/analytics/{project_name}")
async def analytics(project_name: str):
    return await get_analytics(project_name)
