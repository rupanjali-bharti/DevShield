"""
Dependency Graph Builder.
Converts AST summary into a React Flow / D3-compatible node-edge graph.
"""

from typing import Optional


def build_dependency_graph(ast_result: dict) -> dict:
    """
    Produce a graph JSON from the AST summary.

    Node types:  file | function | class | module
    Edge types:  import | contains
    """
    if ast_result.get("tree") is None:
        return {"nodes": [], "edges": []}

    summary     = ast_result.get("summary", {})
    nodes       = [{"id": "root", "type": "file", "label": "Current File"}]
    edges       = []
    seen        = {"root"}

    def add_node(nid: str, ntype: str, label: str):
        if nid not in seen:
            nodes.append({"id": nid, "type": ntype, "label": label})
            seen.add(nid)

    # ── Functions ─────────────────────────────────────────────────────────
    for fn in summary.get("functions", []):
        nid = f"fn::{fn['name']}"
        add_node(nid, "function", fn["name"])
        edges.append({
            "source": "root", "target": nid,
            "type": "contains",
            "meta": {"start": fn["start_line"], "end": fn["end_line"]}
        })

    # ── Classes ───────────────────────────────────────────────────────────
    for cls in summary.get("classes", []):
        nid = f"cls::{cls}"
        add_node(nid, "class", cls)
        edges.append({"source": "root", "target": nid, "type": "contains"})

    # ── Imports ───────────────────────────────────────────────────────────
    for imp in summary.get("imports", []):
        module = _extract_module(imp)
        if module:
            add_node(module, "module", module)
            edges.append({
                "source": "root", "target": module,
                "type": "import", "label": imp[:60]
            })

    return {"nodes": nodes, "edges": edges}


def _extract_module(imp_str: str) -> Optional[str]:
    parts = imp_str.strip().split()
    if len(parts) < 2:
        return None
    if parts[0] == "import":
        return parts[1].split(".")[0]
    if parts[0] == "from":
        return parts[1].split(".")[0]
    return None
