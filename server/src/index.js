import express from "express";
import http from "http";
import cors from "cors";
import { createRequire } from "module";
import gitRoutes from "./routes/gitRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/git", gitRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/audit", auditRoutes);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
