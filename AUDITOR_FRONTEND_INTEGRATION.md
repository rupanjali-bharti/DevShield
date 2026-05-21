# DevShield Auditor - Frontend Integration Guide

## Overview

The frontend React client integrates with the Python FastAPI Auditor backend to provide real-time security scanning of code files. The workflow is:

```
User selects file → Frontend sends audit request → Python Auditor scans code 
→ Semgrep + Bandit find issues → LLM generates explanations + patches → 
Frontend displays findings → User can accept patches
```

---

## Architecture

### Backend (Python - Auditor Service)
- **Port**: 8000 (FastAPI)
- **Endpoints**:
  - `POST /audit` - Audit a single file
  - `POST /patches/accept` - Accept and save a patch
  - `GET /patches/history/{project_name}` - Get patch history
  - `GET /analytics/{project_name}` - Get vulnerability analytics
  - `GET /health` - Health check

### Frontend (React - Client)
- **Services**: `auditorService.js` - API wrapper for auditor backend
- **Components**: 
  - `Workspace.jsx` - Trigger audits
  - `SecurityPanel.jsx` - Display findings
  - `CodeEditor.jsx` - Show vulnerabilities inline

---

## Setup Steps

### 1. Environment Variables

Create `.env` in the client directory:

```bash
VITE_AUDITOR_URL=http://localhost:8000
```

Or update `auditorService.js`:
```javascript
const AUDITOR_BASE_URL = process.env.VITE_AUDITOR_URL || "http://localhost:8000";
```

### 2. Start Services in Order

**Terminal 1 - MongoDB:**
```bash
mongod
# or: net start MongoDB (Windows)
```

**Terminal 2 - Python Auditor:**
```bash
cd devshield/auditor
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Terminal 3 - Node Server:**
```bash
cd devshield/server
npm run dev
```

**Terminal 4 - React Client:**
```bash
cd devshield/client
npm run dev
```

---

## Usage Examples

### Example 1: Audit Current File When Selected

**Update `Workspace.jsx`:**

```javascript
import { auditFile, formatFindings } from "../services/auditorService.js";

function Workspace() {
  const [securityFindings, setSecurityFindings] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState(null);

  const handleFileClick = useCallback(
    async (file) => {
      if (file.type === "folder") return;
      try {
        const content = await getFileContent(projectName, file.path);
        setSelectedFile(file);
        setFileContent(content);
        setSaved(false);

        // ✨ NEW: Auto-audit the file
        await handleAuditFile(projectName, file.path);
      } catch (error) {
        console.error("Failed to read file:", error);
      }
    },
    [projectName]
  );

  const handleAuditFile = async (projectName, filePath) => {
    setAuditLoading(true);
    setAuditError(null);
    try {
      const result = await auditFile(projectName, filePath);
      const formattedFindings = formatFindings(result);
      setSecurityFindings(formattedFindings);
    } catch (error) {
      setAuditError(error.message);
      console.error("Audit failed:", error);
    } finally {
      setAuditLoading(false);
    }
  };

  return (
    <div>
      {/* ... existing code ... */}
      <SecurityPanel 
        findings={securityFindings}
        loading={auditLoading}
        error={auditError}
      />
    </div>
  );
}
```

---

### Example 2: Add "Audit Now" Button

Add to Workspace toolbar:

```javascript
<button
  onClick={() => handleAuditFile(projectName, selectedFile.path)}
  disabled={!selectedFile || auditLoading}
  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded"
>
  {auditLoading ? "Scanning..." : "🔍 Audit Now"}
</button>
```

---

### Example 3: Accept Patch & Apply to File

**Update `SecurityPanel.jsx`:**

```javascript
import { acceptPatch } from "../services/auditorService.js";

function SecurityPanel({ findings = [], onApplyPatch }) {
  const handleAcceptPatch = async (finding) => {
    try {
      // Send patch to backend
      await acceptPatch({
        projectName: findings[0]?.projectName,
        filePath: findings[0]?.filePath,
        vulnerabilityId: finding.id,
        originalCode: finding.code,
        patchedCode: finding.suggestedFix,
        explanation: finding.whyDangerous,
        severity: finding.severity,
      });

      // Notify parent to update file
      if (onApplyPatch) {
        onApplyPatch({
          original: finding.code,
          patched: finding.suggestedFix,
        });
      }

      alert("✅ Patch accepted and saved!");
    } catch (error) {
      console.error("Failed to accept patch:", error);
      alert("❌ " + error.message);
    }
  };

  return (
    <div>
      {/* ... findings display ... */}
      <button
        onClick={() => handleAcceptPatch(finding)}
        className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs"
      >
        ✓ Accept Patch
      </button>
    </div>
  );
}
```

---

### Example 4: Batch Audit Project

Add function to audit all files:

```javascript
import { auditProject, formatFindings } from "../services/auditorService.js";

const handleAuditProject = async () => {
  setAuditLoading(true);
  try {
    const results = await auditProject(projectName, fileTree);
    
    // Flatten all findings
    const allFindings = results.flatMap(r => 
      formatFindings({ findings: r.findings })
    );
    
    setSecurityFindings(allFindings);
    console.log(`Found ${allFindings.length} issues across all files`);
  } catch (error) {
    setAuditError(error.message);
  } finally {
    setAuditLoading(false);
  }
};

