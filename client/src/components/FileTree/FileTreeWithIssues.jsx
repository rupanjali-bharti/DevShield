import React, { useState } from 'react';


const FileTreeWithIssues = ({ fileTree, onFileClick, selectedFile, issuesMap = {} }) => {
  const [expandedFolders, setExpandedFolders] = useState(new Set(['src'])); // Default expand src

  const toggleFolder = (path) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFileTreeNode = (node, depth = 0) => {
    const { name, path, type, children } = node;
    const isExpanded = expandedFolders.has(path);
    const isSelected = selectedFile?.path === path;
    const issueCount = issuesMap[path] || 0;
    const hasIssues = issueCount > 0;

    return (
      <div key={path}>
        <div
          className={`flex items-center px-2 py-1 cursor-pointer hover:bg-gray-700 transition-colors ${
            isSelected ? 'bg-blue-600' : ''
          }`}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => {
            if (type === 'folder') {
              toggleFolder(path);
            } else {
              onFileClick(node);
            }
          }}
        >
          {/* Icon */}
          <span className="mr-2 text-sm">
            {type === 'folder' ? (
              isExpanded ? '📂' : '📁'
            ) : (
              getFileIcon(name)
            )}
          </span>

          {/* Name */}
          <span className={`text-sm truncate flex-1 ${
            type === 'folder' ? 'text-gray-200' : 'text-gray-300'
          }`}>
            {name}
          </span>

          {/* Issue Badge */}
          {hasIssues && (
            <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[16px] text-center">
              {issueCount}
            </span>
          )}
        </div>

        {/* Children */}
        {type === 'folder' && isExpanded && children && children.length > 0 && (
          <div>
            {children.map((child) => renderFileTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!fileTree || fileTree.length === 0) {
    return (
      <div className="p-3 text-gray-400 text-sm">
        No files found
      </div>
    );
  }

  return (
    <div className="text-sm">
      {fileTree.map((node) => renderFileTreeNode(node))}
    </div>
  );
};

// Helper function to get file icons
const getFileIcon = (filename) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  const iconMap = {
    js: '🟨',
    jsx: '⚛️',
    ts: '🔷',
    tsx: '⚛️',
    py: '🐍',
    json: '📄',
    html: '🌐',
    css: '🎨',
    md: '📝',
    txt: '📄',
    yml: '⚙️',
    yaml: '⚙️',
    env: '🔧',
    gitignore: '🚫',
    dockerfile: '🐳',
    sql: '🗃️',
    sh: '📜',
    bat: '📜',
  };

  return iconMap[ext] || '📄';
};


export default FileTreeWithIssues;
