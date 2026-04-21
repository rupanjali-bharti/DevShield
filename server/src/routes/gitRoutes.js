const express = require("express");
const router = express.Router();
const {
  cloneRepo,
  getFileTree
} = require("../git/gitService");
const path = require("path");

const WORKSPACES_DIR = path.join(__dirname, "../../../workspaces");

// Clone a repo
router.post("/clone", async (req, res) => {
  const { repoUrl, projectName } = req.body;

  if (!repoUrl || !projectName) {
    return res.status(400).json({
      error: "repoUrl and projectName are required"
    });
  }

  try {
    console.log(`Cloning ${repoUrl}...`);
    await cloneRepo(repoUrl, projectName);
    const fileTree = getFileTree(
      path.join(WORKSPACES_DIR, projectName)
    );
    res.json({ success: true, fileTree, projectName });
  } catch (error) {
    console.error("Clone error:", error.message);
    res.status(500).json({ error: "Failed to clone repository" });
  }
});

// Get file tree of existing project
router.get("/:projectName/tree", (req, res) => {
  const { projectName } = req.params;
  try {
    const fileTree = getFileTree(
      path.join(WORKSPACES_DIR, projectName)
    );
    res.json({ fileTree });
  } catch (error) {
    res.status(404).json({ error: "Project not found" });
  }
});

module.exports = router;