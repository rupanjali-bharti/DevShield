// server/routes/auditRoutes.js

import express from "express";
import AuditFinding from "../models/AuditFinding.js";

const router = express.Router();

// Note: auditCode import commented out - auditorService doesn't exist yet
// import { auditCode } from "../services/auditorService.js";

// POST /api/audit
// Body: { code: "...", filename: "index.js", projectName: "my-project" }
router.post("/", async (req, res) => {
  try {
    const { code, filename, projectName } = req.body;
    if (!code) return res.status(400).json({ error: "No code provided" });

    const findings = await auditCode(code, filename || "unknown");

    // Save each finding to MongoDB
    const saved = await AuditFinding.insertMany(
      findings.map((f) => ({ ...f, projectName: projectName || "unknown" }))
    );

    res.json({ findings: saved });
  } catch (err) {
    console.error("Audit error:", err.message);
    res.status(500).json({ error: "Audit failed", detail: err.message });
  }
});

// GET /api/audit/:projectName — fetch past findings for a project
router.get("/:projectName", async (req, res) => {
  try {
    const findings = await AuditFinding.find({
      projectName: req.params.projectName,
    }).sort({ createdAt: -1 });

    res.json({ findings });
  } catch (err) {
    res.status(500).json({ error: "Fetch failed", detail: err.message });
  }
});

// PATCH /api/audit/:id/accept — mark a patch as accepted
router.patch("/:id/accept", async (req, res) => {
  try {
    const updated = await AuditFinding.findByIdAndUpdate(
      req.params.id,
      { patchAccepted: true },
      { new: true }
    );
    res.json({ updated });
  } catch (err) {
    res.status(500).json({ error: "Update failed", detail: err.message });
  }
});

export default router;
