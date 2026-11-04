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
    origin:
      corsOrigin === "*"
        ? "*"
        : [
            corsOrigin,
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3001",
          ],
    credentials: true,
  })
);
app.use(express.json());

// API Routes mounted at /api
app.use("/api", apiRoutes);

import { seedInitialRolesAndUsers } from "./role";

// Root health check endpoint
app.get("/", (req, res) => {
  res.json({
    name: "Cloud POS API Backend",
    version: "1.0.0",
    status: "online",
    endpoints: [
      "/api/status",
      "/api/role/login",
      "/api/role/register",
      "/api/role/users",
      "/api/role/change-role",
      "/api/orders",
      "/api/waiters",
      "/api/reports/today",
      "/api/sales/daily",
    ],
  });
});

// Start server
app.listen(port, async () => {
  console.log(`[Cloud POS Backend] Server running at http://localhost:${port}`);
  console.log(`[Cloud POS Backend] API routes mounted at http://localhost:${port}/api`);
  try {
    await seedInitialRolesAndUsers();
    console.log(`[Cloud POS Backend] Role management and initial user roles initialized.`);
  } catch (err) {
    console.warn(`[Cloud POS Backend] Role initial seed warning:`, err);
  }
});
