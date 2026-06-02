"""
AST Parser — Tree-sitter based with Graph Analysis.
Uses tree-sitter-language-pack for grammar loading.

Adding a new language = one line in _CANDIDATES.
All 165+ supported languages: python, javascript, typescript,
rust, go, java, c, cpp, csharp, ruby, php, bash, kotlin,
swift, scala, dart, lua, haskell, and more.
"""

import os
import logging
from tree_sitter import Language, Parser
from tree_sitter_language_pack import get_language as pack_get_language

logger = logging.getLogger(__name__)

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
            logger.info(f"[AST Parser] ✅  {lang_key}")
        except Exception as e:
            logger.warning(f"[AST Parser] ⚠️   {lang_key} failed to load: {e}")

    logger.info(f"[AST Parser] Loaded {len(registry)} extension mappings.")
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


# ─── Code Property Graph Components ──────────────────────────────────────────

from typing import Dict, List, Any, Optional, Set, Tuple
from dataclasses import dataclass, asdict
import networkx as nx

@dataclass
class CodeNode:
    """Represents a node in the code graph."""
    id: str
    type: str  # 'function', 'variable', 'call', 'condition', etc.
    name: str
    line: int
    column: int
    code: str
    properties: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.properties is None:
            self.properties = {}

@dataclass
class CodeEdge:
    """Represents an edge in the code graph."""
    source: str
    target: str
    type: str  # 'calls', 'uses', 'defines', 'controls', 'data_flow'
    properties: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.properties is None:
            self.properties = {}

