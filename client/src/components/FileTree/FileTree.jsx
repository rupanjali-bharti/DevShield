import { useState } from "react";

const FileIcon = ({ type, isOpen }) => {
  if (type === "folder") {
    return (
      <span className="mr-2 text-yellow-400">
        {isOpen ? "📂" : "📁"}
      </span>
    );
  }
  return <span className="mr-2 text-blue-400">📄</span>;
};

const FileTreeItem = ({ item, depth = 0, onFileClick, selectedFile }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    if (item.type === "folder") {
      setIsOpen(!isOpen);
    } else {
      onFileClick(item);
    }
  };

  return (
    <div>
      <div
        onClick={handleClick}
        className={`flex items-center py-1 px-2 cursor-pointer rounded text-sm hover:bg-gray-700 transition-colors
          ${selectedFile?.path === item.path ? "bg-gray-700 text-green-400" : "text-gray-300"}
        `}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <FileIcon type={item.type} isOpen={isOpen} />
        <span className="truncate">{item.name}</span>
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
            />
          ))}
        </div>
      )}
    </div>
  );
};

function FileTree({ fileTree, onFileClick, selectedFile }) {
  if (!fileTree || fileTree.length === 0) {
    return (
      <div className="text-gray-500 text-sm p-4">
        No files found
      </div>
    );
  }

  return (
    <div className="py-2">
      {fileTree.map((item, index) => (
        <FileTreeItem
          key={index}
          item={item}
          onFileClick={onFileClick}
          selectedFile={selectedFile}
        />
      ))}
    </div>
  );
}

export default FileTree;