// Add button:
<button onClick={handleAuditProject} className="...">
  🔍 Scan Project
</button>
```

---

### Example 5: Display Vulnerabilities in Code Editor

**Integrate with Monaco Editor:**

```javascript
import Editor from "@monaco-editor/react";

function CodeEditor({ code, language, findings }) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && findings.length > 0) {
      const decorations = findings.map(f => ({
        range: new window.monaco.Range(f.line, 1, f.lineEnd, 100),
        options: {
          className: `decoration-${f.severity}`,
          glyphMarginClassName: `codicon codicon-warning`,
          glyphMarginHoverMessage: [
            { value: `**${f.title}** (${f.severity})` },
            { value: f.description },
          ],
        },
      }));

      editorRef.current.deltaDecorations([], decorations);
    }
  }, [findings]);

  return (
    <Editor
      onMount={(editor) => (editorRef.current = editor)}
      value={code}
      language={language}
    />
  );
}
```

---

## Data Flow Diagram

```
Workspace.jsx
    ↓
handleAuditFile()
    ↓
auditorService.auditFile()
    ↓
Python Backend: /audit endpoint
    ↓
AST Parsing → Semgrep → Bandit → Aggregation → LLM Enrichment
    ↓
Response with findings + LLM explanations
    ↓
formatFindings() transforms data for UI
    ↓
SecurityPanel.jsx displays findings
    ↓
User clicks "Accept Patch"
    ↓
acceptPatch() → MongoDB stores for few-shot learning
```

---

## Response Format

### Audit Response
```json
{
  "status": "success",
  "file": "src/auth.py",
  "vulnerability_count": 3,
  "findings": [
    {
      "id": "semgrep::A001::45",
      "tool": "semgrep",
      "rule_id": "python.sql-injection",
      "severity": "high",
      "message": "SQL injection detected",
      "line_start": 45,
      "line_end": 47,
      "code_snippet": "query = f\"SELECT * FROM users WHERE id={user_id}\"",
      "llm": {
        "plain_english": "This code directly interpolates user input into SQL...",
        "why_dangerous": "Attackers can inject SQL commands...",
        "patched_code": "query = \"SELECT * FROM users WHERE id=?\"",
        "what_changed": "Use parameterized queries to prevent injection"
      }
    }
  ]
}
```

---

## Error Handling

```javascript
// Check auditor health before auditing
const health = await checkAuditorHealth();
if (!health) {
  showError("Auditor service not available. Make sure it's running on port 8000");
  return;
}

// Handle specific errors
try {
  await auditFile(projectName, filePath);
} catch (error) {
  if (error.message.includes("File not found")) {
    // File doesn't exist
  } else if (error.message.includes("Unsupported language")) {
    // Language not supported by auditor
  } else if (error.message.includes("Timeout")) {
    // Scan took too long
  }
}
```

---

## Performance Tips

1. **Debounce audits** - Don't audit on every keystroke:
```javascript
const debouncedAudit = useCallback(
  debounce((projectName, filePath) => handleAuditFile(projectName, filePath), 2000),
  []
);
```

2. **Cache results** - Don't re-audit unchanged files:
```javascript
const auditCache = useRef({});
```

3. **Batch operations** - Audit multiple files in parallel (with rate limiting)

4. **Background audits** - Use Web Workers for large projects

---

## Testing

### Manual Testing
```bash
# 1. Start all services
# 2. Clone a test repository
# 3. Open a file in the UI
# 4. Click "Audit Now"
# 5. Verify findings appear in SecurityPanel
# 6. Click "Accept Patch"
# 7. Check MongoDB for saved patch
```

### Automated Testing
```javascript
import { auditFile, formatFindings } from "../services/auditorService";

describe("Auditor Integration", () => {
  it("should audit a Python file", async () => {
    const result = await auditFile("test-project", "app.py");
    expect(result.findings).toBeDefined();
    expect(result.vulnerability_count).toBeGreaterThanOrEqual(0);
  });

  it("should format findings correctly", () => {
    const raw = {
      findings: [
        {
          id: "test:1",
          severity: "high",
          line_start: 1,
          llm: { plain_english: "Test" }
        }
      ]
    };
    const formatted = formatFindings(raw);
    expect(formatted[0].title).toBeDefined();
  });
});
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 404 on /audit endpoint | Python auditor not running on port 8000 |
| CORS errors | Add origin to auditor's ALLOWED_ORIGINS in config.py |
| Timeout errors | Increase LLM_TIMEOUT in auditor config |
| No findings | Check if file language is supported by auditor |
| Empty LLM response | Verify GROQ_API_KEY or Ollama is running |

---

## Next Steps

1. ✅ Create `auditorService.js` - DONE
2. ⬜ Update `Workspace.jsx` to call audit endpoints
3. ⬜ Enhance `SecurityPanel.jsx` to show LLM suggestions
4. ⬜ Add Monaco Editor decorations for vulnerabilities
5. ⬜ Implement patch acceptance workflow
6. ⬜ Add analytics dashboard
7. ⬜ Set up patch history UI
