import React, { useRef, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';


const DiffEditor = ({ 
  file, 
  content, 
  findings = [], 
  onAcceptPatch, 
  patchLoading = false,
  onChange 
}) => {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const [decorations, setDecorations] = useState([]);

  // Helper functions - MOVED TO TOP
  const getSeverityClassName = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high':
      case 'error':
        return 'security-error-line';
      case 'medium':
      case 'warning':
        return 'security-warning-line';
      case 'low':
      case 'info':
        return 'security-info-line';
      default:
        return 'security-default-line';
    }
  };

  const getSeverityMinimapColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high':
      case 'error':
        return '#ff4444';
      case 'medium':
      case 'warning':
        return '#ffaa00';
      case 'low':
      case 'info':
        return '#4488ff';
      default:
        return '#888888';
    }
  };

  const getLanguageFromFile = (filename) => {
    if (!filename) return 'plaintext';
    
    const ext = filename.split('.').pop()?.toLowerCase();
    const languageMap = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      json: 'json',
      html: 'html',
      css: 'css',
      scss: 'scss',
      md: 'markdown',
      yml: 'yaml',
      yaml: 'yaml',
      xml: 'xml',
      sql: 'sql',
      sh: 'shell',
      bat: 'bat',
      dockerfile: 'dockerfile',
    };

    return languageMap[ext] || 'plaintext';
  };

  // Handle editor mount
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  // Update decorations when findings change
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !findings.length) {
      return;
    }

    const newDecorations = findings.map(finding => {
      const line = finding.line || 1;
      const startColumn = finding.start_col || 1;
      const endColumn = finding.end_col || 1000;

      return {
        range: new monacoRef.current.Range(line, startColumn, line, endColumn),
        options: {
          className: getSeverityClassName(finding.severity),
          hoverMessage: {
            value: `**${finding.rule_id || 'Security Issue'}**\n\n${finding.message || finding.description || 'No description available'}`
          },
          minimap: {
            color: getSeverityMinimapColor(finding.severity),
            position: monacoRef.current.editor.MinimapPosition.Inline
          },
          overviewRuler: {
            color: getSeverityMinimapColor(finding.severity),
            position: monacoRef.current.editor.OverviewRulerLane.Right
          }
        }
      };
    });

    const decorationIds = editorRef.current.deltaDecorations(decorations, newDecorations);
    setDecorations(decorationIds);
  }, [findings, decorations, getSeverityClassName, getSeverityMinimapColor]);

  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900 text-gray-400">
        <div className="text-center">
          <div className="text-4xl mb-4">📝</div>
          <p>Select a file to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-900">
      {/* File Tab */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-gray-300 text-sm">
            📄 {file.name}
          </span>
          {findings.length > 0 && (
            <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded">
              {findings.length} issue{findings.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        
        {findings.length > 0 && onAcceptPatch && (
          <button
            onClick={onAcceptPatch}
            disabled={patchLoading}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded transition-colors"
          >
            {patchLoading ? 'Applying...' : 'Apply Patch'}
          </button>
        )}
      </div>

      {/* Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          language={getLanguageFromFile(file.name)}
          value={content}
          onChange={onChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            fontSize: 14,
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            lineNumbers: 'on',
            glyphMargin: true,
            folding: true,
            lineDecorationsWidth: 10,
            lineNumbersMinChars: 3,
            renderWhitespace: 'selection',
            automaticLayout: true,
          }}
        />
      </div>

      {/* Add CSS for security highlighting */}
      <style jsx>{`
        :global(.security-error-line) {
          background-color: rgba(255, 68, 68, 0.15);
          border-left: 3px solid #ff4444;
        }
        :global(.security-warning-line) {
          background-color: rgba(255, 170, 0, 0.15);
          border-left: 3px solid #ffaa00;
        }
        :global(.security-info-line) {
          background-color: rgba(68, 136, 255, 0.15);
          border-left: 3px solid #4488ff;
        }
        :global(.security-default-line) {
          background-color: rgba(136, 136, 136, 0.15);
          border-left: 3px solid #888888;
        }
      `}</style>
    </div>
  );
};


export default DiffEditor;
