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

const readFile = (roomId, filePath) => {
  const fullPath = path.join(WORKSPACES_DIR, roomId, filePath);
  return fs.readFileSync(fullPath, "utf-8");
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
  deleteWorkspace
};