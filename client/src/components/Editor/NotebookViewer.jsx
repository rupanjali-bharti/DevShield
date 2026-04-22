import { useState } from "react";
import Editor from "@monaco-editor/react";
import { executeTerminalCommand } from "../../services/api";

function NotebookViewer({ content, projectName }) {
  const [cells, setCells] = useState(() => {
    try {
      const notebook = JSON.parse(content);
      if (notebook.cells && Array.isArray(notebook.cells)) {
        return notebook.cells.map((cell, idx) => ({
          id: idx,
          type: cell.cell_type,
          source: Array.isArray(cell.source) ? cell.source.join("") : cell.source,
          output: cell.outputs || [],
          running: false,
          executed: false,
        }));
      }
    } catch (e) {
      console.error("Failed to parse notebook:", e);
    }
    return [];
  });

  const extractModuleName = (errorText) => {
    const match = errorText.match(/ModuleNotFoundError: No module named '([^']+)'/);
    return match ? match[1].split(".")[0] : null;
  };

  const runCell = async (cellId, isRetry = false) => {
    setCells((prev) =>
      prev.map((cell) =>
        cell.id === cellId ? { ...cell, running: true } : cell
      )
    );

    const cell = cells.find((c) => c.id === cellId);
    if (!cell) return;

    try {
      // Execute Python code
      const result = await executeTerminalCommand(projectName, `python -c "${cell.source.replace(/"/g, '\\"')}"`);

      // Check if there's a ModuleNotFoundError and auto-install
      if (result.error && result.error.includes("ModuleNotFoundError") && !isRetry) {
        const moduleName = extractModuleName(result.error);
        if (moduleName) {
          console.log(`Auto-installing missing module: ${moduleName}`);
          
          // Install the missing module
          await executeTerminalCommand(projectName, `pip install ${moduleName}`);
          
          // Retry execution
          return runCell(cellId, true);
        }
      }

      setCells((prev) =>
        prev.map((c) =>
          c.id === cellId
            ? {
                ...c,
                running: false,
                executed: true,
                output: [{ output_type: result.error ? "error" : "stream", text: result.output || result.error || "Execution completed" }],
              }
            : c
        )
      );
    } catch (error) {
      setCells((prev) =>
        prev.map((c) =>
          c.id === cellId
            ? {
                ...c,
                running: false,
                executed: true,
                output: [{ output_type: "error", text: error.message }],
              }
            : c
        )
      );
    }
  };

  const runAllCells = async () => {
    for (const cell of cells) {
      if (cell.type === "code") {
        await runCell(cell.id);
      }
    }
  };

  if (cells.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <p className="text-gray-500">No cells found in notebook</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex gap-2">
        <button
          onClick={runAllCells}
          className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded transition-colors"
        >
          ▶ Run All
        </button>
        <span className="text-gray-500 text-xs self-center">
          {cells.filter((c) => c.executed).length} of {cells.filter((c) => c.type === "code").length} cells executed
        </span>
      </div>

      {/* Cells */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {cells.map((cell) => (
          <div
            key={cell.id}
            className="border border-gray-700 rounded bg-gray-800"
          >
            {/* Cell Header */}
            <div className="bg-gray-750 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {cell.type === "code" ? (
                  <>
                    <span className="text-blue-400 text-xs font-mono">In [{cell.executed ? cell.id + 1 : " "}]</span>
                    <button
                      onClick={() => runCell(cell.id)}
                      disabled={cell.running}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs px-2 py-1 rounded transition-colors"
                    >
                      {cell.running ? "⏳ Running..." : "▶ Run"}
                    </button>
                  </>
                ) : (
                  <span className="text-gray-400 text-xs">Markdown Cell</span>
                )}
              </div>
              <span className="text-gray-600 text-xs">Cell {cell.id + 1}</span>
            </div>

            {/* Cell Content */}
            <div className="p-3 bg-gray-900">
              {cell.type === "code" ? (
                <div className="border border-gray-700 rounded overflow-hidden">
                  <Editor
                    height="200px"
                    language="python"
                    value={cell.source}
                    theme="vs-dark"
                    options={{
                      fontSize: 12,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      wordWrap: "on",
                      lineNumbers: "on",
                      folding: true,
                      readOnly: true,
                    }}
                  />
                </div>
              ) : (
                <div className="text-gray-300 text-sm whitespace-pre-wrap break-words max-h-64 overflow-auto">
                  {cell.source}
                </div>
              )}
            </div>

            {/* Cell Output */}
            {cell.output && cell.output.length > 0 && (
              <div className="border-t border-gray-700 p-3 bg-gray-950">
                <div className="text-gray-400 text-xs mb-2">Out [{cell.id + 1}]:</div>
                <div className="bg-gray-900 border border-gray-700 rounded p-2 text-gray-300 text-xs font-mono whitespace-pre-wrap break-words max-h-64 overflow-auto">
                  {cell.output.map((out, idx) => (
                    <div key={idx} className={out.output_type === "error" ? "text-red-400" : "text-green-400"}>
                      {typeof out.text === "string"
                        ? out.text
                        : Array.isArray(out.text)
                        ? out.text.join("")
                        : JSON.stringify(out)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default NotebookViewer;
