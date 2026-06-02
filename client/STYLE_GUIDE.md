# DevShield UI Style Guide

## Color System

### Primary Palette

#### Background Colors
```
Deep Black:        #111111 (bg-gray-950)
Charcoal:          #1a1a1a (bg-gray-900)
Dark Gray:         #1f2937 (bg-gray-800)
Mid Gray:          #374151 (border-gray-700)
Light Gray:        #6b7280 (text-gray-500)
Light Text:        #f3f4f6 (text-gray-100)
```

#### Semantic Colors
```
✓ Success:         #10b981 (emerald-500) / #22c55e (green-500)
⚠ Warning:         #f97316 (orange-500) / #fbbf24 (amber-400)
✗ Error:           #ef4444 (red-500) / #dc2626 (red-600)
ℹ Info:            #3b82f6 (blue-500) / #06b6d4 (cyan-500)
```

### Severity Colors

#### Risk Level Indicators
```
CRITICAL (8-10):   
  Icon:    🔴
  Color:   text-red-500
  BG:      bg-red-500/20
  Badge:   bg-red-600 text-white
  Use:     Immediate action required

HIGH (6-8):
  Icon:    🟠
  Color:   text-orange-500
  BG:      bg-orange-500/20
  Badge:   bg-orange-600 text-white
  Use:     Priority issues

MEDIUM (4-6):
  Icon:    🟡
  Color:   text-yellow-500
  BG:      bg-yellow-500/20
  Badge:   bg-orange-500 text-white
  Use:     Should be addressed

LOW (2-4):
  Icon:    🔵
  Color:   text-blue-500
  BG:      bg-blue-500/20
  Badge:   bg-yellow-600 text-white
  Use:     Nice to have

SAFE (0-2):
  Icon:    🟢
  Color:   text-green-500
  BG:      bg-green-500/20
  Badge:   bg-green-500 text-white
  Use:     No action needed
```

### Accent & Button Colors

#### Primary Button (Accept AI Patch)
```
Default State:
  Background:  gradient-to-r from-green-500 to-emerald-500
  Text:        text-white
  Font:        font-semibold
  Size:        px-6 py-2

Hover State:
  Background:  gradient-to-r from-green-400 to-emerald-400
  Shadow:      shadow-lg hover:shadow-green-500/50
  Transform:   transform hover:scale-105

Glow Effect:
  Animation:   animate-pulse
  Color:       gradient-to-r from-green-400 to-emerald-400
  Blur:        blur opacity-0 group-hover:opacity-100
```

#### Secondary Button
```
Default:   bg-gray-700 text-white
Hover:     bg-gray-600
Disabled:  bg-gray-600 opacity-50 cursor-not-allowed
```

### Code Syntax Highlighting (Monaco Theme)

```
Language:       vs-dark
Keywords:       #569cd6 (blue)
Strings:        #ce9178 (orange/brown)
Numbers:        #b5cea8 (green)
Functions:      #dcdcdc (white)
Comments:       #6a9955 (green)
Variables:      #9cdcfe (cyan)
Operators:      #d4d4d4 (gray)
Keywords (JS):  #d7ba7d (gold)
```

---

## Component Styling Specifications

### File Tree Item
```
Default:
  text-gray-300
  hover:bg-gray-700
  py-1.5 px-2
  rounded

Selected:
  bg-gray-700
  text-green-400
  font-medium

Folder Icon:     📂 (yellow-400) / 📁 (yellow-400)
File Icon:       📄 (blue-400)
Issue Icon:      ⚠ (red-400)
```

### Audit Finding Badge
```
CRIT Badge:
  bg-red-600
  text-white
  px-1.5 py-0.5
  rounded
  text-xs
  font-bold

MED Badge:
  bg-orange-500
  text-white
  px-1.5 py-0.5
  rounded
  text-xs
  font-bold

LOW Badge:
  bg-yellow-600
  text-white
  px-1.5 py-0.5
  rounded
  text-xs
  font-bold
```

### Diff Editor Header
```
Background:      bg-gray-900
Border:          border-b border-gray-700
Padding:         px-4 py-3
Layout:          flex items-center justify-between
```

### Vulnerable Code Section (Left Side)
```
Header Label:    "⚠ VULNERABLE CODE"
Text Color:      text-red-500
Background:      bg-gray-900
Border:          border-b border-gray-700
Highlight BG:    bg-red-900/20 (for vulnerable lines)
Highlight Text:  text-red-300
```

