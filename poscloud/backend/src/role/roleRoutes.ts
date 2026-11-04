import { Router } from "express";
import {
  handleRegister,
  handleLogin,
  handleGetMe,
  handleListUsers,
  handleChangeRole,
  handleGetRoles,
} from "./roleController";
import { authenticateToken, requireRole } from "./roleMiddleware";

const router = Router();

// Public auth endpoints
router.post("/register", handleRegister);
router.post("/signup", handleRegister);
router.post("/login", handleLogin);
router.get("/definitions", handleGetRoles);
router.get("/list", handleGetRoles);

// Authenticated user profile
router.get("/me", authenticateToken, handleGetMe);

// Role management endpoints (Requires super_admin or admin)
router.get(
  "/users",
  authenticateToken,
  requireRole(["super_admin", "admin"]),
  handleListUsers
);

router.post(
  "/change-role",
  authenticateToken,
  requireRole(["super_admin", "admin"]),
  handleChangeRole
);

router.put(
  "/users/:id/role",
  authenticateToken,
  requireRole(["super_admin", "admin"]),
  handleChangeRole
);

export default router;
