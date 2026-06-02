import os
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import json

# Configure logging first
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

logger.info("🚀 Starting DevShield Auditor...")

# Import configuration
try:
    from config import Config
    logger.info("✅ Config imported successfully")
except ImportError as e:
    logger.error(f"❌ Config import failed: {e}")
    raise

# Import scanner
semgrep_scanner = None
try:
    from scanner.semgrep_scanner import SemgrepScanner
    semgrep_scanner = SemgrepScanner()
    logger.info("✅ SemgrepScanner imported and initialized")
except ImportError as e:
    logger.warning(f"⚠️ SemgrepScanner import failed: {e}")
except Exception as e:
    logger.error(f"❌ SemgrepScanner initialization failed: {e}")

# Import AST parser - FIXED VERSION
ast_parser = None
ASTParser = None  # Initialize to None first
try:
    from parser.ast_parser import ASTParser
    ast_parser = ASTParser()
    ast_parser.enable_graph_analysis(True)  # Force enable graph analysis
    logger.info("✅ ASTParser imported and initialized with graph analysis")
except ImportError as e:
    logger.warning(f"⚠️ ASTParser import failed: {e}")
    ASTParser = None  # Ensure it's None if import fails
except Exception as e:
    logger.error(f"❌ ASTParser initialization failed: {e}")
    ASTParser = None

# Import LLM client
llm_client = None
LLMClient = None
try:
    from llm.llm_client import LLMClient
    llm_client = LLMClient()
    logger.info("✅ LLMClient imported and initialized")
except ImportError as e:
    logger.warning(f"⚠️ LLMClient import failed: {e}")
    LLMClient = None
except Exception as e:
    logger.error(f"❌ LLMClient initialization failed: {e}")
    LLMClient = None

