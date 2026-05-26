// auditorService.js

import axios from 'axios';
import { getFileContent } from './api';

const AUDITOR_BASE_URL = import.meta.env.VITE_AUDITOR_URL || "http://localhost:8000";
const SERVER_BASE_URL = "http://localhost:3001";  // ✅ All audit calls go here now

// ✅ Single file audit
export const auditFile = async (projectName, filePath, code) => {
  try {
    const normalizedPath = filePath.replace(/\\/g, "/"); // normalize Windows paths
    
    console.log("[Client] Sending audit request:", {
      projectName,
      filePath: normalizedPath,
      codeLength: code?.length || 0
    });

    const response = await axios.post(`${SERVER_BASE_URL}/api/audit`, {
      projectName,
      filename: normalizedPath,
      code
    });

    console.log("[Client] Audit response:", response.data);
    return response.data;
  } catch (err) {
    console.error("[Client] Audit error:", err);
    const msg = err.response?.data?.error || err.message;
    throw new Error(`Audit failed: ${msg}`);
  }
};

// ✅ Recursively flattens nested file tree into a flat array of files only
const flattenFileTree = (nodes, result = []) => {
  for (const node of nodes) {
    if (node.type === "file") {
      result.push(node);                          // ✅ only collect files, skip folders
    } else if (node.type === "folder" && node.children) {
      flattenFileTree(node.children, result);     // ✅ recurse into subfolders
    }
  }
  return result;
};

const SKIP_EXTENSIONS = [
  ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico",
  ".woff", ".woff2", ".ttf", ".eot",
  ".zip", ".tar", ".gz",
  ".lock", ".log", ".env"
];

const shouldSkipFile = (filePath) => {
  const lower = filePath.toLowerCase();
  return SKIP_EXTENSIONS.some(ext => lower.endsWith(ext));
};


// ✅ Full project audit
export const auditProject = async (projectName, fileTree) => {
  const results = [];
  const files = flattenFileTree(fileTree);

  for (const file of files) {
    // ✅ Skip binary/lock/irrelevant files
    if (shouldSkipFile(file.path)) {
      console.log(`Skipping: ${file.path}`);
      continue;
    }

    try {
      const normalizedPath = file.path.replace(/\\/g, "/");
      // ✅ Read the file content before auditing
      const fileContent = await getFileContent(projectName, file.path);
      const result = await auditFile(projectName, normalizedPath, fileContent);
      results.push({ file: normalizedPath, findings: result });
    } catch (err) {
      console.warn(`Failed to audit ${file.path}:`, err.message);
    }
  }

  return results;
};

// ✅ Format audit findings into a consistent structure
export const formatFindings = (data) => {
  console.log("[Format] Input data:", data);
  
  // Handle both direct array and object with findings property
  let findings = Array.isArray(data) ? data : (data?.findings || data);
  
  // Handle wrapped responses from DB
  if (Array.isArray(findings)) {
    findings = findings.map(f => ({
      id: f._id || f.id,
      severity: f.severity || "low",
      message: f.message || f.title || "Unknown issue",
      line: f.line || 0,
      type: f.type || "security",
      ...f
    }));
  } else if (findings && typeof findings === "object") {
    // Single finding - wrap in array
    findings = [{
      id: findings._id || findings.id,
      severity: findings.severity || "low",
      message: findings.message || findings.title || "Unknown issue",
      line: findings.line || 0,
      type: findings.type || "security",
      ...findings
    }];
  } else {
    findings = [];
  }
  
  console.log("[Format] Output findings:", findings);
  return findings;
};

// ✅ Fetch past audit findings for a project
export const getProjectFindings = async (projectName) => {
  const response = await axios.get(`${SERVER_BASE_URL}/api/audit/${projectName}`);
  return response.data;
};

// ✅ Accept a patch
export const acceptPatch = async (findingId) => {
  const response = await axios.patch(`${SERVER_BASE_URL}/api/audit/${findingId}/accept`);
  return response.data;
};
