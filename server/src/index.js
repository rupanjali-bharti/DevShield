const express = require("express");
const http = require("http");
const cors = require("cors");
const gitRoutes = require("./routes/gitRoutes");
const fileRoutes = require("./routes/fileRoutes");

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

app.use("/api/git", gitRoutes);
app.use("/api/files", fileRoutes);

app.get("/", (req, res) => {
  res.json({ message: "DevShield server running" });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`DevShield server running on port ${PORT}`);
});