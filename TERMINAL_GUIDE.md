# DevShield Terminal - Complete Guide

## ✨ Features

Your DevShield terminal now has:
- ✅ Quick command buttons for common git operations
- ✅ Full git support (commit, push, branch management)
- ✅ Auto-complete git configuration
- ✅ Command history (use ⬆/⬇ arrows)
- ✅ Real-time output and error messages
- ✅ Built-in help system

## 🚀 Quick Start: Audit & Push Workflow

### The Complete Flow

```
1. CLONE REPO
   → Choose project from home page

2. RUN AUDIT
   → DevShield scans code for security issues
   → View findings in Security Panel (right side)

3. REVIEW & FIX
   → Read security findings
   → Edit code in editor to fix issues
   → Save changes (Ctrl+S)

4. COMMIT CHANGES
   → Terminal → Type or click "Commit" button
   $ git commit -m "Fixed security issues"
   → Press Enter

5. PUSH TO REPO
   → Terminal → Click "Push" button
   $ git push origin main
   → Press Enter
   → Done! Your fixes are now in the repository
```

## 📘 Using the Terminal

### Quick Command Buttons

| Button | Command | Purpose |
|--------|---------|---------|
| 📊 Status | `git status` | See what files changed |
| ➕ Stage All | `git add .` | Prepare all changes for commit |
| 📜 Log | `git log --oneline` | View commit history |
| ✓ Commit | `git commit -m ` | Commit staged changes |
| 🚀 Push | `git push origin main` | Push to repository |
| ❓ Help | `help` | Show all available commands |

### Manual Command Examples

#### Check what changed
```bash
$ git status
```
Shows modified files (will appear red)

#### View specific changes
```bash
$ git diff
```
Shows line-by-line changes

#### Stage changes
```bash
$ git add .
```
Stages ALL changes (or use `git add filename.js` for specific file)

#### Commit changes
```bash
$ git commit -m "Fixed SQL injection vulnerability"
```
Creates a commit with your message

#### Push to main branch
```bash
$ git push origin main
```
Uploads commits to repository

#### Push to different branch
```bash
$ git push origin feature-branch
```

## 🌿 Advanced: Working with Branches

### View all branches
```bash
$ git branch
```
Shows local branches (* = current branch)

### Create new branch
```bash
$ git branch fix/security-issues
```

### Switch to branch
```bash
$ git checkout fix/security-issues
```

### Push new branch
```bash
$ git push origin fix/security-issues
```

## 🔧 Configuration Commands

### Set your git name (if needed)
```bash
$ git config user.name "Your Name"
```

### Set your git email (if needed)
```bash
$ git config user.email "your@email.com"
```

### View current configuration
```bash
$ git config --list
```

### Check remote repository
```bash
$ git remote -v
```

## 📋 Complete Workflow Example

Scenario: You found and fixed 3 security vulnerabilities in the audit

```bash
# Step 1: Check status
$ git status

# Output shows:
#   modified: src/auth.js
#   modified: src/database.js
#   modified: src/config.js

# Step 2: Stage all changes
$ git add .

# Step 3: Check what will be committed
$ git diff --cached

# Step 4: Commit with a clear message
$ git commit -m "Fixed: SQL injection, password hashing, hardcoded secrets"

# Output shows:
# ✓ Commit successful!
# [main a1b2c3d] Fixed: SQL injection, password hashing, hardcoded secrets
# 3 files changed, 15 insertions(+), 8 deletions(-)

# Step 5: View the new commit
$ git log --oneline

# Output shows:
# a1b2c3d Fixed: SQL injection, password hashing, hardcoded secrets
# (previous commits...)

# Step 6: Push to repository
$ git push origin main

# Output shows:
# Enumerating objects: 4, done.
# Writing objects: 100% (4/4)
# To https://github.com/yourname/repo.git
#    xyz...abc a1b2c3d..def..789 main -> main
```

## ✅ Success Indicators

### Successful Commit
```
✓ Commit successful!
[main abc1234] Your message
 N files changed, X insertions(+)
```

### Successful Push
```
To https://github.com/username/repo.git
   abc1234..def5678 main -> main
```

### Success on GitHub
- Go to your repository on GitHub
- You'll see the new commit with your message
- Files will show the updated code
- Timestamp will be recent

## ⚠️ Common Issues & Solutions

### Issue: "Nothing to commit"
- **Cause**: No files were changed
- **Fix**: Make sure you saved your edits (Ctrl+S)
- **Check**: Use `git status` to see modified files

### Issue: "Not a git repository"
- **Cause**: Project wasn't cloned from git repo
- **Fix**: Clone from a valid GitHub/GitLab URL
- **Check**: Look for `.git` folder in project

### Issue: "No remote repository"
- **Cause**: Remote wasn't configured properly
- **Fix**: 
  ```bash
  $ git remote add origin <your-repo-url>
  $ git push origin main
  ```

### Issue: "Permission denied"
- **Cause**: You don't have push access
- **Fix**: 
  1. Check repository permissions
  2. Ensure you're logged in to git
  3. Use SSH key or personal access token

### Issue: "Conflicts"
- **Cause**: Someone else modified same files
- **Fix**: Pull first, then resolve conflicts:
  ```bash
  $ git pull origin main
  $ # Edit files to resolve conflicts
  $ git add .
  $ git commit -m "Resolve conflicts"
  $ git push origin main
  ```

## 💡 Pro Tips

1. **Commit Often**: Small, focused commits are better than large ones
2. **Clear Messages**: Write descriptive commit messages
3. **Check Before Push**: Use `git log` to verify commits
4. **Pull Before Push**: Always pull latest changes first
5. **Use Branches**: For major changes, create a new branch first

## 🎯 KeyboardShortcuts

| Shortcut | Action |
|----------|--------|
| ⬆ Arrow Up | Previous command in history |
| ⬇ Arrow Down | Next command in history |
| Ctrl+S | Save current file (in editor) |
| Ctrl+\` | Toggle terminal |
| Enter | Execute command |

## 📞 Getting Help

1. **In Terminal**: Type `help` for command list
2. **Git Official**: `git help <command>` (e.g., `git help push`)
3. **Check Status**: `git status` always tells you what to do next

---

## 🎉 You're Ready!

Your DevShield terminal is now fully functional. You can:
- ✅ View security audit results
- ✅ Fix code issues
- ✅ Commit changes
- ✅ Push back to your repository

Start an audit and push your fixes! 🚀
