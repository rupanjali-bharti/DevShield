import React, { useState } from 'react';
import { auditFile } from '../../services/auditorService';

const AuditPanel = ({ 
  isOpen, 
  onClose, 
  projectName, 
  selectedFile, 
  fileTree, 
  fileContent 
}) => {
  const [auditResults, setAuditResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper to flatten file tree
  const flattenFileTree = (tree, result = []) => {
    tree.forEach(node => {
      if (node.type === 'file') {
        result.push(node);
      } else if (node.children) {
        flattenFileTree(node.children, result);
      }
    });
    return result;
  };

  const auditFullProject = async () => {
    if (!projectName || !fileTree) return;
    
    setLoading(true);
    setError(null);
    setAuditResults([]);
    
    try {
      const files = flattenFileTree(fileTree);
      const results = [];
      
      // Audit each file (limit to first 10 files for demo)
      for (const file of files.slice(0, 10)) {
        try {
          const result = await auditFile(projectName, file.path, '');
          if (result && result.findings && result.findings.length > 0) {
            results.push({
              file: file,
              findings: result.findings,
              summary: result.summary || {}
            });
          }
        } catch (fileError) {
          console.warn(`Failed to audit ${file.path}:`, fileError);
        }
      }
      
      setAuditResults(results);
    } catch (err) {
      setError(err.message || 'Failed to audit project');
    } finally {
      setLoading(false);
    }
  };

  const auditSingleFile = async (file, content) => {
    if (!projectName || !file) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await auditFile(projectName, file.path, content);
      setAuditResults([{
        file: file,
        findings: result.findings || [],
        summary: result.summary || {}
      }]);
    } catch (err) {
      setError(err.message || 'Failed to audit file');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high':
      case 'error':
        return 'text-red-400 bg-red-900/20';
      case 'medium':
      case 'warning':
        return 'text-yellow-400 bg-yellow-900/20';
      case 'low':
      case 'info':
        return 'text-blue-400 bg-blue-900/20';
      default:
        return 'text-gray-400 bg-gray-900/20';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-end z-50">
      <div className="bg-gray-800 w-96 h-full overflow-y-auto border-l border-gray-700">
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-lg">🔍 Security Audit</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-2">
            <button
              onClick={auditFullProject}
              disabled={loading || !projectName}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-2 px-3 rounded text-sm transition-colors"
            >
              {loading ? 'Auditing...' : 'Audit Full Project'}
            </button>
            
            {selectedFile && (
              <button
                onClick={() => auditSingleFile(selectedFile, fileContent)}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 px-3 rounded text-sm transition-colors"
              >
                Audit Current File
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-500 rounded">
              <p className="text-red-400 text-sm">⚠️ {error}</p>
            </div>
          )}

          {loading && (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-400 text-sm">Running security analysis...</p>
            </div>
          )}

          {!loading && auditResults.length === 0 && !error && (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🛡️</div>
              <p className="text-gray-400 text-sm">Click "Audit Full Project" or "Audit Current File" to start</p>
            </div>
          )}

          {!loading && auditResults.length > 0 && (
            <div className="space-y-4">
              <div className="bg-gray-900/50 border border-gray-700 rounded p-3">
                <h3 className="text-white text-sm font-medium mb-2">Audit Summary</h3>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <div className="text-red-400 font-bold">
                      {auditResults.reduce((sum, r) => sum + (r.findings?.filter(f => f.severity === 'high').length || 0), 0)}
                    </div>
                    <div className="text-gray-400">High</div>
                  </div>
                  <div className="text-center">
                    <div className="text-yellow-400 font-bold">
                      {auditResults.reduce((sum, r) => sum + (r.findings?.filter(f => f.severity === 'medium').length || 0), 0)}
                    </div>
                    <div className="text-gray-400">Medium</div>
                  </div>
                  <div className="text-center">
                    <div className="text-blue-400 font-bold">
                      {auditResults.reduce((sum, r) => sum + (r.findings?.filter(f => f.severity === 'low').length || 0), 0)}
                    </div>
                    <div className="text-gray-400">Low</div>
                  </div>
                </div>
              </div>

              {auditResults.map((result, index) => (
                <div key={index} className="bg-gray-900/50 border border-gray-700 rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white text-sm font-medium truncate">
                      📄 {result.file.name}
                    </h4>
                    <span className="text-xs text-gray-400">
                      {result.findings?.length || 0} issue{(result.findings?.length || 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {result.findings?.slice(0, 3).map((finding, fIndex) => (
                      <div 
                        key={fIndex}
                        className={`p-2 rounded text-xs ${getSeverityColor(finding.severity)}`}
                      >
                        <div className="font-medium mb-1">
                          {finding.rule_id || finding.type || 'Security Issue'}
                          {finding.line && (
                            <span className="ml-1 opacity-75">L{finding.line}</span>
                          )}
                        </div>
                        <p className="opacity-90 leading-tight">
                          {finding.message || finding.description || 'No description available'}
                        </p>
                      </div>
                    )) || []}
                    
                    {(result.findings?.length || 0) > 3 && (
                      <p className="text-xs text-gray-500 text-center">
                        ... and {(result.findings?.length || 0) - 3} more
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


export default AuditPanel;
