import { useState, useCallback, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import FileTreeWithIssues from "../components/FileTree/FileTreeWithIssues";
import CodeEditor from "../components/Editor/CodeEditor";
import SecurityPanel from "../components/SecurityPanel/SecurityPanel";
import Terminal from "../components/Terminal/Terminal";
import { getFileContent, saveFile } from "../services/api";

function Workspace() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [terminalHeight, setTerminalHeight] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const savedTimerRef = useRef(null);
  const dragStartYRef = useRef(0);

  const projectName = state?.projectName;
  const fileTree = state?.fileTree;

  // Mock security findings - replace with real data from your audit
  const [securityFindings] = useState([
    {
      title: "SQL Injection Vulnerability",
      severity: "critical",
      line: 5,
      description: "User input is directly concatenated into SQL query without proper parameterization.",
      code: 'query = "SELECT * FROM users WHERE name=\'" + username + "\'"',
      suggestedFix: 'query = "SELECT * FROM users WHERE name=?" with parameterized query',
      cwe: "CWE-89",
      cve: "CVE-2024-12345"
    },
    {
      title: "Plaintext Password Comparison",
      severity: "critical",
      line: 12,
      description: "Passwords are being compared as plaintext instead of using secure hashing.",
      code: "return pw == stored_hash",
      suggestedFix: "return bcrypt.checkpw(pw.encode(), stored_hash)",
      cwe: "CWE-256"
    },
    {
      title: "Hardcoded API Key",
      severity: "medium",
      line: 3,
      description: "API key is hardcoded in the source code.",
      code: 'API_KEY = "sk_live_abc123def456"',
      suggestedFix: 'API_KEY = os.getenv("API_KEY")',
      cwe: "CWE-798"
    },
  ]);

  // Mock issues map - maps file paths to issue counts
  const [issuesMap] = useState({
    "auth.py": 2,
    "db.py": 1,
    "routes.py": 0,
  });

  // Redirect home if no project — using useEffect to avoid hook order violation
  useEffect(() => {
    if (!projectName || !fileTree) {
      navigate("/");
    }
  }, [projectName, fileTree, navigate]);

  const handleFileClick = useCallback(
    async (file) => {
      if (file.type === "folder") return;
      try {
        const content = await getFileContent(projectName, file.path);
        setSelectedFile(file);
        setFileContent(content);
        setSaved(false);
      } catch (error) {
        console.error("Failed to read file:", error);
      }
    },
    [projectName]
  );

  const handleEditorChange = useCallback((value) => {
    setFileContent(value);
    setSaved(false);
  }, []);

  const handleSave = useCallback(async () => {
    if (!selectedFile) return;
    setSaving(true);
    try {
      await saveFile(projectName, selectedFile.path, fileContent);
      setSaved(true);

      // Clear any existing timer before setting a new one
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current);
      }
      savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setSaving(false);
    }
  }, [selectedFile, fileContent, projectName]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
      // Toggle terminal with Ctrl+`
      if (e.ctrlKey && e.key === "`") {
        e.preventDefault();
        setIsTerminalOpen((prev) => !prev);
      }
    },
    [handleSave]
  );

  // Terminal resize handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragStartYRef.current = e.clientY;
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !isTerminalOpen) return;
      const delta = dragStartYRef.current - e.clientY;
      const newHeight = terminalHeight + delta;
      if (newHeight > 80 && newHeight < 800) {
        setTerminalHeight(newHeight);
        dragStartYRef.current = e.clientY;
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isTerminalOpen, terminalHeight]);

  // Cleanup the saved timer on unmount to prevent state updates on unmounted component
  useEffect(() => {
    return () => {
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current);
      }
    };
  }, []);

  // Render nothing while redirecting
  if (!projectName || !fileTree) {
    return null;
  }

  return (
    <div
      className="h-screen bg-gray-900 flex flex-col"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Top Navbar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-white font-bold">
            Dev<span className="text-green-400">Shield</span>
          </h1>
          <span className="text-gray-500 text-sm">|</span>
          <span className="text-gray-300 text-sm">{projectName}</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Terminal Toggle Button */}
          <button
            onClick={() => setIsTerminalOpen(!isTerminalOpen)}
            className={`text-white text-xs px-3 py-1.5 rounded transition-colors ${
              isTerminalOpen
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
            title="Toggle Terminal (Ctrl+`)"
          >
            Terminal {isTerminalOpen ? "✕" : "⌄"}
          </button>

          {/* Save status */}
          {saving && (
            <span className="text-yellow-400 text-xs">Saving...</span>
          )}
          {saved && (
            <span className="text-green-400 text-xs">Saved ✓</span>
          )}

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={!selectedFile || saving}
            className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded transition-colors"
          >
            Save (Ctrl+S)
          </button>

          {/* Home button */}
          <button
            onClick={() => navigate("/")}
            className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1.5 rounded transition-colors"
          >
            ← Home
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden flex-col">

        {/* Editor and Panels Container */}
        <div className="flex flex-1 overflow-hidden">

          {/* Left Sidebar — File Tree */}
          <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-700">
              <p className="text-gray-400 text-xs uppercase tracking-wider">
                Explorer
              </p>
              <p className="text-gray-300 text-sm font-medium mt-1 truncate">
                {projectName}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              <FileTreeWithIssues
                fileTree={fileTree}
                onFileClick={handleFileClick}
                selectedFile={selectedFile}
                issuesMap={issuesMap}
              />
            </div>
          </div>

          {/* Center — Code Editor */}
          <div className="flex-1 overflow-hidden">
            <CodeEditor
              file={selectedFile}
              content={fileContent}
              onChange={handleEditorChange}
              projectName={projectName}
            />
          </div>

          {/* Right Sidebar — Security Findings */}
          <div className="w-80 bg-gray-800 border-l border-gray-700 overflow-hidden flex flex-col">
            <SecurityPanel findings={securityFindings} />
          </div>

        </div>

        {/* Terminal — Collapsible at Bottom */}
        {isTerminalOpen && (
          <div className="bg-gray-900 border-t border-gray-700 flex flex-col">
            {/* Terminal Resize Handle */}
            <div
              onMouseDown={handleMouseDown}
              className={`h-1 bg-gray-700 hover:bg-blue-600 cursor-row-resize transition-colors ${
                isDragging ? "bg-blue-600" : ""
              }`}
            />

            {/* Terminal Content */}
            <div style={{ height: terminalHeight > 0 ? `${terminalHeight}px` : "240px" }} className="flex flex-col overflow-hidden">
              <Terminal
                projectName={projectName}
                isOpen={isTerminalOpen}
                onToggle={() => setIsTerminalOpen(false)}
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Workspace;