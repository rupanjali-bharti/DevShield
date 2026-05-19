import { useState, useRef, useEffect } from "react";
import { executeTerminalCommand } from "../../services/api";

function Terminal({ projectName, isOpen, onToggle }) {
  const [commands, setCommands] = useState([
    { type: "info", text: "Terminal Ready - Enter git commands or type 'help' for commands" },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const terminalEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [commands]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleExecuteCommand = async (e) => {
    e.preventDefault();

    if (!inputValue.trim()) return;

    const command = inputValue.trim();

    // Add command to history
    setCommands((prev) => [
      ...prev,
      { type: "command", text: `$ ${command}` },
    ]);

    // Add to command history
    setCommandHistory((prev) => [...prev, command]);
    setHistoryIndex(-1);

    // Handle built-in help command
    if (command === "help") {
      setCommands((prev) => [
        ...prev,
        { type: "output", text: `
DevShield Git Terminal Commands:

📝 CHECK STATUS:
  git status        - View changes not staged
  git log --oneline - View commit history
  git diff          - Show changes before staging
  
🔧 MAKE CHANGES:
  git add .         - Stage all changes
  git add <file>    - Stage specific file
  
✅ COMMIT:
  git commit -m "msg"  - Commit staged changes

🚀 PUSH TO REPO:
  git push origin main           - Push to main branch
  git push origin <branch-name>  - Push to other branch
  
🌿 BRANCHES:
  git branch                  - List branches
  git branch <new-branch>     - Create branch
  git checkout <branch-name>  - Switch branch
  
💡 QUICK WORKFLOW:
  1. Make changes in editor
  2. git status
  3. git add .
  4. git commit -m "Your message"
  5. git push origin main
  
🆘 TROUBLESHOOTING:
  git config user.name "Your Name"     - Set git user
  git config user.email "your@email"   - Set git email
  git remote -v                        - Check remote URL
        ` },
      ]);
      setInputValue("");
      return;
    }

    setIsLoading(true);

    try {
      const result = await executeTerminalCommand(projectName, command);

      if (result.success) {
        const output = result.output?.trim() || "✓ Command executed";
        setCommands((prev) => [
          ...prev,
          { type: "output", text: output },
        ]);
      } else {
        const errorMsg = result.error || "Command failed";
        setCommands((prev) => {
          const newCommands = [
            ...prev,
            { type: "error", text: `✗ ${errorMsg}` },
          ];

          if (result.details) {
            newCommands.push({ type: "error", text: result.details });
          }

          if (result.output?.trim()) {
            newCommands.push({ type: "output", text: result.output });
          }

          return newCommands;
        });
      }
    } catch (error) {
      setCommands((prev) => [
        ...prev,
        { type: "error", text: `✗ ${error.message}` },
      ]);
    } finally {
      setIsLoading(false);
      setInputValue("");
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInputValue(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInputValue(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputValue("");
      }
    }
  };

  const handleClearTerminal = () => {
    setCommands([{ type: "info", text: "Terminal Cleared" }]);
  };

  const addQuickCommand = (cmd) => {
    setInputValue(cmd);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  if (!isOpen) return null;

  return (
    <div className="h-full bg-gray-900 border-t border-gray-700 flex flex-col">
      {/* Terminal Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-gray-300 text-sm font-medium">Terminal</span>
          <span className="text-gray-600 text-xs">— {projectName}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleClearTerminal}
            className="text-gray-400 hover:text-gray-200 text-xs px-2 py-1 rounded hover:bg-gray-700 transition-colors"
            title="Clear terminal"
          >
            Clear
          </button>
          <button
            onClick={onToggle}
            className="text-gray-400 hover:text-gray-200 text-xs px-2 py-1 rounded hover:bg-gray-700 transition-colors"
            title="Close terminal"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Quick Commands */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex gap-2 flex-wrap text-xs">
        <button
          onClick={() => addQuickCommand("git status")}
          className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded transition-colors"
          title="Check current status"
        >
          📊 Status
        </button>
        <button
          onClick={() => addQuickCommand("git add .")}
          className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded transition-colors"
          title="Stage all changes"
        >
          ➕ Stage All
        </button>
        <button
          onClick={() => addQuickCommand("git log --oneline")}
          className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded transition-colors"
          title="View commit history"
        >
          📜 Log
        </button>
        <button
          onClick={() => addQuickCommand("git commit -m ")}
          className="bg-blue-700 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors"
          title="Commit changes"
        >
          ✓ Commit
        </button>
        <button
          onClick={() => addQuickCommand("git push origin main")}
          className="bg-green-700 hover:bg-green-600 text-white px-2 py-1 rounded transition-colors"
          title="Push to repository"
        >
          🚀 Push
        </button>
        <button
          onClick={() => addQuickCommand("help")}
          className="bg-purple-700 hover:bg-purple-600 text-white px-2 py-1 rounded transition-colors ml-auto"
          title="Show all commands"
        >
          ❓ Help
        </button>
      </div>

      {/* Terminal Output */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-1">
        {commands.map((cmd, index) => (
          <div
            key={index}
            className={`${
              cmd.type === "command"
                ? "text-blue-400"
                : cmd.type === "error"
                ? "text-red-400"
                : cmd.type === "info"
                ? "text-yellow-400"
                : "text-gray-300"
            } whitespace-pre-wrap break-words`}
          >
            {cmd.text}
          </div>
        ))}
        {isLoading && (
          <div className="text-gray-500">
            <span className="inline-block animate-pulse">▌</span>
          </div>
        )}
        <div ref={terminalEndRef} />
      </div>

      {/* Terminal Input */}
      <form
        onSubmit={handleExecuteCommand}
        className="bg-gray-900 border-t border-gray-700 px-4 py-2 flex items-center gap-2"
      >
        <span className="text-green-400 font-mono">$</span>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleInputKeyDown}
          disabled={isLoading}
          placeholder="Type command or 'help' for options"
          className="flex-1 bg-gray-800 text-gray-300 border-none outline-none font-mono text-sm placeholder-gray-600 disabled:opacity-50"
          autoComplete="off"
        />
      </form>

      {/* Status Line */}
      <div className="bg-gray-800 px-4 py-1 border-t border-gray-700">
        <p className="text-gray-500 text-xs">
          💡 Tip: Use arrow keys ⬆/⬇ to navigate command history • Type 'help' for all commands
        </p>
      </div>
    </div>
  );
}

export default Terminal;
