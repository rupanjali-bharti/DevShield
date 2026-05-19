# DevShield UI Layout Overview

## New Three-Panel Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  DevShield | project-name     [Terminal ⌄] [Save] [Home] ← → ✓  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  EXPLORER         │                      │    FINDINGS          │
│  ─────────────    │    CODE EDITOR      │    ──────────        │
│                   │                      │                      │
│  📁 src          │    1  import sqlite3 │    ● Critical: 2    │
│  📁 models       │    2  from flask...  │    ⚠ Medium:   1    │
│  ⚠ auth.py [2]  │    3  def get_user   │    ⓘ Info:     3    │
│  📄 db.py [1]    │    4  (username):    │                      │
│  📄 routes.py    │    5    conn = sql...│    SQL Injection    │
│  📄 models.py    │    6    query = "SE..│    Line 5           │
│                   │    7    result = co..│    [▾ EXPAND]       │
│                   │    8    return resu..│                      │
│                   │    9                 │    Password Issue   │
│  ⚠ = 3 issues    │    10  def verify_pa..│    Line 12          │
│                   │    11  #compare pla..│    [▾ EXPAND]       │
│                   │    12  return pw == ..│                      │
│                   │                      │    API Key Exposed  │
│                   │                      │    Line 3           │
│                   │                      │    [▾ EXPAND]       │
│                   │                      │                      │
├─────────────────────────────────────────────────────────────────┤
│  ═══════════════════════════════════════════════  (Drag to resize)│
│  Terminal Ready                                                 │
│  $ █                                                            │
│  Try: git status • npm run dev • python script.py              │
└─────────────────────────────────────────────────────────────────┘
```

## Key Features

### Left Sidebar (File Tree)
- Explorer header with project name
- File tree with folder/file icons
- Issue badges showing count (🔴 red for 5+, 🟠 orange for 3+, 🟡 yellow for 1-2)
- Selected file highlighting
- Total issues summary

### Center (Code Editor)
- Full code display with line numbers
- File content and editing capabilities
- Currently selected file display

### Right Sidebar (Security Panel)
- Summary statistics at top:
  - Critical count
  - Medium count
  - Info count
- Expandable findings list:
  - Severity indicator (colored dot)
  - Finding title and line number
  - On expand shows:
    - Full description
    - Code snippet
    - AI suggested fix with Accept/Reject buttons
    - CWE/CVE information

### Bottom Terminal
- Collapsible with toggle button (Terminal ⌄/✕)
- Draggable resize handle (hover shows blue)
- Default height: 240px
- Min/max height: 80px to 800px
- Clear button and close button
- Command history with arrow keys
- Git, npm, python command support

## Color Scheme
- Background: #111827 (gray-900)
- Panels: #1F2937 (gray-800)
- Critical: Red (#EF4444)
- Medium: Yellow (#EAB308)
- Info: Blue (#3B82F6)
- Success/Highlight: Green (#4ADE80)
- Text: Light gray (#E5E7EB)

## Interactions
- Click file to open → loads in editor
- Click finding to expand → shows full details
- Drag terminal resize handle → adjusts terminal height
- Ctrl+S → Save file
- Ctrl+\` → Toggle terminal
- Arrow Up/Down in terminal → Navigate command history
