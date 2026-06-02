import subprocess
import json
import tempfile
import os
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class SemgrepScanner:
    def __init__(self):
        self.timeout = 30
        
    def scan_code(self, code_content, filename, workspace_root=None):
        """Scan code content with Semgrep."""
        try:
            logger.debug(f"Starting Semgrep scan for {filename}")
            
            # Create a temporary file with the code content
            file_ext = Path(filename).suffix or '.txt'
            
            with tempfile.NamedTemporaryFile(
                mode='w',
                suffix=file_ext,
                delete=False,
                encoding='utf-8'
            ) as temp_file:
                temp_file.write(code_content)
                temp_file.flush()
                temp_path = temp_file.name
            
            try:
                # Run Semgrep on the temporary file
                result = self._run_semgrep(temp_path, filename)
                return result
            finally:
                # Clean up temporary file
                try:
                    os.unlink(temp_path)
                except OSError:
                    pass
                    
        except Exception as e:
            logger.error(f"Semgrep scan failed: {e}")
            return []
    
    def _run_semgrep(self, file_path, original_filename):
        """Run Semgrep analysis on a file."""
        try:
            # Check if semgrep is available
            try:
                subprocess.run(['semgrep', '--version'], 
                             capture_output=True, check=True, timeout=5)
            except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
                logger.warning("Semgrep not available, skipping scan")
                return []
            
            cmd = [
                'semgrep',
                '--json',
                '--config=auto',
                '--quiet',
                file_path
            ]
            
            logger.debug(f"Running Semgrep: {' '.join(cmd)}")
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=self.timeout
            )
            
            if result.returncode not in [0, 1]:  # 0 = no issues, 1 = issues found
                logger.warning(f"Semgrep returned exit code: {result.returncode}")
                logger.warning(f"Stderr: {result.stderr}")
                return []
            
            try:
                output = json.loads(result.stdout)
                findings = []
                
                for result_item in output.get('results', []):
                    finding = {
                        'rule_id': result_item.get('check_id', 'unknown'),
                        'type': 'semgrep',
                        'severity': self._map_severity(result_item.get('extra', {}).get('severity', 'INFO')),
                        'message': result_item.get('extra', {}).get('message', 'Security issue detected'),
                        'line': result_item.get('start', {}).get('line', 1),
                        'start_col': result_item.get('start', {}).get('col', 1),
                        'end_col': result_item.get('end', {}).get('col', 1),
                        'filename': original_filename,
                        'code_snippet': result_item.get('extra', {}).get('lines', ''),
                        'tool': 'semgrep'
                    }
                    findings.append(finding)
                
                logger.info(f"Semgrep found {len(findings)} issues in {original_filename}")
                return findings
                
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse Semgrep JSON output: {e}")
                logger.debug(f"Raw output: {result.stdout[:500]}...")
                return []
                
        except subprocess.TimeoutExpired:
            logger.error(f"Semgrep scan timed out after {self.timeout} seconds")
            return []
        except Exception as e:
            logger.error(f"Semgrep scan error: {e}")
            return []
    
    def _map_severity(self, semgrep_severity):
        """Map Semgrep severity to our severity levels."""
        severity_map = {
            'ERROR': 'high',
            'WARNING': 'medium',
            'INFO': 'low'
        }
        return severity_map.get(semgrep_severity.upper(), 'low')
