const simpleGit = require("simple-git");
const path = require("path");
const fs = require("fs");

const WORKSPACES_DIR = path.join(__dirname, "../../../workspaces");

if (!fs.existsSync(WORKSPACES_DIR)) {
  fs.mkdirSync(WORKSPACES_DIR, { recursive: true });
}

const cloneRepo = async (repoUrl, roomId) => {
  const roomPath = path.join(WORKSPACES_DIR, roomId);

  if (fs.existsSync(roomPath)) {
    return roomPath;
  }

  fs.mkdirSync(roomPath, { recursive: true });

  const git = simpleGit();
  await git.clone(repoUrl, roomPath);

  console.log(`Cloned ${repoUrl} into ${roomPath}`);
  return roomPath;
};


const getFileTree = (dirPath, baseDir = dirPath) => {
  const items = fs.readdirSync(dirPath);
  const result = [];

  // Folders to ignore
  const ignored = [
    "node_modules", ".git", ".env",
    "dist", "build", "__pycache__", ".next"
  ];

  for (const item of items) {
    if (ignored.includes(item)) continue;

    const fullPath = path.join(dirPath, item);
    const relativePath = path.relative(baseDir, fullPath);
    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      result.push({
        name: item,
        path: relativePath,
        type: "folder",
        children: getFileTree(fullPath, baseDir)
      });
    } else {
      result.push({
        name: item,
        path: relativePath,
        type: "file"
      });
    }
  }

  return result;
};

const cleanNotebookCell = (source) => {
  if (typeof source !== "string") {
    source = Array.isArray(source) ? source.join("") : String(source);
  }

  let lines = source.split("\n");
  let cleanedLines = [];
  let hasRequirements = false;

  for (let line of lines) {
    // Remove Google Colab imports
    if (line.includes("from google.colab")) {
      continue;
    }
    if (line.includes("from google_colab_data")) {
      continue;
    }

    // Convert pip magic commands to subprocess
    if (line.trim().startsWith("!pip")) {
      const packages = line.replace("!pip install", "").trim();
      cleanedLines.push(`import subprocess\nimport sys\nsubprocess.check_call([sys.executable, "-m", "pip", "install", "${packages.split(" ").join('", "')}"])`);
      hasRequirements = true;
      continue;
    }

    // Convert apt-get magic commands
    if (line.trim().startsWith("!apt-get")) {
      // Skip system commands, user should install manually
      console.warn("System command detected, skipping:", line.trim());
      continue;
    }

    // Remove other shell commands
    if (line.trim().startsWith("!")) {
      console.warn("Shell command detected, skipping:", line.trim());
      continue;
    }

    // Remove other magic commands
    if (line.trim().startsWith("%")) {
      console.warn("Magic command detected, skipping:", line.trim());
      continue;
    }

    cleanedLines.push(line);
  }

  return cleanedLines.join("\n").trim();
};

const cleanNotebook = (notebookContent) => {
  try {
    const notebook = typeof notebookContent === "string" ? JSON.parse(notebookContent) : notebookContent;

    if (notebook.cells && Array.isArray(notebook.cells)) {
      notebook.cells = notebook.cells.map((cell) => {
        if (cell.cell_type === "code") {
          const source = Array.isArray(cell.source) ? cell.source.join("") : cell.source;
          cell.source = cleanNotebookCell(source);
        }
        return cell;
      });
    }

    return notebook;
  } catch (error) {
    console.error("Error cleaning notebook:", error);
    return typeof notebookContent === "string" ? JSON.parse(notebookContent) : notebookContent;
  }
};

const readFile = (roomId, filePath) => {
  const fullPath = path.join(WORKSPACES_DIR, roomId, filePath);
  const content = fs.readFileSync(fullPath, "utf-8");

  // Auto-clean Jupyter notebooks to remove Colab-specific code
  if (filePath.endsWith(".ipynb")) {
    try {
      const cleanedNotebook = cleanNotebook(content);
      return JSON.stringify(cleanedNotebook);
    } catch (error) {
      console.error("Failed to clean notebook:", error);
      return content;
    }
  }

  return content;
};

const writeFile = (roomId, filePath, content) => {
  const fullPath = path.join(WORKSPACES_DIR, roomId, filePath);
  fs.writeFileSync(fullPath, content, "utf-8");
};

const deleteWorkspace = (roomId) => {
  const roomPath = path.join(WORKSPACES_DIR, roomId);
  if (fs.existsSync(roomPath)) {
    fs.rmSync(roomPath, { recursive: true, force: true });
    console.log(`Deleted workspace for room ${roomId}`);
  }
};

module.exports = {
  cloneRepo,
  getFileTree,
  readFile,
  writeFile,
  deleteWorkspace,
  cleanNotebook,
  cleanNotebookCell
};