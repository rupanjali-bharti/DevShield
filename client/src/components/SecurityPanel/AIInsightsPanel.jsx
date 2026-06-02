import React from 'react';

const AIInsightsPanel = ({ findings = [], loading = false, error = null }) => {
  const highSeverityFindings = findings.filter(f => 
    f.severity?.toLowerCase() === 'high' || f.severity?.toLowerCase() === 'error'
  );
  
  const mediumSeverityFindings = findings.filter(f => 
    f.severity?.toLowerCase() === 'medium' || f.severity?.toLowerCase() === 'warning'
  );

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high':
      case 'error':
        return 'border-red-500 text-red-400';
      case 'medium':
      case 'warning':
        return 'border-yellow-500 text-yellow-400';
      case 'low':
      case 'info':
        return 'border-blue-500 text-blue-400';
      default:
        return 'border-gray-500 text-gray-400';
    }
  };

  const generateAIInsight = (findings) => {
    if (findings.length === 0) {
      return "✅ No security vulnerabilities detected. Your code appears to be following security best practices.";
    }

    const highCount = highSeverityFindings.length;
    const mediumCount = mediumSeverityFindings.length;
    const totalCount = findings.length;

    let insight = `🔍 Detected ${totalCount} potential security issue${totalCount !== 1 ? 's' : ''}:\n\n`;

    if (highCount > 0) {
      insight += `🔴 **${highCount} High-severity** issue${highCount !== 1 ? 's' : ''} requiring immediate attention\n`;
    }

    if (mediumCount > 0) {
      insight += `🟡 **${mediumCount} Medium-severity** issue${mediumCount !== 1 ? 's' : ''} should be addressed\n`;
    }

    const lowCount = totalCount - highCount - mediumCount;
    if (lowCount > 0) {
      insight += `🔵 **${lowCount} Low-severity** informational finding${lowCount !== 1 ? 's' : ''}\n`;
    }

    insight += "\n**Recommendations:**\n";

    if (highCount > 0) {
      insight += "• Prioritize fixing high-severity vulnerabilities first\n";
      insight += "• Review authentication and authorization logic\n";
      insight += "• Validate all input sources\n";
    }

    if (mediumCount > 0) {
      insight += "• Implement proper error handling\n";
      insight += "• Add input sanitization\n";
      insight += "• Review cryptographic implementations\n";
    }

    return insight;
  };

  return (
    <div className="bg-gray-800 border-l border-gray-700 flex flex-col overflow-hidden" style={{ width: '300px' }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700">
        <h3 className="text-gray-300 font-medium text-sm flex items-center gap-2">
          🤖 AI Security Insights
          {loading && (
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          )}
        </h3>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="p-4 bg-red-900/20 border-l-4 border-red-500 mx-4 mt-4 rounded">
            <p className="text-red-400 text-sm">
              ⚠️ {error}
            </p>
          </div>
        )}

        {loading && !error && (
          <div className="p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-700 rounded mb-3"></div>
              <div className="h-3 bg-gray-700 rounded mb-2"></div>
              <div className="h-3 bg-gray-700 rounded mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-3/4"></div>
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="p-4 space-y-4">
            {/* AI Summary */}
            <div className="bg-gray-900/50 border border-gray-700 rounded p-3">
              <h4 className="text-gray-300 text-xs font-medium mb-2 uppercase tracking-wider">
                Summary
              </h4>
              <div className="text-gray-400 text-sm whitespace-pre-line leading-relaxed">
                {generateAIInsight(findings)}
              </div>
            </div>

            {/* Detailed Findings */}
            {findings.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-gray-300 text-xs font-medium uppercase tracking-wider">
                  Detailed Issues
                </h4>
                
                {findings.slice(0, 5).map((finding, index) => (
                  <div 
                    key={finding.id || index}
                    className={`border-l-3 pl-3 py-2 ${getSeverityColor(finding.severity).replace('text-', 'border-').split(' ')[0]}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h5 className={`text-xs font-medium ${getSeverityColor(finding.severity).split(' ')[1]}`}>
                        {finding.rule_id || finding.type || 'Security Issue'}
                      </h5>
                      {finding.line && (
                        <span className="text-xs text-gray-500">L{finding.line}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 leading-tight">
                      {finding.message || finding.description || 'No description available'}
                    </p>
                    
                    {finding.extra?.fix && (
                      <div className="mt-2 p-2 bg-green-900/20 border border-green-700/30 rounded">
                        <p className="text-xs text-green-400 font-medium mb-1">💡 Suggested Fix:</p>
                        <p className="text-xs text-green-300">{finding.extra.fix}</p>
                      </div>
                    )}
                  </div>
                ))}

                {findings.length > 5 && (
                  <p className="text-xs text-gray-500 text-center">
                    ... and {findings.length - 5} more issue{findings.length - 5 !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )}

            {/* Security Score */}
            <div className="bg-gray-900/50 border border-gray-700 rounded p-3">
              <h4 className="text-gray-300 text-xs font-medium mb-2 uppercase tracking-wider">
                Security Score
              </h4>
              <div className="flex items-center gap-2">
                {(() => {
                  const score = Math.max(0, 100 - (highSeverityFindings.length * 20) - (mediumSeverityFindings.length * 10) - ((findings.length - highSeverityFindings.length - mediumSeverityFindings.length) * 5));
                  const color = score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400';
                  
                  return (
                    <>
                      <span className={`text-2xl font-bold ${color}`}>{score}</span>
                      <span className="text-gray-400 text-sm">/100</span>
                      <div className="flex-1 bg-gray-700 rounded-full h-2 ml-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${score}%` }}
                        ></div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsightsPanel;
