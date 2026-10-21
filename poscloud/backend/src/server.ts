import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiRoutes from "./routes";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:3000";

// Middleware
app.use(
  cors({
    origin: corsOrigin === "*" ? "*" : [corsOrigin, "http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  })
);
app.use(express.json());

// API Routes mounted at /api
app.use("/api", apiRoutes);

// Root health check endpoint
app.get("/", (req, res) => {
  res.json({
    name: "Cloud POS API Backend",
    version: "1.0.0",
    status: "online",
    endpoints: [
      "/api/status",
      "/api/orders",
      "/api/waiters",
      "/api/reports/today",
    ],
  });
});

// Start server
app.listen(port, () => {
  console.log(`[Cloud POS Backend] Server running at http://localhost:${port}`);
  console.log(`[Cloud POS Backend] API routes mounted at http://localhost:${port}/api`);
});