class CodePropertyGraph:
    """Code Property Graph (CPG) implementation."""
    
    def __init__(self):
        self.graph = nx.MultiDiGraph()
        self.nodes: Dict[str, CodeNode] = {}
        self.edges: List[CodeEdge] = []
        self.node_counter = 0
    
    def add_node(self, node: CodeNode) -> str:
        """Add a node to the graph."""
        self.nodes[node.id] = node
        self.graph.add_node(node.id, **asdict(node))
        return node.id
    
    def add_edge(self, edge: CodeEdge):
        """Add an edge to the graph."""
        self.edges.append(edge)
        self.graph.add_edge(
            edge.source, 
            edge.target, 
            type=edge.type, 
            **edge.properties
        )
    
    def get_node_id(self) -> str:
        """Generate a unique node ID."""
        self.node_counter += 1
        return f"node_{self.node_counter}"
    
    def find_security_patterns(self) -> List[Dict[str, Any]]:
        """Find security vulnerabilities in the code graph."""
        findings = []
        
        try:
            # 1. Find dangerous function calls
            findings.extend(self._find_dangerous_calls())
            
            # 2. Find data flow vulnerabilities
            findings.extend(self._find_data_flow_issues())
            
            # 3. Find control flow issues
            findings.extend(self._find_control_flow_issues())
            
            # 4. Find authentication/authorization issues
            findings.extend(self._find_auth_issues())
            
        except Exception as e:
            logger.error(f"Graph security analysis failed: {e}")
        
        return findings
    
    def _find_dangerous_calls(self) -> List[Dict[str, Any]]:
        """Find calls to dangerous functions."""
        findings = []
        dangerous_functions = {
            'eval': {'severity': 'high', 'message': 'Use of eval() can lead to code injection'},
            'exec': {'severity': 'high', 'message': 'Use of exec() can lead to code injection'},
            'pickle.loads': {'severity': 'high', 'message': 'Pickle deserialization can lead to RCE'},
            'subprocess.call': {'severity': 'medium', 'message': 'Subprocess call may be unsafe'},
            'os.system': {'severity': 'high', 'message': 'os.system() can lead to command injection'},
            'compile': {'severity': 'medium', 'message': 'Dynamic compilation can be dangerous'},
            'getattr': {'severity': 'medium', 'message': 'Dynamic attribute access can be exploited'},
            'setattr': {'severity': 'medium', 'message': 'Dynamic attribute setting can be dangerous'},
            'document.write': {'severity': 'medium', 'message': 'document.write() can lead to XSS'},
            'innerhtml': {'severity': 'medium', 'message': 'innerHTML assignment can lead to XSS'},
            'dangerouslysetinnerhtml': {'severity': 'high', 'message': 'dangerouslySetInnerHTML can lead to XSS'}
        }
        
        for node_id, node in self.nodes.items():
            if node.type == 'call':
                call_name = node.name.lower()
                for dangerous_func, info in dangerous_functions.items():
                    if dangerous_func in call_name:
                        findings.append({
                            'rule_id': f'dangerous-call-{dangerous_func.replace(".", "-")}',
                            'type': 'graph-analysis',
                            'severity': info['severity'],
                            'message': info['message'],
                            'line': node.line,
                            'column': node.column,
                            'code_snippet': node.code,
                            'graph_context': self._get_node_context(node_id)
                        })
        
        return findings
    
    def _find_data_flow_issues(self) -> List[Dict[str, Any]]:
        """Find data flow vulnerabilities."""
        findings = []
        
        try:
            # Find paths from user input to sensitive operations
            user_input_nodes = self._find_user_input_nodes()
            sensitive_sink_nodes = self._find_sensitive_sink_nodes()
            
            for input_node in user_input_nodes:
                for sink_node in sensitive_sink_nodes:
                    if nx.has_path(self.graph, input_node.id, sink_node.id):
                        path = nx.shortest_path(self.graph, input_node.id, sink_node.id)
                        
                        # Check if there's proper validation in the path
                        has_validation = self._check_validation_in_path(path)
                        
                        if not has_validation:
                            findings.append({
                                'rule_id': 'unvalidated-input-flow',
                                'type': 'graph-analysis',
                                'severity': 'high',
                                'message': f'Unvalidated input from {input_node.name} flows to {sink_node.name}',
                                'line': sink_node.line,
                                'column': sink_node.column,
                                'code_snippet': sink_node.code,
                                'data_flow_path': [self.nodes[node_id].name for node_id in path if node_id in self.nodes]
                            })
        except Exception as e:
            logger.debug(f"Data flow analysis error: {e}")
        
        return findings
    
    def _find_control_flow_issues(self) -> List[Dict[str, Any]]:
        """Find control flow vulnerabilities."""
        findings = []
        
        try:
            # Find missing authentication checks
            protected_functions = self._find_protected_functions()
            
            for func_node in protected_functions:
                # Check if there's an authentication check before the function
                if not self._has_auth_check_before(func_node.id):
                    findings.append({
                        'rule_id': 'missing-auth-check',
                        'type': 'graph-analysis',
                        'severity': 'high',
                        'message': f'Function {func_node.name} may lack proper authentication',
                        'line': func_node.line,
                        'column': func_node.column,
                        'code_snippet': func_node.code
                    })
        except Exception as e:
            logger.debug(f"Control flow analysis error: {e}")
        
        return findings
    
    def _find_auth_issues(self) -> List[Dict[str, Any]]:
        """Find authentication and authorization issues."""
        findings = []
        
        try:
            # Find JWT usage without proper validation
            jwt_nodes = [node for node in self.nodes.values() 
                        if 'jwt' in node.name.lower() or 'token' in node.name.lower()]
            
            for jwt_node in jwt_nodes:
                # Check if JWT is properly validated
                if not self._has_jwt_validation(jwt_node.id):
                    findings.append({
                        'rule_id': 'unvalidated-jwt',
                        'type': 'graph-analysis', 
                        'severity': 'high',
                        'message': f'JWT token {jwt_node.name} may not be properly validated',
                        'line': jwt_node.line,
                        'column': jwt_node.column,
                        'code_snippet': jwt_node.code
                    })
        except Exception as e:
            logger.debug(f"Auth analysis error: {e}")
        
        return findings
    
    def _find_user_input_nodes(self) -> List[CodeNode]:
        """Find nodes that represent user input."""
        input_patterns = [
            'request.', 'req.', 'input', 'params', 'query', 'body',
            'form', 'post', 'get', 'argv', 'stdin', 'raw_input', 'input('
        ]
        
        input_nodes = []
        for node in self.nodes.values():
            if node.type in ['variable', 'parameter', 'call']:
                if any(pattern in node.name.lower() for pattern in input_patterns):
                    input_nodes.append(node)
        
        return input_nodes
    
    def _find_sensitive_sink_nodes(self) -> List[CodeNode]:
        """Find nodes that represent sensitive operations."""
        sink_patterns = [
            'execute', 'query', 'eval', 'system', 'write', 'render',
            'response', 'redirect', 'send', 'exec', 'subprocess', 'sql'
        ]
        
        sink_nodes = []
        for node in self.nodes.values():
            if node.type == 'call':
                if any(pattern in node.name.lower() for pattern in sink_patterns):
                    sink_nodes.append(node)
        
        return sink_nodes
    
    def _check_validation_in_path(self, path: List[str]) -> bool:
        """Check if there's input validation in the given path."""
        validation_patterns = [
            'validate', 'sanitize', 'escape', 'clean', 'filter',
            'check', 'verify', 'parse', 'trim', 'strip', 'encode'
        ]
        
        for node_id in path:
            node = self.nodes.get(node_id)
            if node and any(pattern in node.name.lower() for pattern in validation_patterns):
                return True
        
        return False
    
    def _find_protected_functions(self) -> List[CodeNode]:
        """Find functions that should be protected (admin, delete, etc.)."""
        protected_patterns = [
            'admin', 'delete', 'remove', 'destroy', 'drop',
            'create', 'update', 'modify', 'edit', 'change', 'set'
        ]
        
        protected_funcs = []
        for node in self.nodes.values():
            if node.type == 'function':
                if any(pattern in node.name.lower() for pattern in protected_patterns):
                    protected_funcs.append(node)
        
        return protected_funcs
    
    def _has_auth_check_before(self, func_node_id: str) -> bool:
        """Check if there's an authentication check before this function."""
        auth_patterns = [
            'authenticate', 'auth', 'login', 'session', 'token',
            'permission', 'authorize', 'access', 'verify', 'check'
        ]
        
        # Get predecessors (nodes that come before this function)
        try:
            predecessors = list(self.graph.predecessors(func_node_id))
            
            for pred_id in predecessors:
                pred_node = self.nodes.get(pred_id)
                if pred_node:
                    if any(pattern in pred_node.name.lower() for pattern in auth_patterns):
                        return True
        except Exception as e:
            logger.debug(f"Auth check analysis error: {e}")
        
        return False
    
    def _has_jwt_validation(self, jwt_node_id: str) -> bool:
        """Check if JWT token is properly validated."""
        validation_patterns = [
            'verify', 'validate', 'decode', 'check', 'authenticate'
        ]
        
        try:
            # Check successors and predecessors
            neighbors = list(self.graph.successors(jwt_node_id)) + list(self.graph.predecessors(jwt_node_id))
            
            for neighbor_id in neighbors:
                neighbor_node = self.nodes.get(neighbor_id)
                if neighbor_node:
                    if any(pattern in neighbor_node.name.lower() for pattern in validation_patterns):
                        return True
        except Exception as e:
            logger.debug(f"JWT validation check error: {e}")
        
        return False
    
    def _get_node_context(self, node_id: str) -> Dict[str, Any]:
        """Get context information for a node."""
        node = self.nodes.get(node_id)
        if not node:
            return {}
        
        try:
            predecessors = [self.nodes[pred].name for pred in self.graph.predecessors(node_id) if pred in self.nodes]
            successors = [self.nodes[succ].name for succ in self.graph.successors(node_id) if succ in self.nodes]
            
            return {
                'predecessors': predecessors[:5],  # Limit to prevent huge contexts
                'successors': successors[:5],
                'node_type': node.type,
                'neighborhood_size': len(predecessors) + len(successors)
            }
        except Exception as e:
            logger.debug(f"Context extraction error: {e}")
            return {'error': str(e)}


