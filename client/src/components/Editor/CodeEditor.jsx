import { useState, useMemo } from "react";
import Editor from "@monaco-editor/react";
import NotebookViewer from "./NotebookViewer";

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

// Prettify minified code
const prettifyCode = (code, language) => {
  try {
    if (language === "javascript" || language === "json") {
      return JSON.stringify(JSON.parse(code), null, 2);
    }
    // Simple prettify: add newlines after semicolons and braces
    return code
      .replace(/;/g, ";\n")
      .replace(/{/g, "{\n")
      .replace(/}/g, "\n}")
      .replace(/,/g, ",\n");
  } catch {
    return code;
  }
};



const getFileType = (fileName) => {
  const ext = fileName.split(".").pop().toLowerCase();
  if (["png", "jpg", "jpeg", "gif"].includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  if (ext === "svg") return "svg";
  if (ext === "ipynb") return "notebook";
  if (ext === "min.js" || ext === "min.css") return "minified";
  return "code";
};

function CodeEditor({ file, content, onChange, projectName }) {
  const [isPrettified, setIsPrettified] = useState(false);

  // Get file info early
  const fileType = file ? getFileType(file.name) : null;
  const language = file ? getLanguage(file.name) : null;

  // Call hooks before any conditional returns (must be called unconditionally)
  const displayContent = useMemo(() => {
    if (!file) return "";
    if (fileType === "minified" && isPrettified) {
      return prettifyCode(content, language);
    }
    return content;
  }, [content, fileType, isPrettified, language, file]);

  if (!file) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-2">No file selected</p>
          <p className="text-gray-600 text-sm">
            Click a file in the explorer to open it
          </p>
        </div>
      </div>
    );
  }

  // Return notebook viewer for Jupyter files
  if (fileType === "notebook") {
    return <NotebookViewer content={content} projectName={projectName} />;
  }

  return (
    <div className="h-full flex flex-col">
      {/* File tab */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-blue-400 mr-2">📄</span>
          <span className="text-gray-300 text-sm">{file.name}</span>
          <span className="text-gray-600 text-xs ml-3">{file.path}</span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {fileType === "minified" && (
            <button
              onClick={() => setIsPrettified(!isPrettified)}
              className="bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs px-2 py-1 rounded transition-colors"
              title="Prettify code"
            >
              {isPrettified ? "Minify" : "Prettify"}
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1">
        {fileType === "image" && (
          <div className="flex items-center justify-center h-full bg-gray-900 p-4">
            <img
              src={`data:image/${file.name.split(".").pop()};base64,${btoa(content)}`}
              alt={file.name}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}

        {fileType === "svg" && (
          <div className="flex items-center justify-center h-full bg-gray-900 p-4">
            <div
              dangerouslySetInnerHTML={{ __html: content }}
              className="max-w-full max-h-full overflow-auto"
            />
          </div>
        )}

        {fileType === "pdf" && (
          <div className="flex flex-col items-center justify-center h-full bg-gray-900 p-4">
            <p className="text-gray-400 mb-4">PDF Preview</p>
            <a
              href={`data:application/pdf;base64,${btoa(content)}`}
              download={file.name}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Download PDF
            </a>
          </div>
        )}

        {(fileType === "code" || fileType === "minified") && (
          <Editor
            height="100%"
            language={language}
            value={displayContent}
            onChange={fileType === "minified" ? undefined : onChange}
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
              readOnly: fileType === "minified",
            }}
          />
        )}
      </div>
    </div>
  );
}

export default CodeEditor;