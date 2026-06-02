import json
import logging
from typing import Dict, List, Any, Optional, Set, Tuple
from dataclasses import dataclass, asdict
import networkx as nx

logger = logging.getLogger(__name__)

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
        
        # 1. Find dangerous function calls
        findings.extend(self._find_dangerous_calls())
        
        # 2. Find data flow vulnerabilities
        findings.extend(self._find_data_flow_issues())
        
        # 3. Find control flow issues
        findings.extend(self._find_control_flow_issues())
        
        # 4. Find authentication/authorization issues
        findings.extend(self._find_auth_issues())
        
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
            'innerHTML': {'severity': 'medium', 'message': 'innerHTML assignment can lead to XSS'},
            'eval': {'severity': 'high', 'message': 'JavaScript eval() can lead to XSS/injection'}
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
                            'data_flow_path': [self.nodes[node_id].name for node_id in path]
                        })
        
        return findings
    
    def _find_control_flow_issues(self) -> List[Dict[str, Any]]:
        """Find control flow vulnerabilities."""
        findings = []
        
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
        
        return findings
    
    def _find_auth_issues(self) -> List[Dict[str, Any]]:
        """Find authentication and authorization issues."""
        findings = []
        
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
        
        return findings
    
    def _find_user_input_nodes(self) -> List[CodeNode]:
        """Find nodes that represent user input."""
        input_patterns = [
            'request.', 'req.', 'input', 'params', 'query', 'body',
            'form', 'post', 'get', 'argv', 'stdin', 'raw_input'
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
            'response', 'redirect', 'send', 'exec', 'subprocess'
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
            'check', 'verify', 'parse', 'trim', 'strip'
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
            'create', 'update', 'modify', 'edit', 'change'
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
            'permission', 'authorize', 'access', 'verify'
        ]
        
        # Get predecessors (nodes that come before this function)
        predecessors = list(self.graph.predecessors(func_node_id))
        
        for pred_id in predecessors:
            pred_node = self.nodes.get(pred_id)
            if pred_node:
                if any(pattern in pred_node.name.lower() for pattern in auth_patterns):
                    return True
        
        return False
    
    def _has_jwt_validation(self, jwt_node_id: str) -> bool:
        """Check if JWT token is properly validated."""
        validation_patterns = [
            'verify', 'validate', 'decode', 'check', 'authenticate'
        ]
        
        # Check successors and predecessors
        neighbors = list(self.graph.successors(jwt_node_id)) + list(self.graph.predecessors(jwt_node_id))
        
        for neighbor_id in neighbors:
            neighbor_node = self.nodes.get(neighbor_id)
            if neighbor_node:
                if any(pattern in neighbor_node.name.lower() for pattern in validation_patterns):
                    return True
        
        return False
    
    def _get_node_context(self, node_id: str) -> Dict[str, Any]:
        """Get context information for a node."""
        node = self.nodes.get(node_id)
        if not node:
            return {}
        
        predecessors = [self.nodes[pred].name for pred in self.graph.predecessors(node_id) if pred in self.nodes]
        successors = [self.nodes[succ].name for succ in self.graph.successors(node_id) if succ in self.nodes]
        
        return {
            'predecessors': predecessors[:5],  # Limit to prevent huge contexts
            'successors': successors[:5],
            'node_type': node.type,
            'neighborhood_size': len(predecessors) + len(successors)
        }

class GraphBasedASTParser:
    """Enhanced AST parser that builds code property graphs."""
    
    def __init__(self, base_parser):
        self.base_parser = base_parser
    
    def parse_and_build_graph(self, filename: str, code_content: bytes) -> Dict[str, Any]:
        """Parse code and build a code property graph."""
        try:
            # Get basic AST parsing results
            ast_result = self.base_parser.parse_file(filename, code_content)
            
            if not ast_result['supported']:
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
        # Similar to Python but with JS-specific patterns
        try:
            root_node = tree.root_node
            self._traverse_js_node(cpg, root_node, source_lines)
        except Exception as e:
            logger.error(f"JavaScript graph building failed: {e}")
    
    def _traverse_js_node(self, cpg: CodePropertyGraph, node, source_lines: List[str], parent_id: str = None):
        """Traverse JavaScript AST nodes."""
        # Similar implementation to Python with JS-specific node types
        pass
    
    def _build_generic_graph(self, cpg: CodePropertyGraph, tree, source_lines: List[str]):
        """Build graph for other languages."""
        # Generic implementation for unsupported languages
        try:
            root_node = tree.root_node
            # Basic traversal without language-specific optimizations
            self._traverse_generic_node(cpg, root_node, source_lines)
        except Exception as e:
            logger.error(f"Generic graph building failed: {e}")
    
    def _traverse_generic_node(self, cpg: CodePropertyGraph, node, source_lines: List[str], parent_id: str = None):
        """Generic node traversal."""
        # Basic implementation for any language
        pass
