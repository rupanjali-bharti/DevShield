import express from "express";
import { cloneRepo, getFileTree } from "../git/gitService.js";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const WORKSPACES_DIR = path.join(__dirname, "../../../workspaces");

// Get list of available workspaces
router.get("/list/workspaces", (req, res) => {
  try {
    if (!fs.existsSync(WORKSPACES_DIR)) {
      return res.json({ workspaces: [] });
    }

    const items = fs.readdirSync(WORKSPACES_DIR);
    const workspaces = items
      .filter((item) => {
        const fullPath = path.join(WORKSPACES_DIR, item);
        return fs.statSync(fullPath).isDirectory();
      })
      .map((item) => ({
        name: item,
        path: path.join(WORKSPACES_DIR, item),
      }));

    res.json({ workspaces });
  } catch (error) {
    console.error("Error listing workspaces:", error.message);
    res.status(500).json({ error: "Failed to list workspaces" });
  }
});

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

// Execute terminal command
router.post("/:projectName/terminal", (req, res) => {
  const { projectName } = req.params;
  const { command } = req.body;

  if (!command) {
    return res.status(400).json({ error: "Command is required" });
  }

  const projectPath = path.join(WORKSPACES_DIR, projectName);

  try {
    // Execute command in the project directory
    const output = execSync(command, {
      cwd: projectPath,
      encoding: "utf-8",
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      stdio: ["pipe", "pipe", "pipe"],
    });

    res.json({ success: true, output });
  } catch (error) {
    const errorMsg = error.stderr ? error.stderr.toString() : error.message;
    const stdout = error.stdout ? error.stdout.toString() : "";
    
    console.error(`Command failed: ${command}`, errorMsg);
    
    res.status(400).json({
      success: false,
      output: stdout,
      error: errorMsg || error.message,
    });
  }
});

// Get git info/status
router.get("/:projectName/info", (req, res) => {
  const { projectName } = req.params;
  const projectPath = path.join(WORKSPACES_DIR, projectName);

  try {
    // Check if git repo
    execSync("git rev-parse --git-dir", { cwd: projectPath, encoding: "utf-8" });
    
    // Get current branch
    const branch = execSync("git rev-parse --abbrev-ref HEAD", { cwd: projectPath, encoding: "utf-8" }).trim();
    
    // Get status
    const status = execSync("git status --short", { cwd: projectPath, encoding: "utf-8" });
    
    // Get last commit
    const lastCommit = execSync("git log -1 --oneline", { cwd: projectPath, encoding: "utf-8" }).trim();
    
    // Get git config
    let userName = "Not configured";
    let userEmail = "Not configured";
    try {
      userName = execSync("git config user.name", { cwd: projectPath, encoding: "utf-8" }).trim();
      userEmail = execSync("git config user.email", { cwd: projectPath, encoding: "utf-8" }).trim();
    } catch (_) {}

    res.json({
      success: true,
      branch,
      status,
      lastCommit,
      userName,
      userEmail,
      isGitRepo: true,
      path: projectPath,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: "Not a git repository",
      path: projectPath,
    });
  }
});

