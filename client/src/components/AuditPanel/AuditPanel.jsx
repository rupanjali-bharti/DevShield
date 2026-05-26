import { useState } from "react";
import { auditFile, auditProject, formatFindings } from "../../services/auditorService";

function AuditPanel({ 
  isOpen, 
  onClose, 
  projectName, 
  selectedFile, 
  fileTree,
  fileContent = ""
}) {
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedFinding, setExpandedFinding] = useState(null);
  const [auditType, setAuditType] = useState(null); // 'file' or 'project'
  const [auditedFile, setAuditedFile] = useState(null);
  const [filesScanned, setFilesScanned] = useState(0);

  const getSeverityBadgeColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "bg-red-500/20 text-red-400 border border-red-500/50";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50";
      case "low":
        return "bg-orange-500/20 text-orange-400 border border-orange-500/50";
      case "info":
        return "bg-blue-500/20 text-blue-400 border border-blue-500/50";
      default:
        return "bg-gray-500/20 text-gray-400 border border-gray-500/50";
    }
  };

  const handleAuditFile = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);
    setFindings([]);
    setAuditType("file");
    
    // Normalize path: convert backslashes to forward slashes
    const normalizedPath = selectedFile.path.replace(/\\/g, "/");
    setAuditedFile(normalizedPath);

    try {
      const result = await auditFile(projectName, normalizedPath, fileContent);
      const formattedFindings = formatFindings(result);
      setFindings(formattedFindings);
    } catch (err) {
      setError(err.message);
      console.error("File audit failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAuditProject = async () => {
    setLoading(true);
    setError(null);
    setFindings([]);
    setFilesScanned(0);
    setAuditType("project");
    setAuditedFile(null);

    try {
      console.log("Starting project audit for:", projectName);
      console.log("File tree:", fileTree);
      const allResults = await auditProject(projectName, fileTree);
      console.log("Audit results:", allResults);
      setFilesScanned(allResults.length);
      
      // Flatten all findings from all files
      const allFindings = [];
      allResults.forEach((fileResult) => {
        if (fileResult.findings) {
          const formatted = formatFindings({ findings: fileResult.findings });
          formatted.forEach((f) => {
            allFindings.push({
              ...f,
              file: fileResult.file,
            });
          });
        }
      });

      setFindings(allFindings);
    } catch (err) {
      setError(err.message);
      console.error("Project audit failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const criticalCount = findings.filter(
    (f) => f.severity?.toLowerCase() === "critical"
  ).length;
  const mediumCount = findings.filter(
    (f) => f.severity?.toLowerCase() === "medium"
  ).length;
  const lowCount = findings.filter(
    (f) => f.severity?.toLowerCase() === "low"
  ).length;
  const infoCount = findings.filter(
    (f) => f.severity?.toLowerCase() === "info"
  ).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-gray-800 border-l border-gray-700 flex flex-col shadow-lg z-40 animate-slideIn">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-lg">🔍 Audit Panel</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Audit Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleAuditFile}
            disabled={!selectedFile || loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium py-2 px-3 rounded transition-colors"
          >
            {loading && auditType === "file" ? "⏳ Auditing File..." : "🔎 Audit Current File"}
          </button>
          <button
            onClick={handleAuditProject}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium py-2 px-3 rounded transition-colors"
          >
            {loading && auditType === "project" ? "⏳ Auditing Project..." : "🔍 Audit Entire Project"}
          </button>
        </div>

      {/* File Info */}
      {auditedFile && (
        <div className="mt-3 p-2 bg-gray-700/50 rounded text-xs text-gray-300 space-y-1">
          <div><span className="font-medium">Project:</span> {projectName}</div>
          <div><span className="font-medium">File:</span> {auditedFile}</div>
        </div>
      )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-4 py-3 bg-red-500/10 border-b border-red-500/30 flex-shrink-0">
          <p className="text-red-400 text-xs">⚠️ {error}</p>
        </div>
      )}

      {/* Summary Stats */}
      {findings.length > 0 && (
        <div className="px-4 py-3 border-b border-gray-700 flex-shrink-0">
          <h3 className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-3">
            Summary
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-red-500/10 border border-red-500/30 rounded p-2">
              <p className="text-red-400 text-xs font-bold">{criticalCount}</p>
              <p className="text-gray-400 text-xs">Critical</p>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-2">
              <p className="text-yellow-400 text-xs font-bold">{mediumCount}</p>
              <p className="text-gray-400 text-xs">Medium</p>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/30 rounded p-2">
              <p className="text-orange-400 text-xs font-bold">{lowCount}</p>
              <p className="text-gray-400 text-xs">Low</p>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded p-2">
              <p className="text-blue-400 text-xs font-bold">{infoCount}</p>
              <p className="text-gray-400 text-xs">Info</p>
            </div>
          </div>
        </div>
      )}

      {/* Findings List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="px-4 py-8 text-center">
            <p className="text-gray-400 text-sm">⏳ Running security scan...</p>
          </div>
        ) : findings.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-gray-500 text-xs">
              {auditType === "project" ? (
                <>
                  ✓ Scanned {filesScanned} file{filesScanned !== 1 ? "s" : ""} - No vulnerabilities found!
                </>
              ) : auditType === "file" ? (
                "✓ No vulnerabilities found!"
              ) : (
                "Click 'Audit' to scan for vulnerabilities"
              )}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700/50">
            {findings.map((finding, index) => (
              <div
                key={index}
                className="px-4 py-3 hover:bg-gray-700/50 cursor-pointer transition-colors border-l-4"
                style={{
                  borderLeftColor:
                    finding.severity?.toLowerCase() === "critical"
                      ? "#ef4444"
                      : finding.severity?.toLowerCase() === "medium"
                      ? "#eab308"
                      : finding.severity?.toLowerCase() === "low"
                      ? "#f97316"
                      : "#3b82f6",
                }}
                onClick={() =>
                  setExpandedFinding(expandedFinding === index ? null : index)
                }
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex-shrink-0 w-2 h-2 rounded-full mt-1"
                    style={{
                      backgroundColor:
                        finding.severity?.toLowerCase() === "critical"
                          ? "#ef4444"
                          : finding.severity?.toLowerCase() === "medium"
                          ? "#eab308"
                          : finding.severity?.toLowerCase() === "low"
                          ? "#f97316"
                          : "#3b82f6",
                    }}
                  ></div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-gray-200 text-xs font-medium truncate">
                        {finding.title || "Security Finding"}
                      </p>
                      <span className={`${getSeverityBadgeColor(finding.severity)} px-2 py-0.5 rounded text-xs font-medium flex-shrink-0`}>
                        {finding.severity}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs">
                      Line {finding.line || "?"}
                      {finding.file && ` • ${finding.file}`}
                    </p>

                    {expandedFinding === index && (
                      <div className="mt-3 pt-3 border-t border-gray-600 space-y-3">
                        {/* Message */}
                        {finding.message && (
                          <div>
                            <p className="text-gray-400 text-xs leading-relaxed">
                              {finding.message}
                            </p>
                          </div>
                        )}

                        {/* Description */}
                        {finding.description && (
                          <div>
                            <p className="text-gray-300 text-xs font-medium mb-1">
                              Plain English:
                            </p>
                            <p className="text-gray-400 text-xs leading-relaxed">
                              {finding.description}
                            </p>
                          </div>
                        )}

                        {/* Why Dangerous */}
                        {finding.whyDangerous && (
                          <div>
                            <p className="text-red-400 text-xs font-medium mb-1">
                              ⚠️ Why Dangerous:
                            </p>
                            <p className="text-gray-400 text-xs leading-relaxed">
                              {finding.whyDangerous}
                            </p>
                          </div>
                        )}

                        {/* Code snippet */}
                        {finding.code && (
                          <div className="bg-gray-900/50 rounded p-2">
                            <p className="text-gray-400 text-xs font-medium mb-1">
                              Code:
                            </p>
                            <code className="text-gray-300 text-xs font-mono whitespace-pre-wrap break-words">
                              {finding.code}
                            </code>
                          </div>
                        )}

                        {/* Suggested Fix */}
                        {finding.suggestedFix && (
                          <div>
                            <p className="text-green-400 text-xs font-semibold mb-2">
                              ✨ Suggested Fix
                            </p>
                            <div className="bg-green-900/20 border border-green-500/30 rounded p-2">
                              <code className="text-green-300 text-xs font-mono whitespace-pre-wrap break-words">
                                {finding.suggestedFix}
                              </code>
                            </div>
                          </div>
                        )}

                        {/* What Changed */}
                        {finding.whatChanged && (
                          <div>
                            <p className="text-blue-400 text-xs font-medium mb-1">
                              📝 What Changed:
                            </p>
                            <p className="text-gray-400 text-xs leading-relaxed">
                              {finding.whatChanged}
                            </p>
                          </div>
                        )}

                        {/* CWE/OWASP Info */}
                        <div className="flex flex-wrap gap-2">
                          {finding.cwe && (
                            <span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded border border-purple-500/30">
                              CWE: {finding.cwe}
                            </span>
                          )}
                          {finding.owasp && (
                            <span className="bg-indigo-500/20 text-indigo-300 text-xs px-2 py-1 rounded border border-indigo-500/30">
                              OWASP: {finding.owasp}
                            </span>
                          )}
                          {finding.tool && (
                            <span className="bg-gray-500/20 text-gray-300 text-xs px-2 py-1 rounded border border-gray-500/30">
                              {finding.tool}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AuditPanel;
