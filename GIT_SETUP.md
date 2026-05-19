# Git Configuration Guide for DevShield

## Common Issues and Solutions

### Error: Request failed with status code 500

This error typically means one of the following:

1. **Git user not configured**
   ```bash
   # Set global git config
   git config --global user.name "Your Name"
   git config --global user.email "your@email.com"
   ```

2. **No changes to commit**
   - Make sure you've made changes to files before committing
   - The system will stage all changes automatically with `git add -A`

3. **Repository not initialized**
   - Ensure the project directory is a git repository
   - Run `git status` to check

### Fix: Set Git Config in Your Workspace

Run this in your terminal:

```bash
# For current user
git config user.name "Your Name"
git config user.email "your@email.com"

# Or globally (recommended)
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

## API Endpoints

### Terminal Command Execution
```
POST /api/git/:projectName/terminal
Body: { command: "git status" }
```

### Git Commit (Recommended)
```
POST /api/git/:projectName/commit
Body: { message: "Your commit message" }
```
- Automatically stages all changes (`git add -A`)
- Checks for changes before committing
- Better error handling

### Configure Git
```
POST /api/git/:projectName/configure-git
Body: { 
  name: "Your Name", 
  email: "your@email.com" 
}
```

## Terminal Usage

### Supported Commands
- **Git**: `git status`, `git log`, `git commit -m "message"`, `git add .`
- **NPM**: `npm install`, `npm run dev`, `npm test`
- **Python**: `python script.py`, `pip install package`
- **General**: `ls`, `cd`, `mkdir`, `cat`, etc.

### Examples

#### Make a commit
```bash
git commit -m "new tech stack"
```

#### Check git status
```bash
git status
```

#### View git log
```bash
git log --oneline
```

#### Stage specific files
```bash
git add filename.js
```

## Troubleshooting

### Terminal Error Display
- If you see `✗ Error:` in terminal, the command failed
- Read the error message carefully - it will tell you what went wrong
- Check git config if it's a git-related error

### Quick Debug
```bash
# Check if git is installed
git --version

# Check git config
git config --list

# Check current git status
git status
```