class GraphBasedASTParser:
    """Enhanced AST parser that builds code property graphs."""
    
    def __init__(self):
        self.enable_graph_analysis = True
    
    def parse_and_build_graph(self, filename: str, code_content: bytes) -> Dict[str, Any]:
        """Parse code and build a code property graph."""
        try:
            # Get basic AST parsing results
            ast_result = parse_file_from_content(filename, code_content)
            
            if not ast_result['supported'] or not self.enable_graph_analysis:
                return ast_result
            
            # Build code property graph
            cpg = CodePropertyGraph()
            
            # Extract language-specific features
            language = ast_result['language']
            tree = ast_result['tree']
            source_lines = code_content.decode('utf-8', errors='ignore').split('\n')
            
            # Build graph based on language
            if language == 'python':
                self._build_python_graph(cpg, tree, source_lines)
            elif language in ['javascript', 'typescript']:
                self._build_js_graph(cpg, tree, source_lines)
            else:
                self._build_generic_graph(cpg, tree, source_lines)
            
            # Analyze graph for security issues
            graph_findings = cpg.find_security_patterns()
            
            # Combine with original AST results
            result = ast_result.copy()
            result['cpg'] = {
                'nodes': len(cpg.nodes),
                'edges': len(cpg.edges),
                'graph_findings': graph_findings
            }
            
            logger.debug(f"Graph analysis: {len(cpg.nodes)} nodes, {len(cpg.edges)} edges, {len(graph_findings)} findings")
            return result
            
        except Exception as e:
            logger.error(f"Graph building failed: {e}")
            return ast_result
    
    def _build_python_graph(self, cpg: CodePropertyGraph, tree, source_lines: List[str]):
        """Build graph for Python code."""
        try:
            root_node = tree.root_node
            self._traverse_python_node(cpg, root_node, source_lines)
        except Exception as e:
            logger.error(f"Python graph building failed: {e}")
    
    def _traverse_python_node(self, cpg: CodePropertyGraph, node, source_lines: List[str], parent_id: str = None):
        """Recursively traverse Python AST nodes."""
        try:
            node_type = node.type
            line_num = node.start_point[0] + 1
            col_num = node.start_point[1]
            
            # Get source code for this node
            if line_num <= len(source_lines):
                code_line = source_lines[line_num - 1] if line_num > 0 else ""
            else:
                code_line = ""
            
            # Create graph node based on AST node type
            graph_node = None
            
            if node_type == 'function_definition':
                func_name = self._get_function_name(node)
                graph_node = CodeNode(
                    id=cpg.get_node_id(),
                    type='function',
                    name=func_name,
                    line=line_num,
                    column=col_num,
                    code=code_line.strip(),
                    properties={'node_type': node_type}
                )
            
            elif node_type == 'call':
                call_name = self._get_call_name(node)
                graph_node = CodeNode(
                    id=cpg.get_node_id(),
                    type='call',
                    name=call_name,
                    line=line_num,
                    column=col_num,
                    code=code_line.strip(),
                    properties={'node_type': node_type}
                )
            
            elif node_type == 'assignment':
                var_name = self._get_assignment_target(node)
                graph_node = CodeNode(
                    id=cpg.get_node_id(),
                    type='variable',
                    name=var_name,
                    line=line_num,
                    column=col_num,
                    code=code_line.strip(),
                    properties={'node_type': node_type}
                )
            
            elif node_type in ['if_statement', 'while_statement', 'for_statement']:
                graph_node = CodeNode(
                    id=cpg.get_node_id(),
                    type='control',
                    name=node_type,
                    line=line_num,
                    column=col_num,
                    code=code_line.strip(),
                    properties={'node_type': node_type}
                )
            
            # Add node to graph
            if graph_node:
                cpg.add_node(graph_node)
                
                # Add edge to parent if exists
                if parent_id:
                    edge = CodeEdge(
                        source=parent_id,
                        target=graph_node.id,
                        type='contains'
                    )
                    cpg.add_edge(edge)
                
                current_parent = graph_node.id
            else:
                current_parent = parent_id
            
            # Recursively process children
            for child in node.children:
                self._traverse_python_node(cpg, child, source_lines, current_parent)
                
        except Exception as e:
            logger.debug(f"Node traversal error: {e}")
    
    def _get_function_name(self, node) -> str:
        """Extract function name from function definition node."""
        try:
            for child in node.children:
                if child.type == 'identifier':
                    return child.text.decode('utf-8', errors='ignore')
            return 'unknown_function'
        except:
            return 'unknown_function'
    
    def _get_call_name(self, node) -> str:
        """Extract function call name."""
        try:
            # Look for the function being called
            for child in node.children:
                if child.type == 'attribute':
                    return child.text.decode('utf-8', errors='ignore')
                elif child.type == 'identifier':
                    return child.text.decode('utf-8', errors='ignore')
            return 'unknown_call'
        except:
            return 'unknown_call'
    
    def _get_assignment_target(self, node) -> str:
        """Extract assignment target variable name."""
        try:
            for child in node.children:
                if child.type == 'identifier':
                    return child.text.decode('utf-8', errors='ignore')
            return 'unknown_variable'
        except:
            return 'unknown_variable'
    
    def _build_js_graph(self, cpg: CodePropertyGraph, tree, source_lines: List[str]):
        """Build graph for JavaScript/TypeScript code."""
        try:
            root_node = tree.root_node
            self._traverse_js_node(cpg, root_node, source_lines)
        except Exception as e:
            logger.error(f"JavaScript graph building failed: {e}")
    
    def _traverse_js_node(self, cpg: CodePropertyGraph, node, source_lines: List[str], parent_id: str = None):
        """Traverse JavaScript AST nodes."""
        # Similar implementation to Python with JS-specific node types
        try:
            node_type = node.type
            line_num = node.start_point[0] + 1
            col_num = node.start_point[1]
            
            if line_num <= len(source_lines):
                code_line = source_lines[line_num - 1] if line_num > 0 else ""
            else:
                code_line = ""
            
            graph_node = None
            
            if node_type in ['function_declaration', 'arrow_function', 'method_definition']:
                func_name = self._get_js_function_name(node)
                graph_node = CodeNode(
                    id=cpg.get_node_id(),
                    type='function',
                    name=func_name,
                    line=line_num,
                    column=col_num,
                    code=code_line.strip(),
                    properties={'node_type': node_type}
                )
            
            elif node_type == 'call_expression':
                call_name = self._get_js_call_name(node)
                graph_node = CodeNode(
                    id=cpg.get_node_id(),
                    type='call',
                    name=call_name,
                    line=line_num,
                    column=col_num,
                    code=code_line.strip(),
                    properties={'node_type': node_type}
                )
            
            # Add node and traverse children
            if graph_node:
                cpg.add_node(graph_node)
                if parent_id:
                    edge = CodeEdge(source=parent_id, target=graph_node.id, type='contains')
                    cpg.add_edge(edge)
                current_parent = graph_node.id
            else:
                current_parent = parent_id
            
            for child in node.children:
                self._traverse_js_node(cpg, child, source_lines, current_parent)
                
        except Exception as e:
            logger.debug(f"JS node traversal error: {e}")
    
    def _get_js_function_name(self, node) -> str:
        """Extract JavaScript function name."""
        try:
            for child in node.children:
                if child.type == 'identifier':
                    return child.text.decode('utf-8', errors='ignore')
            return 'anonymous_function'
        except:
            return 'unknown_function'
    
    def _get_js_call_name(self, node) -> str:
        """Extract JavaScript call name."""
        try:
            for child in node.children:
                if child.type in ['identifier', 'member_expression']:
                    return child.text.decode('utf-8', errors='ignore')
            return 'unknown_call'
        except:
            return 'unknown_call'
    
    def _build_generic_graph(self, cpg: CodePropertyGraph, tree, source_lines: List[str]):
        """Build graph for other languages."""
        try:
            root_node = tree.root_node
            self._traverse_generic_node(cpg, root_node, source_lines)
        except Exception as e:
            logger.error(f"Generic graph building failed: {e}")
    
    def _traverse_generic_node(self, cpg: CodePropertyGraph, node, source_lines: List[str], parent_id: str = None):
        """Generic node traversal for unsupported languages."""
        try:
            # Basic traversal for any language
            for child in node.children:
                self._traverse_generic_node(cpg, child, source_lines, parent_id)
        except Exception as e:
            logger.debug(f"Generic node traversal error: {e}")


