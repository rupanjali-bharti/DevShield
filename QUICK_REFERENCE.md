# Quick Reference: Git Workflow in DevShield Terminal

## 🎯 Quick Start (Copy & Paste)

### After Running Audit & Fixing Code:

```bash
# 1. Check what changed
git status

# 2. Stage all changes
git add .

# 3. Commit with a message
git commit -m "Fixed security vulnerabilities from audit"

# 4. Push to your repository
git push origin main
```

**That's it!** Your fixes are now in your repository! 🎉

---

## 🔘 Or Use Quick Buttons

1. Click **📊 Status** → See what changed
2. Click **➕ Stage All** → Prepare changes
3. Click **✓ Commit** → Type your message and press Enter
4. Click **🚀 Push** → Push to repository

---

## 📝 Git Commit Message Examples

```bash
git commit -m "Fixed SQL injection in login form"

git commit -m "Fixed: Hardcoded secrets removed, added env vars"

git commit -m "Implemented bcrypt for password hashing"

git commit -m "Fixed CWE-89: SQL injection vulnerability"

git commit -m "Security update: removed hardcoded API key, using .env"
```

---

## 🚀 Push Examples

```bash
# Push to main branch
git push origin main

# Push to feature branch
git push origin fix/security

# Push all branches
git push origin --all
```

---

## 📊 Useful Status Commands

```bash
git status          # See modified files
git log --oneline   # See 10 recent commits  
git diff            # See exact changes
git branch          # See branches
```

---

## ⚡ Pro Workflow

```bash
# Check status first
git status

# See exact changes
git diff

# Stage changes
git add .

# See what will be committed
git diff --cached

# Commit
git commit -m "Your message"

# View the commit
git log --oneline

# Push
git push origin main

# Verify on GitHub
# Visit your repo URL and refresh
```

---

## 🆘 If Something Goes Wrong

```bash
# See what the issue is
git status

# Undo last commit (keeps changes)
git reset HEAD~1

# See full error details
git log --oneline

# Check remote connection
git remote -v
```

---

## 📱 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| ⬆/⬇ | Navigate command history |
| Enter | Run command |
| Ctrl+C | Cancel command |
| Ctrl+\` | Toggle terminal |
| Ctrl+S | Save file (in editor) |

---

## ✨ Tips

- ✅ **Commit Often**: Small commits are easier to manage
- ✅ **Clear Messages**: Write what you fixed, not just "fixed code"
- ✅ **Check Before Push**: Use `git log` to verify
- ✅ **Pull Before Push**: `git pull` first if multiple people work on repo
- ✅ **Use Branches**: For major changes, create a branch first

---

## 🎓 Learn More

- Type `help` in terminal for all commands
- Type `git help <command>` for details (e.g., `git help push`)
- Visit https://git-scm.com for full documentation

---

**Ready to audit and push?** Open a repository and start! 🚀