### Patched Code Section (Right Side)
```
Header Label:    "✓ AI-SUGGESTED PATCH"
Text Color:      text-emerald-500
Background:      bg-gray-900
Border:          border-b border-gray-700
Highlight BG:    bg-emerald-900/20 (for fixed lines)
Highlight Text:  text-emerald-300
```

### AI Insights Panel
```
Width:           300px (fixed)
Background:      bg-gray-800
Border:          border-l border-gray-700
Header:          px-4 py-3 border-b border-gray-700

Risk Score Box:
  Background:    dynamic (red/orange/yellow/blue/green)
  Border:        dynamic color/30 opacity
  Text Color:    dynamic (dark shade of color)
  Font Size:     text-5xl (score), text-2xl (level)
  Font Weight:   font-bold

Issue List:
  Item BG:       hover:bg-gray-700/30
  Divider:       divide-y divide-gray-700
  Padding:       px-4 py-3
  Font Size:     text-xs
```

### Terminal Panel
```
Default Height:  240px
Min Height:      80px
Max Height:      800px
Background:      bg-gray-900
Border:          border-t border-gray-700

Resize Handle:
  Height:        h-1
  Color:         bg-gray-700
  Hover:         hover:bg-blue-600
  Cursor:        cursor-row-resize

Content:
  Font:          monospace (font-mono)
  Size:          text-sm
  Color:         text-gray-200
  Background:    bg-gray-950
```

### Landing Page
```
Hero Section:
  Background:    gradient-to-b from-gray-950 via-gray-900 to-gray-950
  Min Height:    min-h-screen
  Padding:       px-4 py-20

Animated Blobs:
  Green Blob:    w-96 h-96 bg-green-500 rounded-full blur-3xl
  Blue Blob:     w-96 h-96 bg-blue-500 rounded-full blur-3xl
  Mix Mode:      mix-blend-multiply filter
  Opacity:       opacity-20
  Animation:     animate-pulse (with delays)

Feature Cards:
  Background:    bg-gray-800/50 backdrop-blur-sm
  Border:        border border-gray-700
  Hover:         hover:border-green-400
  Padding:       p-6
  Transition:    transition-all

Main Card:
  Background:    bg-gray-800/80 backdrop-blur-sm
  Border:        border border-gray-700
  Padding:       p-8
  Shadow:        shadow-2xl
  Border Radius: rounded-2xl
```

### Dropdown Selector
```
Background:      bg-gray-700
Text:            text-white
Font Size:       text-sm
Padding:         px-4 py-3
Border Radius:   rounded-lg
Focus:           focus:ring-2 focus:ring-green-400
Appearance:      appearance-none (custom arrow)

Arrow Icon:
  Background:    right 0.75rem center
  Size:          1.5em 1.5em
  Color:         rgb(74,222,128) (green-400)
```

---

## Typography Scale

### Font Families
```
Monospace (Code):     Fira Code, Monaco, Courier New
UI Text:              System fonts (-apple-system, BlinkMacSystemFont, "Segoe UI")
```

### Font Sizes & Weights

| Element | Size | Weight | Line Height | Letter Spacing |
|---------|------|--------|-------------|----------------|
| Hero Title | 6xl (60px) | bold | 1 | - |
| Page Heading | 2xl (24px) | bold | 1.2 | - |
| Section Header | lg (18px) | semibold | 1.25 | - |
| Panel Header | sm (14px) | semibold | 1.5 | - |
| Body Text | sm (14px) | normal | 1.5 | - |
| Small Text | xs (12px) | normal | 1.5 | - |
| Code (Editor) | 13px | 400 | 1.5 | - |
| Labels | xs (12px) | normal | 1.5 | 0.05em |
| Uppercase Labels | xs (12px) | normal | 1.5 | 0.05em |

---

## Spacing System

### Padding & Margin
```
xs:  0.5rem  (8px)   - Small elements
sm:  1rem    (16px)  - Standard spacing
md:  1.5rem  (24px)  - Section spacing
lg:  2rem    (32px)  - Large spacing
xl:  3rem    (48px)  - Extra large

Padding Classes:
  p-2:   0.5rem all sides
  p-3:   0.75rem all sides
  p-4:   1rem all sides
  px-4:  1rem horizontal
  py-3:  0.75rem vertical
```

### Gap & Gaps
```
gap-2:  0.5rem
gap-3:  0.75rem
gap-4:  1rem
gap-6:  1.5rem
```

---

## Border & Shadow Styles

### Borders
```
Default:        border border-gray-700 (1px solid #374151)
Thick:          border-2
Top Only:       border-t
Bottom Only:    border-b
Left Only:      border-l
Right Only:     border-r
```

