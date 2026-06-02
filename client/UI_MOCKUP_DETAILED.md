# DevShield High-Fidelity UI - Complete Mockup

## Overview
A 3-column dark-theme IDE workspace designed for security-first development with AI-powered vulnerability detection and remediation.

---

## Layout Specification

### Column Structure
```
┌─────────────────────────────────────────────────────────────────┐
│  Top Navigation Bar                                             │
│  DevShield | project-name      [Audit] [Terminal] [Save] [Home]│
├──────────────────┬───────────────────────────────┬──────────────┤
│                  │                               │              │
│  Left Column     │   Center Column               │ Right Column │
│  (250px)         │   (Fluid Width)               │  (300px)     │
│                  │                               │              │
│  ┌────────────┐  │  ┌─────────────────────────┐  │              │
│  │  EXPLORER  │  │  │ [✓ Accept AI Patch]     │  │ 🤖 AI        │
│  │            │  │  │ (Glowing Green)         │  │ INSIGHTS     │
│  │ File Tree  │  │  │ ┌─────────┬─────────┐   │  │              │
│  │ with       │  │  │ │VULNER-  │AI-      │   │  │ Risk Score   │
│  │ Issues     │  │  │ │ABLE     │SUGGESTED│   │  │   9/10       │
│  │            │  │  │ │CODE     │PATCH    │   │  │   HIGH       │
│  ├────────────┤  │  │ │         │         │   │  │              │
│  │ AUDIT      │  │  │ │Lines:   │Fixed:   │   │  │ Issues:      │
│  │ FINDINGS   │  │  │ │42,106   │42,106   │   │  │ 🔴 CRIT  x3  │
│  │            │  │  │ └─────────┴─────────┘   │  │ 🟠 MED   x2  │
│  │ [CRIT] x3  │  │  │                         │  │ 🟡 LOW   x1  │
│  │ [MED]  x2  │  │  └─────────────────────────┘  │              │
│  │ [LOW]  x1  │  │                               │ Expandable   │
│  └────────────┘  │                               │ issue list   │
│                  │                               │              │
└──────────────────┴───────────────────────────────┴──────────────┘
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ TERMINAL (200px height, collapsible)                      │  │
│  │ ~/project $ git add controllers/auth.js                   │  │
│  │ ~/project $ git commit -m "Apply security patch for SQL"  │  │
│  │ [main a3f2c31] Apply security patch for SQL Injection     │  │
│  │ 1 file changed, 4 insertions(+), 3 deletions(-)           │  │
│  │ ~/project $ git push origin main                          │  │
│  │ Counting objects: 100%, done. ✓                           │  │
│  └───────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Component Details

### 1. **Left Column - File Explorer & Audit Findings (250px)**

#### FileTreeWithIssues
- File tree navigation with folder hierarchy
- Issue count badges (red for CRIT, orange for MED, yellow for LOW)
- Selected file highlighting in green
- Click to open files for analysis

#### AuditFindings
- Horizontal scrollable list of detected vulnerabilities
- Color-coded severity badges:
  - **CRIT** (Red): Critical vulnerabilities requiring immediate action
  - **MED** (Orange): Medium severity issues
  - **LOW** (Yellow): Low priority issues
- Expandable details showing:
  - Description of vulnerability
  - Affected code snippet
  - Suggested fix
  - CWE/CVE reference

---

### 2. **Center Column - Monaco Diff Editor (Fluid Width)**

#### Header
- File name and path display
- **Glowing "Accept AI Patch" Button**
  - Vibrant green gradient (`from-green-500 to-emerald-500`)
  - Animated glow effect on hover
  - Transforms code when clicked
  - Shows loading state while applying

#### Dual-Pane Diff View
**Left Side - Vulnerable Code:**
- Label: "⚠ VULNERABLE CODE"
- Read-only Monaco editor
- Original code with syntax highlighting
- Vulnerable lines highlighted:
  - SQL Injection: direct string interpolation
  - Hardcoded Secrets: sensitive values in code
  - Unvalidated Input: missing sanitization

**Right Side - AI-Suggested Patch:**
- Label: "✓ AI-SUGGESTED PATCH"
- Read-only Monaco editor
- Remediated code version
- Green highlights on fixed sections:
  - Parameterized queries
  - Environment variable usage
  - Input validation

#### Bottom Info Panels
- Vulnerable lines reference with descriptions
- Applied fixes summary

---

### 3. **Right Column - AI Insights Panel (300px)**

#### Risk Score Display
- Large, aggressive typography
- Dynamic color based on score:
  - **8-10**: 🔴 **CRITICAL** (Red)
  - **6-8**: 🟠 **HIGH** (Orange)
  - **4-6**: 🟡 **MEDIUM** (Yellow)
  - **2-4**: 🔵 **LOW** (Blue)
  - **0-2**: 🟢 **SAFE** (Green)
- Total issue count displayed

#### Issues List (Expandable)
Each issue shows:
- Severity icon
- Issue type/title
- Expandable details:
  - Full description
  - Vulnerable code snippet
  - AI Suggested Fix (green box)
  - Impact analysis
  - CWE reference

#### AI Explanation Footer
- Helpful tips on using the patch system
- Links to documentation

---

### 4. **Bottom Panel - Terminal (200px, Collapsible)**

#### Features
- Active xterm.js terminal
- Spans full width of left and center columns
- Draggable resize handle at top
- Shows Git operations:
  ```bash
  git add controllers/auth.js
  git commit -m "Applying security patch for CVE-2024-SQL"
  [main a3f2c31] Applying security patch...
  git push origin main
  ```
- Color-coded output
- Real-time command execution

---

## Color Scheme

### Primary Colors
- **Background**: Deep charcoal/black (#1a1a1a, #111111, #1e1e1e)
- **Primary Accent**: Vibrant Green (#10b981, #22c55e)
- **Alert**: Vibrant Red (#ef4444, #dc2626)
- **Warning**: Orange (#f97316, #ea580c)

### Code Highlighting
- **Keywords**: Blue (#60a5fa)
- **Strings**: Yellow (#fbbf24)
- **Functions**: Cyan (#06b6d4)
- **Variables**: White (#ffffff)
- **Comments**: Gray (#6b7280)

### Severity Badges
- **CRIT**: Red (#dc2626) with red background (#7f1d1d)
- **MED**: Orange (#ea580c) with orange background (#7c2d12)
- **LOW**: Yellow (#ca8a04) with yellow background (#713f12)

### UI Elements
- **Borders**: Gray-700 (#374151)
- **Hover State**: Gray-700/50 (#374151 at 50% opacity)
- **Dividers**: Gray-600 (#4b5563)

---

## Interaction Flows

### 1. **File Selection**
1. User clicks file in explorer
2. File content loads in diff editor
3. Security audit runs automatically
4. Findings populate:
   - Left column audit list
   - Right column AI insights
   - Diff editor highlights vulnerable code

### 2. **Accepting a Patch**
1. User reviews vulnerable vs patched code
2. Clicks glowing "Accept AI Patch" button
3. Button shows loading animation
4. Patched code saves automatically
5. Success indicator displays
6. New audit runs on patched code

### 3. **Terminal Operations**
1. User opens terminal (Ctrl+`)
2. Executes `git add <file>`
3. Executes `git commit -m "message"`
4. Executes `git push origin <branch>`
5. Output displays with syntax coloring

