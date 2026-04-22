import { useState } from "react";

function GitTerminalMenu({ projectName }) {
  const [isOpen, setIsOpen] = useState(false);

  const gitOperations = [
    { label: "Git Status", command: "git status" },
    { label: "Git Log", command: "git log --oneline -10" },
    { label: "Git Add All", command: "git add ." },
    { label: "Git Commit", command: "git commit -m 'message'" },
    { label: "Git Push", command: "git push" },
    { label: "Git Pull", command: "git pull" },
    { label: "Git Branch", command: "git branch -a" },
    { label: "Open Terminal", command: "terminal" },
  ];

  const handleOperation = (operation) => {
    if (operation.command === "terminal") {
      // Open system terminal/command prompt for the project
      console.log(`Opening terminal for ${projectName}`);
      // This will be handled by backend to open terminal
      alert(`Terminal would open for ${projectName}\nRun git commands here`);
    } else {
      // Copy command to clipboard and show notification
      navigator.clipboard.writeText(operation.command);
      alert(`Command copied to clipboard:\n${operation.command}`);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Hamburger Menu Button (Three Lines) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex flex-col gap-1 p-2 hover:bg-gray-700 rounded transition-colors"
        title="Git Operations Menu"
      >
        <span className="w-5 h-0.5 bg-gray-300"></span>
        <span className="w-5 h-0.5 bg-gray-300"></span>
        <span className="w-5 h-0.5 bg-gray-300"></span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-gray-700 border border-gray-600 rounded shadow-lg z-50">
          {/* Header */}
          <div className="px-4 py-2 border-b border-gray-600 bg-gray-800">
            <p className="text-gray-300 text-sm font-semibold">Terminal Options</p>
          </div>

          {/* Git Operations List */}
          <div className="max-h-96 overflow-y-auto">
            {gitOperations.map((operation, index) => (
              <button
                key={index}
                onClick={() => handleOperation(operation)}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-600 transition-colors border-b border-gray-700 last:border-b-0 group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-200 text-sm font-medium">
                      {operation.label}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5 group-hover:text-gray-300">
                      {operation.command}
                    </p>
                  </div>
                  {operation.command === "terminal" ? (
                    <span className="text-lg">🖥️</span>
                  ) : (
                    <span className="text-lg">📋</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-gray-800 border-t border-gray-600">
            <p className="text-gray-500 text-xs">
              Non-terminal commands copy to clipboard
            </p>
          </div>
        </div>
      )}

      {/* Close on outside click */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </div>
  );
}

export default GitTerminalMenu;