### Shadows
```
Small:          shadow (0 1px 2px 0 rgba(0, 0, 0, 0.05))
Medium:         shadow-md (0 4px 6px -1px rgba(0, 0, 0, 0.1))
Large:          shadow-lg (0 10px 15px -3px rgba(0, 0, 0, 0.1))
XL:             shadow-xl (0 20px 25px -5px rgba(0, 0, 0, 0.1))

Green Glow:     hover:shadow-green-500/50
Blue Glow:      hover:shadow-blue-600
```

---

## Animation & Transitions

### Animations
```
animate-spin:          Linear rotation (1s)
animate-pulse:         Opacity fade (2s)
group-hover:opacity    Group hover effects
```

### Transitions
```
transition:           All properties (150ms ease)
transition-colors:    Color properties only
transition-all:       All properties (200ms)
duration-200:         200ms duration
duration-300:         300ms duration
```

### Transform Effects
```
hover:scale-105:      Scale up 105% on hover
transform:            Enable transform
translate-y-1:        Translate Y by 0.25rem
```

---

## Interactive States

### Buttons

#### Primary (Accept AI Patch)
```
Idle:
  bg-gradient-to-r from-green-500 to-emerald-500
  text-white
  font-semibold
  shadow-lg
  
Hover:
  from-green-400 to-emerald-400
  shadow-lg shadow-green-500/50
  scale-105
  
Active (Loading):
  opacity-50
  cursor-not-allowed
  
Glow:
  Pseudo-element with green gradient
  opacity-0 → opacity-100 on hover
  blur effect
  animate-pulse
```

#### Secondary
```
Idle:
  bg-gray-700
  text-white
  hover:bg-gray-600
  
Disabled:
  opacity-50
  cursor-not-allowed
```

### Input Fields
```
Idle:
  bg-gray-700
  text-white
  px-4 py-3
  rounded-lg
  outline-none
  
Focus:
  ring-2
  ring-green-400
  
Placeholder:
  text-gray-500
```

### Expandable Panels
```
Collapsed:
  height: auto (content height)
  opacity: 1
  
Expanded:
  Show additional content
  Border-top: border-t border-gray-600
  Padding-top: pt-3
```

---

## Accessibility

### Color Contrast
```
Background (#1f2937) + Text (#ffffff):    Ratio 10.5:1 ✓ WCAG AAA
Background (#1f2937) + Text (#6b7280):    Ratio 4.5:1 ✓ WCAG AA
Button (green-500) + White:               Ratio 4.5:1 ✓ WCAG AA
Alert Red (#ef4444) + White:              Ratio 4.2:1 ✓ WCAG AA
```

### Focus States
```
All interactive elements have focus ring:
  focus:ring-2
  focus:ring-green-400
  focus:outline-none
```

### Text Legibility
```
Minimum font size:     12px (for secondary text)
Line height:           1.5 (comfortable reading)
Letter spacing:        0.05em (uppercase labels)
Max line length:       100 characters
```

---

## Dark Mode Considerations

Since the entire app is dark-themed:
- No light mode toggle needed
- All colors optimized for dark backgrounds
- High contrast ratios maintained
- Blue light emission minimized (warm tones where possible)
- Reduced brightness for long coding sessions

---

## Responsive Breakpoints

```
Mobile:    < 768px     (Not supported - IDE requires wider view)
Tablet:    768-1024px  (Not ideal - minimum 1200px recommended)
Desktop:   1024-1440px (Good)
Large:     > 1440px    (Excellent)

Recommended Minimum: 1200px width
Optimal:            1400-1600px width
```

### Behavior by Breakpoint
```
< 1200px:  Layout breaks, horizontal scrolling required
1200px+:   All columns visible and functional
1600px+:   Comfortable spacing, optimal experience
```

---

## Design Tokens Summary

```json
{
  "colors": {
    "primary": "#10b981",
    "success": "#22c55e",
    "warning": "#f97316",
    "error": "#ef4444",
    "info": "#3b82f6",
    "critical": "#dc2626",
    "bg-primary": "#1a1a1a",
    "bg-secondary": "#1f2937",
    "text-primary": "#f3f4f6",
    "text-secondary": "#d1d5db"
  },
  "spacing": {
    "xs": "0.5rem",
    "sm": "1rem",
    "md": "1.5rem",
    "lg": "2rem"
  },
  "typography": {
    "monospace": "Fira Code, Monaco",
    "body": "system-ui",
    "sizes": {
      "xs": "12px",
      "sm": "14px",
      "md": "16px",
      "lg": "18px"
    }
  }
}
```

---

**Last Updated**: June 2, 2026  
**Version**: 1.0  
**Theme**: DevShield Dark Professional IDE
