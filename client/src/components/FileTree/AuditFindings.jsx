import React from 'react';


const AuditFindings = ({ findings = [], onFindingClick }) => {
  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high':
      case 'error':
        return 'text-red-400 bg-red-900/30';
      case 'medium':
      case 'warning':
        return 'text-yellow-400 bg-yellow-900/30';
      case 'low':
      case 'info':
        return 'text-blue-400 bg-blue-900/30';
      default:
        return 'text-gray-400 bg-gray-900/30';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high':
      case 'error':
        return '🔴';
      case 'medium':
      case 'warning':
        return '🟡';
      case 'low':
      case 'info':
        return '🔵';
      default:
        return '⚪';
    }
  };

  if (findings.length === 0) {
    return (
      <div className="px-3 py-4">
        <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">
          Security Issues
        </p>
        <p className="text-gray-500 text-xs">
          No issues found
        </p>
      </div>
    );
  }

  return (
    <div className="px-3 py-4">
      <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">
        Security Issues ({findings.length})
      </p>
      
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {findings.map((finding, index) => (
          <div
            key={finding.id || index}
            className={`p-2 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity ${
              getSeverityColor(finding.severity)
            }`}
            onClick={() => onFindingClick && onFindingClick(finding)}
            title={finding.message || finding.description}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center gap-1">
                {getSeverityIcon(finding.severity)}
                <span className="font-medium truncate">
                  {finding.rule_id || finding.type || 'Security Issue'}
                </span>
              </span>
              {finding.line && (
                <span className="text-xs opacity-75">
                  L{finding.line}
                </span>
              )}
            </div>
            
            <p className="text-xs opacity-90 leading-tight line-clamp-2">
              {finding.message || finding.description || 'No description available'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};



export default AuditFindings;
