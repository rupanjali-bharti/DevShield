// client/src/services/auditorService.js
const AUDITOR_BASE_URL = import.meta.env.VITE_AUDITOR_URL || 'http://localhost:8000';

export const auditFile = async (projectName, filename, code = '') => {
  try {
    console.log('🔍 Starting audit for:', { projectName, filename, hasCode: !!code });
    
    const response = await fetch(`${AUDITOR_BASE_URL}/audit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectName,
        filename,
        code: code || ''  // Always provide code, even if empty
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Audit completed:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Audit failed:', error);
    throw error;
  }
};

export const formatFindings = (auditResult) => {
  if (!auditResult || !auditResult.findings) {
    return [];
  }
  
  return auditResult.findings.map(finding => ({
    id: `${finding.rule_id}-${finding.line}`,
    rule_id: finding.rule_id,
    type: finding.type,
    severity: finding.severity,
    message: finding.message,
    line: finding.line,
    start_col: finding.start_col,
    end_col: finding.end_col,
    filename: finding.filename,
    code_snippet: finding.code_snippet,
    tool: finding.tool
  }));
};
