// server/models/AuditFinding.js

import mongoose from "mongoose";

const AuditFindingSchema = new mongoose.Schema(
  {
    projectName: {
      type: String,
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    ruleId: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    line: {
      type: Number,
      required: true,
    },
    snippet: {
      type: String,
    },
    explanation: {
      type: String,
    },
    patch: {
      type: String,
    },
    severity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL", "UNKNOWN"],
      default: "UNKNOWN",
    },
    patchAccepted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }   // adds createdAt and updatedAt automatically
);

export default mongoose.model("AuditFinding", AuditFindingSchema);
