import { useState, useRef, useEffect } from "react";
import { executeTerminalCommand } from "../../services/api";

function Terminal({ projectName, isOpen, onToggle }) {
  const [commands, setCommands] = useState([
    { type: "info", text: "Terminal Ready" },
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

    // Add command to history
    setCommands((prev) => [
      ...prev,
      { type: "command", text: `$ ${inputValue}` },
    ]);

    // Add to command history
    setCommandHistory((prev) => [...prev, inputValue]);
    setHistoryIndex(-1);

    setIsLoading(true);

    try {
      const result = await executeTerminalCommand(projectName, inputValue);

      if (result.success) {
        setCommands((prev) => [
          ...prev,
          { type: "output", text: result.output || "Command executed" },
        ]);
      } else {
        setCommands((prev) => [
          ...prev,
          { type: "error", text: result.error || "Command failed" },
          { type: "output", text: result.output || "" },
        ]);
      }
    } catch (error) {
      setCommands((prev) => [
        ...prev,
        { type: "error", text: `Error: ${error.message}` },
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
      setIsLoading(false);
      setInputValue("");
    }
  };

  const handleClearTerminal = () => {
    setCommands([{ type: "info", text: "Terminal Cleared" }]);
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
          >
            Clear
          </button>
          <button
            onClick={onToggle}
            className="text-gray-400 hover:text-gray-200 text-xs px-2 py-1 rounded hover:bg-gray-700 transition-colors"
          >
            ✕
          </button>
        </div>
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
          placeholder="Enter command (git, npm, python, etc.)"
          className="flex-1 bg-gray-800 text-gray-300 border-none outline-none font-mono text-sm placeholder-gray-600 disabled:opacity-50"
          autoComplete="off"
        />
      </form>

      {/* Help Text */}
      <div className="bg-gray-800 px-4 py-1 border-t border-gray-700">
        <p className="text-gray-500 text-xs">
          Try: git status • npm run dev • python script.py
        </p>
      </div>
    </div>
  );
}

export default Terminal;
