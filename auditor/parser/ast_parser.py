"""
AST Parser — Tree-sitter based.
Uses tree-sitter-language-pack for grammar loading.

Adding a new language = one line in _CANDIDATES.
All 165+ supported languages: python, javascript, typescript,
rust, go, java, c, cpp, csharp, ruby, php, bash, kotlin,
swift, scala, dart, lua, haskell, and more.
"""

import os
from tree_sitter import Language, Parser
from tree_sitter_language_pack import get_language as pack_get_language

from config import settings


# ─── Language Registry ───────────────────────────────────────────────────────
#
# Format:
#   file_extensions  →  language key used by tree-sitter-language-pack
#
# Full list of valid keys:
#   https://pypi.org/project/tree-sitter-language-pack/
#
_CANDIDATES = [
    # Extensions                                    Pack language key
    ([".py", ".pyw"],                               "python"),
    ([".js", ".jsx", ".mjs", ".cjs"],               "javascript"),
    ([".ts"],                                        "typescript"),
    ([".tsx"],                                       "tsx"),
    ([".java"],                                      "java"),
    ([".go"],                                        "go"),
    ([".rs"],                                        "rust"),
    ([".c", ".h"],                                   "c"),
    ([".cpp", ".cc", ".cxx", ".hpp", ".hxx"],        "cpp"),
    ([".cs"],                                        "csharp"),
    ([".rb"],                                        "ruby"),
    ([".php"],                                       "php"),
    ([".sh", ".bash"],                               "bash"),
    ([".kt", ".kts"],                                "kotlin"),
    ([".swift"],                                     "swift"),
    ([".scala"],                                     "scala"),
    ([".dart"],                                      "dart"),
    ([".lua"],                                       "lua"),
    ([".r", ".R"],                                   "r"),
    ([".sql"],                                       "sql"),
    ([".html", ".htm"],                              "html"),
    ([".css"],                                       "css"),
    ([".json"],                                      "json"),
    ([".yaml", ".yml"],                              "yaml"),
    ([".toml"],                                      "toml"),
    ([".dockerfile", "Dockerfile"],                  "dockerfile"),
]


def _load_languages() -> dict:
    """
    Load all grammars from tree-sitter-language-pack at startup.
    Failures are caught per language — the server never crashes
    because one grammar fails to load.
    """
    registry = {}

    for extensions, lang_key in _CANDIDATES:
        try:
            language = pack_get_language(lang_key)
            for ext in extensions:
                registry[ext] = {
                    "language": language,
                    "label":    lang_key,
                }
            print(f"[AST Parser] ✅  {lang_key}")
        except Exception as e:
            print(f"[AST Parser] ⚠️   {lang_key} failed to load: {e}")

    print(f"[AST Parser] Loaded {len(registry)} extension mappings.")
    return registry


# Built once at module import — zero overhead per request
_LANG_MAP = _load_languages()


# ─── Node type sets (language-agnostic) ──────────────────────────────────────

_FUNCTION_NODES = {
    "function_definition",      # Python
    "function_declaration",     # JS, TS, Go, C, C++
    "method_definition",        # JS class methods
    "method_declaration",       # Java, C#
    "function_item",            # Rust
    "arrow_function",           # JS arrow functions
    "func_literal",             # Go anonymous functions
}

_CLASS_NODES = {
    "class_definition",         # Python
    "class_declaration",        # JS, Java, C#
    "struct_item",              # Rust
    "type_declaration",         # Go
    "interface_declaration",    # Java, TS
    "enum_declaration",         # Java, C#, TS
}

_IMPORT_NODES = {
    "import_statement",         # Python: import os
    "import_from_statement",    # Python: from x import y
    "import_declaration",       # JS/TS:  import x from 'y'
    "use_declaration",          # Rust:   use std::io
    "package_clause",           # Go:     package main
    "using_directive",          # C#:     using System
    "include_statement",        # PHP
    "require_call",             # Node.js require()
}


# ─── Public API ──────────────────────────────────────────────────────────────

def get_supported_extensions() -> list:
    """Called by /health endpoint to report supported file types."""
    return sorted(_LANG_MAP.keys())


def parse_file(file_path: str) -> dict:
    """
    Parse a source file with Tree-sitter.

    Returns:
        {
            language:   str,       e.g. "python", "rust", "unsupported"
            supported:  bool,
            tree:       Tree | None,
            source:     bytes | None,
            summary:    { functions, classes, imports }
        }
    """
    ext   = _get_ext(file_path)
    entry = _LANG_MAP.get(ext)

    # Special case: Dockerfile has no extension
    if entry is None and os.path.basename(file_path) == "Dockerfile":
        entry = _LANG_MAP.get("Dockerfile")

    if entry is None:
        return _unsupported(ext)

    try:
        with open(file_path, "rb") as fh:
            source = fh.read()

        parser = Parser(entry["language"])
        tree   = parser.parse(source)

        return {
            "language":  entry["label"],
            "supported": True,
            "tree":      tree,
            "source":    source,
            "summary":   _extract_summary(tree, source),
        }

    except OSError as e:
        print(f"[AST Parser] File read error — {file_path}: {e}")
        return _unsupported(ext)
    except Exception as e:
        print(f"[AST Parser] Parse error — {file_path}: {e}")
        return _unsupported(ext)


# ─── Summary Extraction ──────────────────────────────────────────────────────

def _extract_summary(tree, source: bytes) -> dict:
    summary = {"functions": [], "classes": [], "imports": []}

    def walk(node):
        if node.type in _FUNCTION_NODES:
            name = node.child_by_field_name("name")
            if name:
                summary["functions"].append({
                    "name":       _text(source, name),
                    "start_line": node.start_point[0] + 1,
                    "end_line":   node.end_point[0] + 1,
                })

        elif node.type in _CLASS_NODES:
            name = node.child_by_field_name("name")
            if name:
                summary["classes"].append(_text(source, name))

        elif node.type in _IMPORT_NODES:
            summary["imports"].append(
                _text(source, node).split("\n")[0].strip()[:120]
            )

        for child in node.children:
            walk(child)

    walk(tree.root_node)
    return summary


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _get_ext(file_path: str) -> str:
    return os.path.splitext(file_path)[1].lower()


def _text(source: bytes, node) -> str:
    return source[node.start_byte:node.end_byte].decode("utf-8", errors="replace")


def _unsupported(ext: str) -> dict:
    """
    Returned for unrecognised file types.
    The audit pipeline still continues — Semgrep runs on all files
    regardless of AST support, so no findings are lost.
    """
    return {
        "language":  ext.lstrip(".") or "unknown",
        "supported": False,
        "tree":      None,
        "source":    None,
        "summary":   {"functions": [], "classes": [], "imports": []},
    }
