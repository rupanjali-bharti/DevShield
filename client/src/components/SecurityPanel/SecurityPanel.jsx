import { useState } from "react";

function SecurityPanel({ findings = [] }) {
  const [expandedFinding, setExpandedFinding] = useState(null);

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "text-red-500 bg-red-500/10 border-red-500/30";
      case "medium":
        return "text-yellow-500 bg-yellow-500/10 border-yellow-500/30";
      case "info":
        return "text-blue-500 bg-blue-500/10 border-blue-500/30";
      default:
        return "text-gray-500 bg-gray-500/10 border-gray-500/30";
    }
  };

  const getSeverityBadgeColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "bg-red-500/20 text-red-400 border border-red-500/50";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50";
      case "info":
        return "bg-blue-500/20 text-blue-400 border border-blue-500/50";
      default:
        return "bg-gray-500/20 text-gray-400 border border-gray-500/50";
    }
  };

  const criticalCount = findings.filter(
    (f) => f.severity?.toLowerCase() === "critical"
  ).length;
  const mediumCount = findings.filter(
    (f) => f.severity?.toLowerCase() === "medium"
  ).length;
  const infoCount = findings.filter(
    (f) => f.severity?.toLowerCase() === "info"
  ).length;

  return (
    <div className="flex flex-col h-full bg-gray-800 border-l border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700 flex-shrink-0">
        <h2 className="text-white font-semibold text-sm mb-3">FINDINGS</h2>

        {/* Summary Stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Critical</span>
            <span className={`${getSeverityBadgeColor("critical")} px-2 py-1 rounded text-xs font-medium`}>
              {criticalCount}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Medium</span>
            <span className={`${getSeverityBadgeColor("medium")} px-2 py-1 rounded text-xs font-medium`}>
              {mediumCount}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Info</span>
            <span className={`${getSeverityBadgeColor("info")} px-2 py-1 rounded text-xs font-medium`}>
              {infoCount}
            </span>
          </div>
        </div>
      </div>

      {/* Findings List */}
      <div className="flex-1 overflow-y-auto">
        {findings.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-gray-500 text-xs">No findings detected</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700/50">
            {findings.map((finding, index) => (
              <div
                key={index}
                className="px-4 py-3 hover:bg-gray-700/50 cursor-pointer transition-colors"
                onClick={() =>
                  setExpandedFinding(expandedFinding === index ? null : index)
                }
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-1 ${
                    finding.severity?.toLowerCase() === "critical"
                      ? "bg-red-500"
                      : finding.severity?.toLowerCase() === "medium"
                      ? "bg-yellow-500"
                      : "bg-blue-500"
                  }`}></div>

                  <div className="flex-1 min-w-0">
                    <p className="text-gray-200 text-xs font-medium truncate">
                      {finding.title || "Security Finding"}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      Line {finding.line || "?"}
                    </p>

                    {expandedFinding === index && (
                      <div className="mt-3 pt-3 border-t border-gray-600">
                        {/* Description */}
                        {finding.description && (
                          <div className="mb-3">
                            <p className="text-gray-400 text-xs leading-relaxed">
                              {finding.description}
                            </p>
                          </div>
                        )}

                        {/* Code snippet */}
                        {finding.code && (
                          <div className="mb-3 bg-gray-900/50 rounded p-2">
                            <code className="text-gray-300 text-xs font-mono">
                              {finding.code}
                            </code>
                          </div>
                        )}

                        {/* AI Suggested Fix */}
                        {finding.suggestedFix && (
                          <div className="mb-3">
                            <p className="text-blue-400 text-xs font-semibold mb-2">
                              ✨ AI Suggested Fix
                            </p>
                            <div className="bg-green-900/20 border border-green-500/30 rounded p-2 mb-2">
                              <p className="text-green-300 text-xs font-mono">
                                {finding.suggestedFix}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button className="flex-1 bg-green-600/80 hover:bg-green-600 text-white text-xs py-1 rounded transition-colors">
                                ✓ Accept
                              </button>
                              <button className="flex-1 bg-red-600/40 hover:bg-red-600/60 text-red-300 text-xs py-1 rounded transition-colors">
                                ✕ Reject
                              </button>
                            </div>
                          </div>
                        )}

                        {/* CWE/CVE Info */}
                        {(finding.cwe || finding.cve) && (
                          <div className="text-xs text-gray-500">
                            {finding.cwe && (
                              <p>
                                <span className="text-gray-400">CWE: </span>
                                {finding.cwe}
                              </p>
                            )}
                            {finding.cve && (
                              <p>
                                <span className="text-gray-400">CVE: </span>
                                {finding.cve}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0 mt-1">
                    <span
                      className={`text-lg ${
                        expandedFinding === index ? "rotate-180" : ""
                      } transition-transform`}
                    >
                      ▾
                    </span>
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

export default SecurityPanel;
