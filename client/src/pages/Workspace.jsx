import { useState, useCallback, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import FileTree from "../components/FileTree/FileTree";
import CodeEditor from "../components/Editor/CodeEditor";
import { getFileContent, saveFile } from "../services/api";

function Workspace() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const savedTimerRef = useRef(null);

  const projectName = state?.projectName;
  const fileTree = state?.fileTree;

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
    },
    [handleSave]
  );

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
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar — File Tree */}
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
            <FileTree
              fileTree={fileTree}
              onFileClick={handleFileClick}
              selectedFile={selectedFile}
            />
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          <CodeEditor
            file={selectedFile}
            content={fileContent}
            onChange={handleEditorChange}
          />
        </div>

      </div>
    </div>
  );
}

export default Workspace;