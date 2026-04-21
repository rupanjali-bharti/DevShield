import Editor from "@monaco-editor/react";

const LANGUAGE_MAP = {
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  py: "python",
  java: "java",
  c: "c",
  cpp: "cpp",
  html: "html",
  css: "css",
  json: "json",
  md: "markdown",
  txt: "plaintext",
  yml: "yaml",
  yaml: "yaml",
  xml: "xml",
  sh: "shell",
};

const getLanguage = (fileName) => {
  if (!fileName) return "plaintext";
  const ext = fileName.split(".").pop().toLowerCase();
  return LANGUAGE_MAP[ext] || "plaintext";
};

function CodeEditor({ file, content, onChange }) {
  if (!file) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-2">
            No file selected
          </p>
          <p className="text-gray-600 text-sm">
            Click a file in the explorer to open it
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* File tab */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center">
        <span className="text-blue-400 mr-2">📄</span>
        <span className="text-gray-300 text-sm">{file.name}</span>
        <span className="text-gray-600 text-xs ml-3">
          {file.path}
        </span>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          language={getLanguage(file.name)}
          value={content}
          onChange={onChange}
          theme="vs-dark"
          options={{
            fontSize: 14,
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            automaticLayout: true,
            tabSize: 2,
            lineNumbers: "on",
            folding: true,
            bracketPairColorization: { enabled: true },
          }}
        />
      </div>
    </div>
  );
}

export default CodeEditor;