# Initialize the graph-based parser
_graph_parser = GraphBasedASTParser()


# ─── Public API ──────────────────────────────────────────────────────────────

def get_supported_extensions() -> list:
    """Called by /health endpoint to report supported file types."""
    return sorted(_LANG_MAP.keys())


def parse_file(file_path: str) -> dict:
    """
    Parse a source file with Tree-sitter and optionally build code graph.

    Returns:
        {
            language:   str,       e.g. "python", "rust", "unsupported"
            supported:  bool,
            tree:       Tree | None,
            source:     bytes | None,
            summary:    { functions, classes, imports },
            cpg:        { nodes, edges, graph_findings }  # Optional graph data
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

        return parse_file_from_content(file_path, source)

    except OSError as e:
        logger.error(f"[AST Parser] File read error — {file_path}: {e}")
        return _unsupported(ext)
    except Exception as e:
        logger.error(f"[AST Parser] Parse error — {file_path}: {e}")
        return _unsupported(ext)


def parse_file_from_content(file_path: str, source: bytes) -> dict:
    """
    Parse source code content with Tree-sitter and build code graph.
    
    Args:
        file_path: Path to the file (used for extension detection)
        source: Raw source code bytes
    
    Returns:
        Complete AST and graph analysis result
    """
    ext = _get_ext(file_path)
    entry = _LANG_MAP.get(ext)
    
    # Special case: Dockerfile has no extension
    if entry is None and os.path.basename(file_path) == "Dockerfile":
        entry = _LANG_MAP.get("Dockerfile")
    
    if entry is None:
        return _unsupported(ext)
    
    try:
        parser = Parser(entry["language"])
        tree = parser.parse(source)
        
        # Basic AST result
        result = {
            "language":  entry["label"],
            "supported": True,
            "tree":      tree,
            "source":    source,
            "summary":   _extract_summary(tree, source),
        }
        
        # Enhanced with graph analysis
        try:
            enhanced_result = _graph_parser.parse_and_build_graph(file_path, source)
            return enhanced_result
        except Exception as e:
            logger.warning(f"Graph analysis failed for {file_path}, using basic AST: {e}")
            return result
            
    except Exception as e:
        logger.error(f"[AST Parser] Parse error — {file_path}: {e}")
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


# ─── Graph Analysis API ──────────────────────────────────────────────────────

class ASTParser:
    """Main AST Parser class with graph analysis capabilities."""
    
    def __init__(self):
        self.graph_parser = _graph_parser
        logger.info("AST Parser initialized with graph analysis")
    
    def parse_file(self, filename: str, source_bytes: bytes) -> dict:
        """Parse file and build code graph for security analysis."""
        return parse_file_from_content(filename, source_bytes)
    
    def get_supported_extensions(self) -> List[str]:
        """Get list of supported file extensions."""
        return get_supported_extensions()
    
    def enable_graph_analysis(self, enabled: bool = True):
        """Enable or disable graph-based analysis."""
        self.graph_parser.enable_graph_analysis = enabled
        logger.info(f"Graph analysis {'enabled' if enabled else 'disabled'}")


# Module initialization
logger.info(f"AST Parser module loaded with {len(_LANG_MAP)} language mappings and graph analysis")

# ─── Module Exports ──────────────────────────────────────────────────────────

# Export the main class
__all__ = ['ASTParser', 'parse_file', 'get_supported_extensions']

# Module initialization
logger.info(f"AST Parser module loaded with {len(_LANG_MAP)} language mappings and graph analysis")
