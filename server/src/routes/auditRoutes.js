// server/src/routes/auditRoutes.js

import express from "express";
import axios from "axios";
import AuditFinding from "../models/AuditFinding.js";

const router = express.Router();
const PYTHON_AUDITOR_URL = process.env.PYTHON_AUDITOR_URL || "http://localhost:8000";

// ✅ POST / — proxy to Python, save results to MongoDB
router.post("/", async (req, res) => {
  try {
    const { projectName, filename, code } = req.body;

    // ✅ Validate required fields
    if (!projectName || !filename) {
      return res.status(400).json({ error: "projectName and filename are required" });
    }

    // ✅ Log exactly what Node is sending to Python
    console.log("[Audit] Incoming request:", {
      projectName,
      filename,
      codeLength: code ? code.length : 0,
    });

    // ✅ Forward to Python auditor
    let pythonResponse;
    try {
      pythonResponse = await axios.post(`${PYTHON_AUDITOR_URL}/audit`, {
        project_name: projectName,
        file_path: filename,
        code: code || "",
      });
    } catch (axiosErr) {
      // ✅ Catch Python-specific errors separately for cleaner diagnosis
      if (axiosErr.code === "ECONNREFUSED") {
        console.error("[Audit] Python auditor is NOT running on", PYTHON_AUDITOR_URL);
        return res.status(503).json({
          error: "Python auditor is not running. Start it with: uvicorn main:app --reload --port 8000",
        });
      }

      console.error("[Audit] Python auditor error:", {
        status: axiosErr.response?.status,
        data: axiosErr.response?.data,
        message: axiosErr.message,
      });

      const status = axiosErr.response?.status || 500;
      const message =
        axiosErr.response?.data?.detail ||
        axiosErr.response?.data?.error ||
        axiosErr.message;

      return res.status(status).json({ error: message });
    }

    // ✅ Log what Python returned
    console.log("[Audit] Python response status:", pythonResponse.status);
    console.log("[Audit] Python response data:", JSON.stringify(pythonResponse.data, null, 2));

    // ✅ Extract findings from response
    // Python returns: { status, file, vulnerability_count, findings, ... }
    let findings = pythonResponse.data.findings || pythonResponse.data;

    // ✅ Ensure findings is an array
    if (!Array.isArray(findings)) {
      if (findings && typeof findings === "object") {
        findings = [findings]; // wrap single object into array
      } else {
        findings = []; // fallback to empty
      }
    }

    // ✅ If no findings, return empty array (not an error)
    if (findings.length === 0) {
      console.log("[Audit] No findings returned for:", filename);
      return res.json([]);
    }

    console.log("[Audit] Found", findings.length, "vulnerabilities");

    // ✅ Transform findings to match MongoDB schema
    const transformedFindings = findings.map(f => ({
      ruleId: f.ruleId || f.rule || "unknown",
      label: f.label || f.message || f.title || "Unknown finding",
      severity: (f.severity || "UNKNOWN").toUpperCase(),
      line: f.line || 0,
      snippet: f.snippet || "",
      explanation: f.explanation || "",
      patch: f.patch || "",
      ...f  // keep all other fields
    }));

    // ✅ Try to save to MongoDB, but don't fail if DB is down
    try {
      console.log("[Audit] Saving findings to MongoDB:", transformedFindings.length, "findings");
      const saved = await Promise.all(
        transformedFindings.map((finding) =>
          AuditFinding.create({
            projectName,
            filename,
            ...finding,
          })
        )
      );
      console.log("[Audit] Saved successfully:", saved.length, "documents");
      return res.json(saved);
    } catch (dbErr) {
      // ✅ If DB save fails, just return the findings anyway
      console.warn("[Audit] MongoDB save failed (but continuing):", dbErr.message);
      return res.json(findings);
    }

  } catch (err) {
    // ✅ Catch-all for anything unexpected
    console.error("[Audit] Unexpected error:", {
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({ error: "Unexpected server error: " + err.message });
  }
});

// ✅ GET /:projectName — fetch past findings
router.get("/:projectName", async (req, res) => {
  try {
    const findings = await AuditFinding.find({
      projectName: req.params.projectName,
    }).sort({ createdAt: -1 });

    res.json(findings);
  } catch (err) {
    console.error("[Audit] GET findings error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ PATCH /:id/accept — mark patch as accepted
router.patch("/:id/accept", async (req, res) => {
  try {
    const updated = await AuditFinding.findByIdAndUpdate(
      req.params.id,
      { patchAccepted: true },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Finding not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("[Audit] PATCH accept error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
