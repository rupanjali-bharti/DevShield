import { useState } from "react";

const FileIcon = ({ type, isOpen, issueCount }) => {
  if (type === "folder") {
    return (
      <span className="mr-2 text-yellow-400">
        {isOpen ? "📂" : "📁"}
      </span>
    );
  }
  
  if (issueCount && issueCount > 0) {
    return (
      <span className="mr-2 text-red-400">⚠</span>
    );
  }
  return <span className="mr-2 text-blue-400">📄</span>;
};

const getIssueBadgeColor = (count) => {
  if (!count || count === 0) return null;
  if (count >= 5) return "bg-red-600 text-white";
  if (count >= 3) return "bg-orange-600 text-white";
  return "bg-yellow-600 text-white";
};

const FileTreeItem = ({ item, depth = 0, onFileClick, selectedFile, issuesMap = {} }) => {
  const [isOpen, setIsOpen] = useState(false);
  const issueCount = issuesMap[item.path] || 0;

  const handleClick = () => {
    if (item.type === "folder") {
      setIsOpen(!isOpen);
    } else {
      onFileClick(item);
    }
  };

  const badgeColor = getIssueBadgeColor(issueCount);

  return (
    <div>
      <div
        onClick={handleClick}
        className={`flex items-center py-1.5 px-2 cursor-pointer rounded text-sm hover:bg-gray-700 transition-colors
          ${selectedFile?.path === item.path ? "bg-gray-700 text-green-400" : "text-gray-300"}
        `}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <FileIcon type={item.type} isOpen={isOpen} issueCount={issueCount} />
        <span className="truncate flex-1">{item.name}</span>
        
        {issueCount > 0 && badgeColor && (
          <span className={`${badgeColor} text-xs px-1.5 py-0.5 rounded-full font-medium ml-2 flex-shrink-0`}>
            {issueCount}
          </span>
        )}
      </div>

      {item.type === "folder" && isOpen && item.children && (
        <div>
          {item.children.map((child, index) => (
            <FileTreeItem
              key={index}
              item={child}
              depth={depth + 1}
              onFileClick={onFileClick}
              selectedFile={selectedFile}
              issuesMap={issuesMap}
            />
          ))}
        </div>
      )}
    </div>
  );
};

function FileTreeWithIssues({ fileTree, onFileClick, selectedFile, issuesMap = {} }) {
  if (!fileTree || fileTree.length === 0) {
    return (
      <div className="text-gray-500 text-sm p-4">
        No files found
      </div>
    );
  }

  // Calculate total issues
  const totalIssues = Object.values(issuesMap).reduce((sum, count) => sum + count, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Files header with issue summary */}
      <div className="px-3 py-2 border-b border-gray-700">
        <p className="text-gray-400 text-xs uppercase tracking-wider">
          Files
        </p>
        {totalIssues > 0 && (
          <p className="text-red-400 text-xs mt-1">
            ⚠ {totalIssues} issue{totalIssues !== 1 ? "s" : ""} found
          </p>
        )}
      </div>

      {/* Files list */}
      <div className="flex-1 overflow-y-auto py-2">
        {fileTree.map((item, index) => (
          <FileTreeItem
            key={index}
            item={item}
            onFileClick={onFileClick}
            selectedFile={selectedFile}
            issuesMap={issuesMap}
          />
        ))}
      </div>
    </div>
  );
}

export default FileTreeWithIssues;
