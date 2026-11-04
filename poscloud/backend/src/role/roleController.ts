import { Request, Response } from "express";
import {
  registerUser,
  loginUser,
  getAllUsers,
  changeUserRole,
  getRoleDefinitions,
  findUserById,
} from "./roleService";

/**
 * Sign up / Register new account.
 * Note: Role is ALWAYS enforced to 'user'.
 */
export async function handleRegister(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        error: "Missing required fields: name, email, and password.",
      });
      return;
    }

    const { user, token } = await registerUser({ name, email, password });

    res.status(201).json({
      success: true,
      message: `Account created successfully with default role '${user.role}'.`,
      user,
      token,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error?.message || "Registration failed.",
    });
  }
}

/**
 * Sign In / Login to account.
 */
export async function handleLogin(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: "Email and password are required.",
      });
      return;
    }

    const { user, token } = await loginUser({ email, password });

    res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      user,
      token,
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: error?.message || "Invalid credentials.",
    });
  }
}

/**
 * Get profile of currently authenticated user.
 */
export async function handleGetMe(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Not authenticated" });
      return;
    }

    const user = await findUserById(req.user.id);
    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    const { passwordHash, ...safe } = user;
    res.json({ success: true, user: safe });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message });
  }
}

/**
 * List all users. Accessible to admin and super_admin.
 */
export async function handleListUsers(req: Request, res: Response): Promise<void> {
  try {
    const users = await getAllUsers();
    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message });
  }
}

/**
 * Change role of a user.
 * Restricted to super_admin or admin.
 */
export async function handleChangeRole(req: Request, res: Response): Promise<void> {
  try {
    const requester = req.user;
    if (!requester) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }

    // Support both URL param :id and body targetUserId / userId
    const targetUserId = req.params.id || req.body.userId || req.body.targetUserId;
    const newRole = req.body.role || req.body.newRole;

    if (!targetUserId || !newRole) {
      res.status(400).json({
        success: false,
        error: "targetUserId and newRole are required.",
      });
      return;
    }

    const updatedUser = await changeUserRole({
      requesterUser: requester,
      targetUserId,
      newRole,
    });

    res.json({
      success: true,
      message: `Role for ${updatedUser.name} (${updatedUser.email}) successfully updated to '${updatedUser.role}'.`,
      user: updatedUser,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error?.message || "Failed to update role.",
    });
  }
}

/**
 * List all system roles and descriptions.
 */
export async function handleGetRoles(req: Request, res: Response): Promise<void> {
  try {
    const roles = await getRoleDefinitions();
    res.json({
      success: true,
      roles,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message });
  }
}
