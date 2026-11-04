import { Request, Response, NextFunction } from "express";
import { verifyToken, findUserById } from "./roleService";
import { PublicUser, UserRole } from "./roleTypes";

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: PublicUser;
    }
  }
}

/**
 * Authentication Middleware: Extracts JWT from Bearer token or fallback user headers.
 */
export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;

  if (token) {
    const verified = verifyToken(token);
    if (verified) {
      // Fetch latest user state from DB
      const latest = await findUserById(verified.id);
      if (latest && latest.status !== "disabled") {
        const { passwordHash, ...safeUser } = latest;
        req.user = safeUser;
        return next();
      }
    }
  }

  // Fallback support for client header emulation (e.g., active user ID from front-end session)
  const headerUserId = req.headers["x-user-id"] as string | undefined;
  if (headerUserId) {
    const user = await findUserById(headerUserId);
    if (user && user.status !== "disabled") {
      const { passwordHash, ...safeUser } = user;
      req.user = safeUser;
      return next();
    }
  }

  res.status(401).json({
    success: false,
    error: "Authentication required. Please log in to continue.",
  });
}

/**
 * Authorize only users with specific allowed roles (e.g. admin or super_admin).
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: "Unauthenticated. Please log in.",
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Forbidden: This action requires one of the following roles: ${allowedRoles.join(", ")}. Your current role is '${req.user.role}'.`,
      });
      return;
    }

    next();
  };
}
