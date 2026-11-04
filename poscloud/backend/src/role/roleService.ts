import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDatabase } from "../config/db";
import {
  UserRole,
  UserRecord,
  PublicUser,
  AVAILABLE_ROLES,
  RoleDefinition,
} from "./roleTypes";

const JWT_SECRET = process.env.JWT_SECRET || "bgs-cloud-pos-secret-jwt-key-2026";
const JWT_EXPIRES_IN = "7d";

// Memory fallback store
let memoryUsers: UserRecord[] = [];
let isSeeded = false;

function sanitizeUser(user: UserRecord): PublicUser {
  const { passwordHash, ...rest } = user;
  return rest;
}

export function generateToken(user: PublicUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyToken(token: string): PublicUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      id: decoded.id,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role,
      createdAt: "",
      updatedAt: "",
      status: "active",
    };
  } catch {
    return null;
  }
}

/**
 * Seed initial roles and standard demo accounts if none exist in the database.
 */
export async function seedInitialRolesAndUsers(): Promise<void> {
  if (isSeeded) return;

  const db = await getDatabase();
  const defaultAccounts: { name: string; email: string; pass: string; role: UserRole }[] = [
    {
      name: "Super Administrator",
      email: "superadmin@cloudpos.com",
      pass: "SuperAdmin123!",
      role: "super_admin",
    },
    {
      name: "System Admin",
      email: "admin@cloudpos.com",
      pass: "Admin123!",
      role: "admin",
    },
    {
      name: "Standard Staff User",
      email: "user@cloudpos.com",
      pass: "User123!",
      role: "user",
    },
  ];

  // Seed roles collection
  if (db) {
    try {
      const rolesCol = db.collection<RoleDefinition>("roles");
      for (const roleDef of AVAILABLE_ROLES) {
        await rolesCol.updateOne(
          { id: roleDef.id },
          { $set: roleDef },
          { upsert: true }
        );
      }
    } catch (err) {
      console.warn("[Role Service] Failed to seed roles collection:", err);
    }
  }

  // Seed default users if empty
  for (const acc of defaultAccounts) {
    const existing = await findUserByEmail(acc.email);
    if (!existing) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(acc.pass, salt);
      const now = new Date().toISOString();
      const newUser: UserRecord = {
        id: `u_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: acc.name,
        email: acc.email.toLowerCase(),
        passwordHash: hash,
        role: acc.role,
        createdAt: now,
        updatedAt: now,
        status: "active",
      };

      if (db) {
        try {
          const usersCol = db.collection<UserRecord>("users");
          await usersCol.insertOne(newUser);
        } catch (err) {
          console.warn(`[Role Service] Error inserting seed user ${acc.email}:`, err);
        }
      }

      memoryUsers.push(newUser);
    }
  }

  isSeeded = true;
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const db = await getDatabase();
  if (db) {
    try {
      const usersCol = db.collection<UserRecord>("users");
      const found = await usersCol.findOne({ email: normalizedEmail });
      if (found) return found;
    } catch (err) {
      console.warn("[Role Service] MongoDB findUserByEmail failed:", err);
    }
  }

  return memoryUsers.find((u) => u.email === normalizedEmail) || null;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  const db = await getDatabase();
  if (db) {
    try {
      const usersCol = db.collection<UserRecord>("users");
      const found = await usersCol.findOne({ id });
      if (found) return found;
    } catch (err) {
      console.warn("[Role Service] MongoDB findUserById failed:", err);
    }
  }

  return memoryUsers.find((u) => u.id === id) || null;
}

/**
 * Register a new user.
 * STRICT ENFORCEMENT: Whenever ANY person signs up, their assigned role is ALWAYS "user".
 * Roles can subsequently ONLY be changed by an admin or super admin.
 */
export async function registerUser(params: {
  name: string;
  email: string;
  password: string;
}): Promise<{ user: PublicUser; token: string }> {
  await seedInitialRolesAndUsers();

  const name = params.name.trim();
  const email = params.email.trim().toLowerCase();

  if (!name || name.length < 2) {
    throw new Error("Full name must be at least 2 characters long.");
  }

  if (!email || !email.includes("@")) {
    throw new Error("A valid email address is required.");
  }

  if (!params.password || params.password.length < 6) {
    throw new Error("Password must be at least 6 characters long.");
  }

  // Check duplicate
  const existing = await findUserByEmail(email);
  if (existing) {
    throw new Error("An account with this email address already exists.");
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(params.password, salt);
  const now = new Date().toISOString();

  // Explicitly force role to 'user' for ALL signups
  const assignedRole: UserRole = "user";

  const newUser: UserRecord = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    name,
    email,
    passwordHash,
    role: assignedRole,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
    status: "active",
  };

  const db = await getDatabase();
  if (db) {
    try {
      const usersCol = db.collection<UserRecord>("users");
      await usersCol.insertOne(newUser);
    } catch (err) {
      console.warn("[Role Service] Failed to save new user to MongoDB, fallback to memory:", err);
    }
  }

  memoryUsers.unshift(newUser);

  const publicUser = sanitizeUser(newUser);
  const token = generateToken(publicUser);

  return { user: publicUser, token };
}

/**
 * Authenticate existing user with email and password.
 */
export async function loginUser(params: {
  email: string;
  password: string;
}): Promise<{ user: PublicUser; token: string }> {
  await seedInitialRolesAndUsers();

  const email = params.email.trim().toLowerCase();
  const user = await findUserByEmail(email);

  if (!user) {
    throw new Error("Invalid email or password.");
  }

  if (user.status === "disabled") {
    throw new Error("Your account has been deactivated. Please contact an administrator.");
  }

  const isMatch = await bcrypt.compare(params.password, user.passwordHash);
  if (!isMatch) {
    throw new Error("Invalid email or password.");
  }

  const now = new Date().toISOString();
  user.lastLoginAt = now;
  user.updatedAt = now;

  const db = await getDatabase();
  if (db) {
    try {
      const usersCol = db.collection<UserRecord>("users");
      await usersCol.updateOne(
        { id: user.id },
        { $set: { lastLoginAt: now, updatedAt: now } }
      );
    } catch (err) {
      console.warn("[Role Service] Update lastLoginAt error:", err);
    }
  }

  const publicUser = sanitizeUser(user);
  const token = generateToken(publicUser);

  return { user: publicUser, token };
}

/**
 * Get all registered users.
 */
export async function getAllUsers(): Promise<PublicUser[]> {
  await seedInitialRolesAndUsers();

  const db = await getDatabase();
  if (db) {
    try {
      const usersCol = db.collection<UserRecord>("users");
      const list = await usersCol.find({}).sort({ createdAt: -1 }).toArray();
      if (list && list.length > 0) {
        return list.map(sanitizeUser);
      }
    } catch (err) {
      console.warn("[Role Service] MongoDB getAllUsers failed, using memory:", err);
    }
  }

  return memoryUsers.map(sanitizeUser);
}

/**
 * Change a user's role.
 * Authorization rules:
 * - Only super_admin or admin can change user roles.
 * - Admin can change regular 'user' role, but CANNOT elevate anyone to 'super_admin' or modify another 'admin'/'super_admin'.
 * - Super admin has full authority over all roles.
 * - Cannot demote the last remaining super_admin.
 */
export async function changeUserRole(params: {
  requesterUser: PublicUser;
  targetUserId: string;
  newRole: string;
}): Promise<PublicUser> {
  await seedInitialRolesAndUsers();

  const { requesterUser, targetUserId } = params;
  let newRole = params.newRole.toLowerCase().trim() as UserRole;

  // Accept friendly variations e.g. "super admin" -> "super_admin"
  if (newRole === ("super admin" as any)) newRole = "super_admin";

  const validRoles: UserRole[] = ["super_admin", "admin", "user"];
  if (!validRoles.includes(newRole)) {
    throw new Error(`Invalid role '${newRole}'. Allowed roles: ${validRoles.join(", ")}`);
  }

  // Authorization check
  if (requesterUser.role !== "super_admin" && requesterUser.role !== "admin") {
    throw new Error("Access Denied: Only Admins and Super Admins have permission to modify roles.");
  }

  const target = await findUserById(targetUserId);
  if (!target) {
    throw new Error("Target user not found.");
  }

  // Admin specific constraints
  if (requesterUser.role === "admin") {
    if (target.role === "super_admin") {
      throw new Error("Admins cannot modify the role of a Super Admin.");
    }
    if (newRole === "super_admin") {
      throw new Error("Admins cannot grant Super Admin privileges. Only a Super Admin can do so.");
    }
    if (target.role === "admin" && target.id !== requesterUser.id) {
      throw new Error("Admins cannot modify another Admin's role.");
    }
  }

  // Protect against demoting the sole Super Admin
  if (target.role === "super_admin" && newRole !== "super_admin") {
    const all = await getAllUsers();
    const superAdminCount = all.filter((u) => u.role === "super_admin").length;
    if (superAdminCount <= 1) {
      throw new Error("Cannot demote the only remaining Super Admin in the system.");
    }
  }

  const now = new Date().toISOString();
  target.role = newRole;
  target.updatedAt = now;

  const db = await getDatabase();
  if (db) {
    try {
      const usersCol = db.collection<UserRecord>("users");
      await usersCol.updateOne(
        { id: target.id },
        { $set: { role: newRole, updatedAt: now } }
      );
    } catch (err) {
      console.warn("[Role Service] MongoDB changeUserRole failed:", err);
    }
  }

  const memIdx = memoryUsers.findIndex((u) => u.id === target.id);
  if (memIdx >= 0) {
    memoryUsers[memIdx].role = newRole;
    memoryUsers[memIdx].updatedAt = now;
  }

  return sanitizeUser(target);
}

/**
 * Get available roles list.
 */
export async function getRoleDefinitions(): Promise<RoleDefinition[]> {
  const db = await getDatabase();
  if (db) {
    try {
      const rolesCol = db.collection<RoleDefinition>("roles");
      const list = await rolesCol.find({}).toArray();
      if (list && list.length > 0) return list;
    } catch (err) {
      console.warn("[Role Service] getRoleDefinitions error:", err);
    }
  }
  return AVAILABLE_ROLES;
}
