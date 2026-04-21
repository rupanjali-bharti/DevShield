const express = require("express");
const router = express.Router();
const { readFile, writeFile } = require("../git/gitService");

// Read a file
router.get("/:projectName", (req, res) => {
  const { projectName } = req.params;
  const { filePath } = req.query;

  if (!filePath) {
    return res.status(400).json({ error: "filePath is required" });
  }

  try {
    const content = readFile(projectName, filePath);
    res.json({ content });
  } catch (error) {
    res.status(404).json({ error: "File not found" });
  }
});

// Save a file
router.post("/:projectName", (req, res) => {
  const { projectName } = req.params;
  const { filePath, content } = req.body;

  if (!filePath || content === undefined) {
    return res.status(400).json({
      error: "filePath and content are required"
    });
  }

  try {
    writeFile(projectName, filePath, content);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to save file" });
  }
});

module.exports = router;