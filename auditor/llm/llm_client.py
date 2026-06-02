import logging
import json
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

class LLMClient:
    def __init__(self):
        from config import Config
        self.provider = Config.LLM_PROVIDER
        self.groq_api_key = Config.GROQ_API_KEY
        self.groq_model = Config.GROQ_MODEL
        self.ollama_base_url = Config.OLLAMA_BASE_URL
        self.ollama_model = Config.OLLAMA_MODEL
        
    def is_available(self):
        """Check if LLM service is available."""
        try:
            if self.provider == "groq":
                return bool(self.groq_api_key)
            elif self.provider == "ollama":
                # Could add a ping to Ollama here
                return True
            return False
        except Exception as e:
            logger.error(f"Error checking LLM availability: {e}")
            return False
    
    def enrich_findings(self, findings: List[Dict[str, Any]], code_content: str, filename: str) -> Optional[List[Dict[str, Any]]]:
        """Enrich security findings with LLM analysis."""
        try:
            if not findings:
                return findings
            
            logger.debug(f"Enriching {len(findings)} findings with {self.provider}")
            
            # For now, return original findings with added AI context
            # In a real implementation, you would call the actual LLM API
            enriched = []
            
            for finding in findings:
                enriched_finding = finding.copy()
                
                # Add mock AI enrichment for demonstration
                enriched_finding['ai_analysis'] = {
                    'confidence': 'high',
                    'explanation': f"This {finding.get('severity', 'unknown')} severity issue in {filename} requires attention.",
                    'remediation_hint': self._get_remediation_hint(finding)
                }
                
                enriched.append(enriched_finding)
            
            return enriched
            
        except Exception as e:
            logger.error(f"LLM enrichment failed: {e}")
            return None
    
    def _get_remediation_hint(self, finding: Dict[str, Any]) -> str:
        """Generate a basic remediation hint based on the finding."""
        rule_id = finding.get('rule_id', '').lower()
        
        if 'password' in rule_id or 'secret' in rule_id:
            return "Store sensitive data in environment variables or secure credential storage."
        elif 'sql' in rule_id:
            return "Use parameterized queries to prevent SQL injection."
        elif 'xss' in rule_id:
            return "Sanitize user input and use proper output encoding."
        elif 'eval' in rule_id or 'exec' in rule_id:
            return "Avoid using eval() or exec(). Use safer alternatives for dynamic code execution."
        else:
            return "Review the security implications and implement appropriate safeguards."