---

## Typography

### Fonts
- **Monospace (Code)**: Fira Code, Monaco, Courier New (size: 13-14px)
- **UI**: System fonts (size: 12-14px)

### Text Hierarchy
- **Headers**: Bold, 14px (sections)
- **Labels**: 12px, uppercase, tracking-wider
- **Body**: 13px, regular weight
- **Code**: 13px, monospace, line-height 1.5

---

## Accessibility

- High contrast ratios (WCAG AA compliant)
- Clear focus states on interactive elements
- Keyboard navigation (Ctrl+S save, Ctrl+` terminal)
- Loading states clearly indicated
- Error messages in red with icon
- Success messages in green with checkmark

---

## Responsive Behavior

- **Left Column**: Fixed 250px (scrolls vertically)
- **Center Column**: Fluid width (scales with viewport)
- **Right Column**: Fixed 300px (scrolls vertically)
- **Terminal**: Fixed height 200px (draggable resize)
- **Minimum viewport**: 1200px (recommended 1400px+)

---

## Component Files

### New Components Created
1. **DiffEditor.jsx** - Monaco diff editor with patch accept button
2. **AIInsightsPanel.jsx** - Risk score and insights panel
3. **AuditFindings.jsx** - Colorized audit findings list

### Updated Components
- **Workspace.jsx** - New 3-column layout integration
- **Home.jsx** - Beautiful landing page with repo selector

---

## CSS Classes & Styling

### Key Tailwind Classes
```css
/* Green accent button */
bg-gradient-to-r from-green-500 to-emerald-500
hover:from-green-400 hover:to-emerald-400
shadow-lg hover:shadow-green-500/50
animate-pulse

/* Risk score display */
text-5xl font-bold
bg-opacity-20 border-opacity-30

/* Severity badges */
bg-red-600 text-white        /* CRIT */
bg-orange-500 text-white     /* MED */
bg-yellow-600 text-white     /* LOW */

/* Code highlighting backgrounds */
bg-gray-950 text-gray-300    /* Code blocks */
bg-emerald-950/30            /* Success boxes */
bg-red-900/20                /* Error boxes */
```

---

## Future Enhancements

1. **Multi-file patching** - Select multiple files and apply patches
2. **Patch history** - Undo/redo patch applications
3. **Custom rules** - Define security policies
4. **Team collaboration** - Comment on findings
5. **Integration with CI/CD** - Auto-apply patches on push
6. **AI explanation depth levels** - Quick vs detailed explanations
7. **Custom color themes** - Dark/Light mode toggle
8. **Issue filtering** - By severity, type, CWE, etc.

---

**Created**: June 2, 2026  
**Framework**: React + Tailwind CSS + Monaco Editor  
**Theme**: Dark Professional Developer IDE
