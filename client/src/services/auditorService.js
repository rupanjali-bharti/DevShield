import axios from "axios";

// Python Auditor backend runs on a different port (FastAPI)
const AUDITOR_BASE_URL = import.meta.env.VITE_AUDITOR_URL || "http://localhost:8000";
const SERVER_BASE_URL = "http://localhost:3001";

/**
 * Health check for auditor backend
 */
export const checkAuditorHealth = async () => {
  try {
    const response = await axios.get(`${AUDITOR_BASE_URL}/health`);
    return response.data;
  } catch (error) {
    console.error("Auditor health check failed:", error.message);
    return null;
  }
};

/**
 * Audit a single file from the workspace
 * @param {string} projectName - Name of the workspace project
 * @param {string} filePath - Relative path to the file (e.g., "src/app.py")
 * @returns {Object} Findings with LLM explanations and patch suggestions
 */
export const auditFile = async (projectName, filePath) => {
  try {
    const response = await axios.post(`${AUDITOR_BASE_URL}/audit`, {
      project_name: projectName,
      file_path: filePath,
    });
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.detail || error.message;
    throw new Error(`Audit failed: ${errorMsg}`);
  }
};

/**
 * Audit code content directly
 * @param {string} projectName - Project name for context
 * @param {string} filePath - File path for context
 * @param {string} code - Source code to audit
 * @returns {Object} Findings with explanations
 */
export const auditCodeContent = async (projectName, filePath, code) => {
  try {
    // Save the code first, then audit
    await axios.post(`${SERVER_BASE_URL}/api/files/${projectName}`, {
      filePath,
      content: code,
    });

    // Now audit it
    return await auditFile(projectName, filePath);
  } catch (error) {
    throw new Error(`Code audit failed: ${error.message}`);
  }
};

/**
 * Accept a patch suggestion
 * Stores it in MongoDB for future few-shot learning
 */
export const acceptPatch = async ({
  projectName,
  filePath,
  vulnerabilityId,
  originalCode,
  patchedCode,
  explanation,
  severity,
}) => {
  try {
    const response = await axios.post(`${AUDITOR_BASE_URL}/patches/accept`, {
      project_name: projectName,
      file_path: filePath,
      vulnerability_id: vulnerabilityId,
      original_code: originalCode,
      patched_code: patchedCode,
      explanation: explanation,
      severity: severity,
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to accept patch: ${error.message}`);
  }
};

/**
 * Get patch history for a project
 * Shows all previously accepted patches
 */
export const getPatchHistory = async (projectName) => {
  try {
    const response = await axios.get(
      `${AUDITOR_BASE_URL}/patches/history/${projectName}`
    );
    return response.data.patches || [];
  } catch (error) {
    console.error("Failed to fetch patch history:", error.message);
    return [];
  }
};

/**
 * Get security analytics for a project
 * Returns vulnerability counts by severity and security score
 */
export const getAnalytics = async (projectName) => {
  try {
    const response = await axios.get(
      `${AUDITOR_BASE_URL}/analytics/${projectName}`
    );
    return response.data;
  } catch (error) {
    console.error("Failed to fetch analytics:", error.message);
    return null;
  }
};

/**
 * Audit all files in a project directory
 * Scans supported languages only
 */
export const auditProject = async (projectName, fileTree) => {
  const findings = [];

  const supportedExtensions = [
    ".py",
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".java",
    ".go",
    ".rs",
    ".cpp",
    ".c",
    ".rb",
    ".php",
  ];

  const collectFiles = (tree) => {
    const files = [];
    for (const item of tree) {
      if (item.type === "file") {
        const ext = item.name.substring(item.name.lastIndexOf("."));
        if (supportedExtensions.includes(ext)) {
          files.push(item.path);
        }
      } else if (item.type === "folder" && item.children) {
        files.push(...collectFiles(item.children));
      }
    }
    return files;
  };

  const files = collectFiles(fileTree);
  
  if (files.length === 0) {
    console.warn("No supported files found to audit");
    return [];
  }

  // Audit each file
  for (const file of files) {
    try {
      // Normalize path: convert backslashes to forward slashes
      const normalizedPath = file.replace(/\\/g, "/");
      const result = await auditFile(projectName, normalizedPath);
      
      if (result && result.findings && result.findings.length > 0) {
        findings.push({
          file: normalizedPath,
          findings: result.findings,
          vulnerabilityCount: result.vulnerability_count || result.findings.length,
        });
      }
    } catch (error) {
      console.warn(`Failed to audit ${file}:`, error.message);
      // Continue to next file instead of stopping
    }
  }

  return findings;
};

/**
 * Format audit findings for UI display
 */
export const formatFindings = (auditResponse) => {
  if (!auditResponse.findings) return [];

  return auditResponse.findings.map((finding, index) => ({
    id: finding.id,
    title: finding.rule_id || "Security Issue",
    severity: finding.severity || "info",
    line: finding.line_start,
    lineEnd: finding.line_end,
    message: finding.message,
    cwe: finding.cwe,
    owasp: finding.owasp,
    tool: finding.tool,
    code: finding.code_snippet,
    description: finding.llm?.plain_english || finding.message,
    whyDangerous: finding.llm?.why_dangerous || "",
    suggestedFix: finding.llm?.patched_code || "",
    whatChanged: finding.llm?.what_changed || "",
    sourceContext: finding.source_context,
    index,
  }));
};