# FastAPI app
app = FastAPI(title="DevShield Security Auditor", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=Config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Log initialization status
logger.info(f"🛡️ DevShield Auditor Status:")
logger.info(f"  - Semgrep Scanner: {'✅ Ready' if semgrep_scanner else '❌ Not Available'}")
logger.info(f"  - AST Parser: {'✅ Ready' if ast_parser else '❌ Not Available'}")
logger.info(f"  - LLM Client: {'✅ Ready' if llm_client else '❌ Not Available'}")


# Initialize components
semgrep_scanner = SemgrepScanner() if SemgrepScanner else None
ast_parser = ASTParser() if ASTParser else None
llm_client = LLMClient() if LLMClient else None

class AuditRequest(BaseModel):
    projectName: str
    filename: str
    code: Optional[str] = None

class AuditResponse(BaseModel):
    findings: List[Dict[str, Any]]
    summary: Dict[str, Any]
    metadata: Dict[str, Any]

@app.post("/audit", response_model=AuditResponse)
async def audit_code(request: AuditRequest):
    """Audit code for security vulnerabilities."""
    
    logger.info("🛡️ DEBUG: AUDIT REQUEST RECEIVED")
    logger.info(f"Project Name:    {request.projectName}")
    logger.info(f"Requested File:  {request.filename}")
    
    # Determine workspace root
    workspace_root = Config.get_workspace_path(request.projectName)
    file_path = os.path.join(workspace_root, request.filename)
    
    logger.info(f"Workspace Root:  {workspace_root}")
    logger.info(f"Absolute Path:   {file_path}")
    logger.info(f"Is this a File?: {os.path.isfile(file_path)}")
    logger.info(f"Is this a Dir?:  {os.path.isdir(file_path)}")
    logger.info(f"Code Provided:   {bool(request.code)} ({len(request.code or '')} chars)")
    logger.info("=" * 50)
    
    try:
        # Determine code content
        code_content = None
        if request.code:
            logger.info(f"[DEBUG] Using provided code content ({len(request.code)} chars)")
            code_content = request.code
        elif os.path.isfile(file_path):
            logger.info(f"[DEBUG] Reading code from file: {file_path}")
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    code_content = f.read()
            except Exception as e:
                logger.warning(f"Failed to read file {file_path}: {e}")
                raise HTTPException(status_code=404, detail=f"Could not read file: {request.filename}")
        else:
            logger.warning(f"File not found and no code provided: {file_path}")
            raise HTTPException(status_code=404, detail=f"File not found: {request.filename}")
        
        if not code_content or not code_content.strip():
            logger.warning("Empty or whitespace-only code content")
            return AuditResponse(
                findings=[],
                summary={"total_issues": 0, "message": "Empty file"},
                metadata={"filename": request.filename, "project": request.projectName}
            )
        
        logger.info(f"🔍 Processing {len(code_content)} characters of code")
        
        # Show first 200 chars of code for debugging
        code_preview = code_content[:200].replace('\n', '\\n')
        logger.info(f"📝 Code preview: {code_preview}...")
        
        # Run security scanners
        findings = []
        
        # 1. Semgrep Analysis
        if semgrep_scanner:
            try:
                logger.info("🔍 Starting Semgrep analysis...")
                semgrep_findings = semgrep_scanner.scan_code(
                    code_content, 
                    request.filename,
                    workspace_root
                )
                findings.extend(semgrep_findings)
                logger.info(f"✅ Semgrep completed: {len(semgrep_findings)} issues found")
                
                # Debug: Show semgrep findings
                for i, finding in enumerate(semgrep_findings[:3]):
                    logger.info(f"  Semgrep #{i+1}: {finding.get('rule_id')} - {finding.get('message')}")
                    
            except Exception as e:
                logger.error(f"❌ Semgrep analysis failed: {e}")
        else:
            logger.warning("⚠️ Semgrep scanner not available")
        
        # 2. AST Analysis (WITH GRAPH)
        if ast_parser:
            try:
                logger.info("🔍 Starting AST + Graph analysis...")
                ast_result = ast_parser.parse_file(request.filename, code_content.encode())
                
                logger.info(f"📊 AST Result Summary:")
                logger.info(f"  - Language: {ast_result.get('language', 'unknown')}")
                logger.info(f"  - Supported: {ast_result.get('supported', False)}")
                logger.info(f"  - Has Tree: {ast_result.get('tree') is not None}")
                logger.info(f"  - Has CPG: {'cpg' in ast_result}")
                
                if ast_result.get('cpg'):
                    cpg_data = ast_result['cpg']
                    logger.info(f"  - CPG Nodes: {cpg_data.get('nodes', 0)}")
                    logger.info(f"  - CPG Edges: {cpg_data.get('edges', 0)}")
                    logger.info(f"  - Graph Findings: {len(cpg_data.get('graph_findings', []))}")
                
                if ast_result.get('supported') and ast_result.get('summary'):
                    ast_findings = analyze_ast_for_security(ast_result, request.filename)
                    findings.extend(ast_findings)
                    logger.info(f"✅ AST analysis completed: {len(ast_findings)} issues found")
                    
                    # Debug: Show AST findings
                    for i, finding in enumerate(ast_findings[:3]):
                        logger.info(f"  AST #{i+1}: {finding.get('rule_id')} - {finding.get('message')}")
                else:
                    logger.warning(f"⚠️ AST analysis not supported for {request.filename}")
            except Exception as e:
                logger.error(f"❌ AST analysis failed: {e}", exc_info=True)
        else:
            logger.warning("⚠️ AST parser not available")
        
        # 3. Pattern Analysis
        try:
            logger.info("🔍 Starting pattern analysis...")
            pattern_findings = analyze_security_patterns(code_content, request.filename)
            findings.extend(pattern_findings)
            logger.info(f"✅ Pattern analysis completed: {len(pattern_findings)} issues found")
            
            # Debug: Show pattern findings
            for i, finding in enumerate(pattern_findings[:3]):
                logger.info(f"  Pattern #{i+1}: {finding.get('rule_id')} - {finding.get('message')}")
                
        except Exception as e:
            logger.error(f"❌ Pattern analysis failed: {e}")
        
        # Remove duplicates
        unique_findings = deduplicate_findings(findings)
        logger.info(f"🎯 Total unique findings after deduplication: {len(unique_findings)}")
        
        # Show all findings for debugging
        if unique_findings:
            logger.info("📋 All findings:")
            for i, finding in enumerate(unique_findings):
                logger.info(f"  #{i+1}: {finding.get('type', 'unknown')} - {finding.get('rule_id')} - {finding.get('severity', 'unknown')} - {finding.get('message', 'No message')[:100]}")
        else:
            logger.warning("⚠️ No findings detected by any scanner")
        
        # Generate summary
        summary = generate_summary(unique_findings, request.filename)
        
        # Prepare response
        response = AuditResponse(
            findings=unique_findings,
            summary=summary,
            metadata={
                "filename": request.filename,
                "project": request.projectName,
                "code_length": len(code_content),
                "scanners_used": [s for s in ["semgrep", "ast", "patterns"] if s],
                "total_findings": len(unique_findings)
            }
        )
        
        logger.info(f"✅ Audit completed successfully with {len(unique_findings)} findings")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Audit failed with error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


def analyze_ast_for_security(ast_result, filename):
    """Extract security findings from AST analysis including graph-based findings."""
    findings = []
    summary = ast_result.get('summary', {})
    
    # Original AST-based checks
    functions = summary.get('functions', [])
    imports = summary.get('imports', [])
    
    # Check for dangerous functions
    dangerous_functions = ['eval', 'exec', 'compile', '__import__']
    for func in functions:
        if func.get('name') in dangerous_functions:
            findings.append({
                'rule_id': f'dangerous-function-{func.get("name")}',
                'type': 'security',
                'severity': 'high',
                'message': f'Use of dangerous function: {func.get("name")}',
                'line': func.get('start_line', 1),
                'filename': filename
            })
    
    # Check for dangerous imports
    dangerous_imports = ['subprocess', 'os', 'pickle']
    for imp in imports:
        if any(dangerous_mod in imp.lower() for dangerous_mod in dangerous_imports):
            findings.append({
                'rule_id': f'dangerous-import',
                'type': 'security',
                'severity': 'medium',
                'message': f'Potentially dangerous import: {imp}',
                'line': 1,  # Import usually at top
                'filename': filename
            })
    
    # NEW: Add graph-based findings
    cpg_data = ast_result.get('cpg', {})
    graph_findings = cpg_data.get('graph_findings', [])
    
    # Add graph-based findings to results
    for graph_finding in graph_findings:
        graph_finding['filename'] = filename  # Ensure filename is set
        findings.append(graph_finding)
    
    # Log graph analysis results
    if cpg_data:
        logger.info(f"Graph analysis: {cpg_data.get('nodes', 0)} nodes, {cpg_data.get('edges', 0)} edges, {len(graph_findings)} graph-based findings")
    
    return findings


def analyze_security_patterns(code, filename):
    """Analyze code for common security patterns with better detection."""
    findings = []
    lines = code.split('\n')
    
    logger.info(f"🔍 Pattern analysis scanning {len(lines)} lines")
    
    # Enhanced security patterns
    patterns = [
        {
            'patterns': ['password', 'passwd', 'pwd'],
            'rule_id': 'hardcoded-password',
            'severity': 'high',
            'message': 'Possible hardcoded password detected'
        },
        {
            'patterns': ['api_key', 'apikey', 'api-key'],
            'rule_id': 'hardcoded-api-key', 
            'severity': 'high',
            'message': 'Possible hardcoded API key detected'
        },
        {
            'patterns': ['secret', 'token', 'key'],
            'rule_id': 'hardcoded-secret',
            'severity': 'medium',
            'message': 'Possible hardcoded secret detected'
        },
        {
            'patterns': ['eval(', 'eval '],
            'rule_id': 'dangerous-eval',
            'severity': 'high',
            'message': 'Use of eval() function detected - code injection risk'
        },
        {
            'patterns': ['exec(', 'exec '],
            'rule_id': 'dangerous-exec',
            'severity': 'high',
            'message': 'Use of exec() function detected - code injection risk'
        },
        {
            'patterns': ['innerhtml', 'dangerouslysetinnerhtml'],
            'rule_id': 'xss-innerHTML',
            'severity': 'medium',
            'message': 'Potential XSS vulnerability via innerHTML'
        },
        {
            'patterns': ['${', '${'],  # Template literal injection
            'rule_id': 'template-injection',
            'severity': 'medium',
            'message': 'Potential template injection vulnerability'
        }
    ]
    
    for line_num, line in enumerate(lines, 1):
        line_lower = line.lower().strip()
        
        if not line_lower or line_lower.startswith('//') or line_lower.startswith('#'):
            continue  # Skip empty lines and comments
            
        for pattern_group in patterns:
            for pattern in pattern_group['patterns']:
                if pattern in line_lower:
                    # Additional context checks
                    if pattern_group['rule_id'] in ['hardcoded-password', 'hardcoded-api-key', 'hardcoded-secret']:
                        # Only flag if it looks like an assignment
                        if '=' in line and not line_lower.strip().startswith('//'):
                            findings.append({
                                'rule_id': pattern_group['rule_id'],
                                'type': 'pattern-analysis',
                                'severity': pattern_group['severity'],
                                'message': pattern_group['message'],
                                'line': line_num,
                                'filename': filename,
                                'code_snippet': line.strip()
                            })
                            logger.info(f"  Found {pattern_group['rule_id']} at line {line_num}")
                    else:
                        # For other patterns, flag immediately
                        findings.append({
                            'rule_id': pattern_group['rule_id'],
                            'type': 'pattern-analysis',
                            'severity': pattern_group['severity'],
                            'message': pattern_group['message'],
                            'line': line_num,
                            'filename': filename,
                            'code_snippet': line.strip()
                        })
                        logger.info(f"  Found {pattern_group['rule_id']} at line {line_num}")
    
    logger.info(f"Pattern analysis found {len(findings)} issues")
    return findings



def deduplicate_findings(findings):
    """Remove duplicate findings."""
    seen = set()
    unique = []
    
    for finding in findings:
        key = (
            finding.get('rule_id'),
            finding.get('line'),
            finding.get('filename')
        )
        
        if key not in seen:
            seen.add(key)
            unique.append(finding)
    
    return unique

def generate_summary(findings, filename):
    """Generate a summary of findings."""
    total = len(findings)
    
    severity_counts = {}
    for finding in findings:
        severity = finding.get('severity', 'unknown')
        severity_counts[severity] = severity_counts.get(severity, 0) + 1
    
    return {
        'total_issues': total,
        'severity_breakdown': severity_counts,
        'filename': filename,
        'status': 'clean' if total == 0 else 'issues_found'
    }

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "DevShield Security Auditor",
        "version": "1.0.0",
        "components": {
            "semgrep": semgrep_scanner is not None,
            "ast_parser": ast_parser is not None,
            "llm_client": llm_client is not None
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