// Configure git user
router.post("/:projectName/configure-git", async (req, res) => {
  const { projectName } = req.params;
  const { name = "DevShield User", email = "devshield@local" } = req.body;

  const projectPath = path.join(WORKSPACES_DIR, projectName);

  try {
    // Set git config
    execSync(`git config user.name "${name}"`, { cwd: projectPath });
    execSync(`git config user.email "${email}"`, { cwd: projectPath });

    res.json({ success: true, message: "Git configured successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Git commit with auto-staging
router.post("/:projectName/commit", (req, res) => {
  const { projectName } = req.params;
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Commit message is required" });
  }

  const projectPath = path.join(WORKSPACES_DIR, projectName);

  try {
    // Check if it's a git repository
    try {
      execSync("git rev-parse --git-dir", { cwd: projectPath, encoding: "utf-8" });
    } catch (gitCheckError) {
      return res.status(400).json({
        success: false,
        error: `Not a git repository. Make sure the project was cloned from a git repository.`,
        path: projectPath,
      });
    }

    // Try to configure git if user is not set
    try {
      execSync("git config user.name", { cwd: projectPath, encoding: "utf-8" });
    } catch (_) {
      // User name not configured, set it
      try {
        execSync(`git config user.name "DevShield User"`, { cwd: projectPath });
        execSync(`git config user.email "devshield@local"`, { cwd: projectPath });
        console.log(`Configured git for ${projectName}`);
      } catch (configError) {
        return res.status(400).json({
          success: false,
          error: `Failed to configure git: ${configError.message}`,
        });
      }
    }

    // Stage all changes
    execSync("git add -A", { cwd: projectPath, encoding: "utf-8" });

    // Get git status to check if there's anything to commit
    const status = execSync("git status --short", { cwd: projectPath, encoding: "utf-8" });
    
    if (!status.trim()) {
      return res.json({
        success: true,
        output: "✓ No changes to commit - working tree clean",
        message: "working tree clean",
      });
    }

    // Get the diff for reference
    const diff = execSync("git diff --cached --stat", { cwd: projectPath, encoding: "utf-8" });

    // Commit with proper escaping
    let commitOutput;
    try {
      // Use a temporary file for the commit message to avoid escaping issues
      const tempFile = path.join(projectPath, ".commit_msg_temp");
      fs.writeFileSync(tempFile, message);
      commitOutput = execSync(`git commit -F "${tempFile}"`, {
        cwd: projectPath,
        encoding: "utf-8",
      });
      fs.unlinkSync(tempFile); // Clean up temp file
    } catch (commitErr) {
      // Fallback: try direct commit
      commitOutput = execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, {
        cwd: projectPath,
        encoding: "utf-8",
      });
    }

    // Get the new commit info
    const logInfo = execSync("git log -1 --oneline", { cwd: projectPath, encoding: "utf-8" });

    res.json({
      success: true,
      output: `✓ Commit successful!\n${logInfo}\nChanges:\n${diff}${commitOutput}`,
      commit: logInfo.trim(),
    });
  } catch (error) {
    const stderr = error.stderr ? error.stderr.toString() : "";
    const stdout = error.stdout ? error.stdout.toString() : "";
    const errorMsg = error.message;

    console.error(`Commit failed for ${projectName}:`, errorMsg);
    console.error(`stderr:`, stderr);
    console.error(`stdout:`, stdout);

    res.status(400).json({
      success: false,
      output: stdout,
      error: `Commit failed: ${stderr || errorMsg}`,
      details: {
        projectPath,
        command: "git commit",
        stderr: stderr,
      },
    });
  }
});

// Git push to remote
router.post("/:projectName/push", (req, res) => {
  const { projectName } = req.params;
  const { remote = "origin", branch = null } = req.body;

  const projectPath = path.join(WORKSPACES_DIR, projectName);

  try {
    // Check if it's a git repository
    try {
      execSync("git rev-parse --git-dir", { cwd: projectPath, encoding: "utf-8" });
    } catch (gitCheckError) {
      return res.status(400).json({
        success: false,
        error: "Not a git repository",
        path: projectPath,
      });
    }

    // Get current branch if not specified
    let targetBranch = branch;
    if (!targetBranch) {
      targetBranch = execSync("git rev-parse --abbrev-ref HEAD", { cwd: projectPath, encoding: "utf-8" }).trim();
    }

    // Check if there are any commits to push
    try {
      execSync("git log -1", { cwd: projectPath, encoding: "utf-8" });
    } catch (_) {
      return res.status(400).json({
        success: false,
        error: "No commits to push. Make a commit first.",
      });
    }

    // Check if the remote exists
    try {
      execSync(`git rev-parse --verify refs/remotes/${remote}/HEAD`, { cwd: projectPath, encoding: "utf-8" });
    } catch (_) {
      return res.status(400).json({
        success: false,
        error: `Remote '${remote}' does not exist or is not accessible.`,
      });
    }

    // Push to the remote
    const pushOutput = execSync(`git push ${remote} ${targetBranch}`, {
      cwd: projectPath,
      encoding: "utf-8",
    });

    res.json({
      success: true,
      output: pushOutput,
      branch: targetBranch,
      remote: remote,
    });
  } catch (error) {
    const stderr = error.stderr ? error.stderr.toString() : "";
    const stdout = error.stdout ? error.stdout.toString() : "";

    console.error(`Push failed for ${projectName}:`, error.message);

    // Determine the specific error
    let friendlyError = stderr || error.message;
    if (friendlyError.includes("src refspec")) {
      friendlyError = "The branch does not exist or has no commits. Try committing first.";
    } else if (friendlyError.includes("Authentication failed")) {
      friendlyError = "Authentication failed. Check your credentials and remote URL.";
    }

    res.status(400).json({
      success: false,
      output: stdout,
      error: friendlyError,
      details: {
        projectPath,
        command: "git push",
        stderr: stderr,
      },
    });
  }
});

export default router;