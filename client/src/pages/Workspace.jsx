import { useState, useCallback, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import FileTreeWithIssues from "../components/FileTree/FileTreeWithIssues";
import AuditFindings from "../components/FileTree/AuditFindings";
import DiffEditor from "../components/Editor/DiffEditor";
import AIInsightsPanel from "../components/SecurityPanel/AIInsightsPanel";
import Terminal from "../components/Terminal/Terminal";
import AuditPanel from "../components/AuditPanel/AuditPanel";
import { getFileContent, saveFile } from "../services/api";
import { auditFile, formatFindings } from "../services/auditorService.js";

function Workspace() {
  const { state } = useLocation();
  const navigate = useNavigate();
  
  // State management
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [terminalHeight, setTerminalHeight] = useState(240);
  const [isDragging, setIsDragging] = useState(false);
  const [isAuditPanelOpen, setIsAuditPanelOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Refs
  const savedTimerRef = useRef(null);
  const dragStartYRef = useRef(0);

  // Extract and validate navigation state
  const projectName = state?.projectName || null;
  const initialFileTree = state?.fileTree || null;
  
  // Generate fallback file tree for testing/demo
  const generateFallbackFileTree = () => {
    return [
      {
        name: "src",
        path: "src",
        type: "folder",
        children: [
          { name: "App.jsx", path: "src/App.jsx", type: "file" },
          { name: "main.jsx", path: "src/main.jsx", type: "file" },
          { name: "index.css", path: "src/index.css", type: "file" },
          {
            name: "components",
            path: "src/components",
            type: "folder",
            children: [
              { name: "Header.jsx", path: "src/components/Header.jsx", type: "file" },
              { name: "Footer.jsx", path: "src/components/Footer.jsx", type: "file" },
            ],
          },
        ],
      },
      {
        name: "public",
        path: "public",
        type: "folder",
        children: [
          { name: "index.html", path: "public/index.html", type: "file" },
        ],
      },
      { name: "package.json", path: "package.json", type: "file" },
      { name: "README.md", path: "README.md", type: "file" },
    ];
  };

  // State for file tree - initialize with proper logic
  const [fileTree] = useState(() => {
    // Use provided file tree or generate sample
    if (initialFileTree && Array.isArray(initialFileTree) && initialFileTree.length > 0) {
      return initialFileTree;
    }
    return generateFallbackFileTree();
  });

  // Security findings state
  const [securityFindings, setSecurityFindings] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState(null);

  // Issues map for file tree display
  const [issuesMap] = useState({
    "auth.py": 0,
    "db.py": 0,
    "routes.py": 0,
  });

  // Debug logging
  useEffect(() => {
    console.log('Workspace Debug:', {
      projectName,
      hasFileTree: !!fileTree,
      fileTreeLength: fileTree?.length,
      state,
      initialFileTree
    });
  }, [projectName, fileTree, state, initialFileTree]);

  // Redirect validation - FIXED: Remove setState from useEffect
  useEffect(() => {
    if (!projectName) {
      console.warn('No project name provided, redirecting to home');
      navigate("/", { replace: true });
      return;
    }
    
    // Only log warning, don't set error state in useEffect
    if (!fileTree || fileTree.length === 0) {
      console.warn('No file tree available - using fallback');
    }
  }, [projectName, fileTree, navigate]);

  // Set error state separately when needed (not in useEffect)
  const hasFileTreeError = !fileTree || fileTree.length === 0;

  // Perform audit on file
  const handleAuditFile = useCallback(
    async (project, filePath, code) => {
      if (!project || !filePath) {
        console.warn('Missing project or file path for audit');
        return;
      }

      setAuditLoading(true);
      setAuditError(null);
      
      try {
        const result = await auditFile(project, filePath, code);
        if (result && typeof result === 'object') {
          const formattedFindings = formatFindings(result);
          setSecurityFindings(Array.isArray(formattedFindings) ? formattedFindings : []);
        } else {
          setSecurityFindings([]);
        }
      } catch (error) {
        const errorMessage = error?.message || 'Unknown audit error';
        setAuditError(errorMessage);
        console.error("Audit failed:", error);
        // Keep previous findings on error instead of clearing
      } finally {
        setAuditLoading(false);
      }
    },
    []
  );

  // Handle file selection
  const handleFileClick = useCallback(
    async (file) => {
      if (!file || file.type === "folder") return;
      
      if (!projectName) {
        console.error('No project name available');
        setError('Project not loaded properly');
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const content = await getFileContent(projectName, file.path);
        setSelectedFile(file);
        setFileContent(typeof content === 'string' ? content : '');
        setSaved(false);
        
        // Auto-audit the file with content
        if (content) {
          await handleAuditFile(projectName, file.path, content);
        }
      } catch (error) {
        const errorMessage = error?.message || 'Failed to load file';
        console.error("Failed to read file:", error);
        setError(`Failed to load ${file.name}: ${errorMessage}`);
        setSelectedFile(null);
        setFileContent('');
      } finally {
        setLoading(false);
      }
    },
    [projectName, handleAuditFile]
  );

  // Handle patch acceptance
  const handleAcceptPatch = useCallback(async () => {
    if (!selectedFile || !projectName) {
      console.warn('Cannot accept patch: missing file or project');
      return;
    }
    
    console.log("Patch accepted for:", selectedFile.path);
    setSaving(true);
    setError(null);
    
    try {
      await saveFile(projectName, selectedFile.path, fileContent);
      setSaved(true);
      
      // Clear existing timer
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current);
      }
      
      // Set new timer
      savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      const errorMessage = error?.message || 'Failed to save file';
      console.error("Failed to save:", error);
      setError(`Save failed: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  }, [selectedFile, fileContent, projectName]);

  // Handle manual save
  const handleSave = useCallback(async () => {
    if (!selectedFile || !projectName) return;
    
    setSaving(true);
    setError(null);
    
    try {
      await saveFile(projectName, selectedFile.path, fileContent);
      setSaved(true);

      // Clear existing timer
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current);
      }
      
      // Set new timer
      savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      const errorMessage = error?.message || 'Failed to save file';
      console.error("Failed to save:", error);
      setError(`Save failed: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  }, [selectedFile, fileContent, projectName]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e) => {
      // Ctrl+S to save
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
      // Ctrl+` to toggle terminal
      if (e.ctrlKey && e.key === "`") {
        e.preventDefault();
        setIsTerminalOpen((prev) => !prev);
      }
    },
    [handleSave]
  );

  // Terminal resize handlers
  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    dragStartYRef.current = e.clientY;
    e.preventDefault(); // Prevent text selection
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !isTerminalOpen) return;
      
      const delta = dragStartYRef.current - e.clientY;
      const newHeight = Math.max(80, Math.min(800, terminalHeight + delta));
      
      if (newHeight !== terminalHeight) {
        setTerminalHeight(newHeight);
        dragStartYRef.current = e.clientY;
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "row-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      if (isDragging) {
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };
  }, [isDragging, isTerminalOpen, terminalHeight]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current);
      }
    };
  }, []);

  // Loading state
  if (!projectName) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
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
          {/* Error display */}
          {error && (
            <span className="text-red-400 text-xs max-w-xs truncate" title={error}>
              ⚠️ {error}
            </span>
          )}

          {/* Audit Panel Toggle Button */}
          <button
            onClick={() => setIsAuditPanelOpen(!isAuditPanelOpen)}
            className={`text-white text-xs px-3 py-1.5 rounded transition-colors ${
              isAuditPanelOpen
                ? "bg-purple-600 hover:bg-purple-700"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
            title="Toggle Audit Panel"
          >
            🔍 Audit {isAuditPanelOpen ? "✕" : ""}
          </button>

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

          {/* Status indicators */}
          {loading && (
            <span className="text-blue-400 text-xs">Loading...</span>
          )}
          {saving && (
            <span className="text-yellow-400 text-xs">Saving...</span>
          )}
          {saved && (
            <span className="text-green-400 text-xs">Saved ✓</span>
          )}

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={!selectedFile || saving || loading}
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

          {/* Left Sidebar — File Tree (250px) */}
          <div className="bg-gray-800 border-r border-gray-700 flex flex-col overflow-hidden" style={{ width: '250px' }}>
            <div className="px-3 py-2 border-b border-gray-700">
              <p className="text-gray-400 text-xs uppercase tracking-wider">
                Explorer
              </p>
              <p className="text-gray-300 text-sm font-medium mt-1 truncate">
                {projectName}
              </p>
            </div>
            
            {/* File Tree */}
            <div className="flex-1 overflow-y-auto border-b border-gray-700">
              {fileTree && fileTree.length > 0 ? (
                <FileTreeWithIssues
                  fileTree={fileTree}
                  onFileClick={handleFileClick}
                  selectedFile={selectedFile}
                  issuesMap={issuesMap}
                />
              ) : (
                <div className="p-3 text-gray-400 text-sm">
                  {hasFileTreeError ? (
                    <div className="text-red-400">
                      <div>⚠️ No files found in this project</div>
                      <button 
                        onClick={() => window.location.reload()} 
                        className="mt-2 text-xs underline hover:text-red-300"
                      >
                        Reload page
                      </button>
                    </div>
                  ) : (
                    "Loading files..."
                  )}
                </div>
              )}
            </div>
            
            {/* Audit Findings */}
            <AuditFindings 
              findings={securityFindings || []}
              onFindingClick={() => {
                // Can be used to highlight lines in editor
              }}
            />
          </div>

          {/* Center — Diff Editor (Fluid Width) */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <DiffEditor
              file={selectedFile}
              content={fileContent}
              findings={securityFindings || []}
              onAcceptPatch={handleAcceptPatch}
              patchLoading={saving}
              onChange={setFileContent}
            />
          </div>

          {/* Right Sidebar — AI Insights (300px) */}
          <AIInsightsPanel 
            findings={securityFindings || []} 
            loading={auditLoading} 
            error={auditError}
          />

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
              style={{ userSelect: 'none' }}
            />

            {/* Terminal Content */}
            <div 
              style={{ height: `${terminalHeight}px` }} 
              className="flex flex-col overflow-hidden"
            >
              <Terminal
                projectName={projectName}
                isOpen={isTerminalOpen}
                onToggle={() => setIsTerminalOpen(false)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Audit Panel - Side Window */}
      <AuditPanel
        isOpen={isAuditPanelOpen}
        onClose={() => setIsAuditPanelOpen(false)}
        projectName={projectName}
        selectedFile={selectedFile}
        fileTree={fileTree}
        fileContent={fileContent}
      />
    </div>
  );
}

export default Workspace;
