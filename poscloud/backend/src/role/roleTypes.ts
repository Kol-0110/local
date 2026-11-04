export type UserRole = "super_admin" | "admin" | "user";

export interface RoleDefinition {
  id: UserRole;
  name: string;
  badge: string;
  color: string;
  description: string;
  permissions: string[];
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  status: "active" | "disabled";
}

export type PublicUser = Omit<UserRecord, "passwordHash">;

export const AVAILABLE_ROLES: RoleDefinition[] = [
  {
    id: "super_admin",
    name: "Super Admin",
    badge: "👑 Super Admin",
    color: "purple",
    description: "Highest level access. Full control over system, branches, user roles, security, and financial audits.",
    permissions: [
      "manage_all_roles",
      "manage_admins",
      "manage_branches",
      "full_pos_access",
      "financial_reports",
      "system_settings",
      "delete_records",
    ],
  },
  {
    id: "admin",
    name: "Admin",
    badge: "🛡️ Admin",
    color: "emerald",
    description: "Operational administrator. Manages daily restaurant operations, staff, menu items, and standard user roles.",
    permissions: [
      "manage_user_roles",
      "manage_waiters",
      "manage_menu",
      "manage_orders",
      "view_reports",
      "pos_access",
    ],
  },
  {
    id: "user",
    name: "User",
    badge: "👤 User",
    color: "blue",
    description: "Default standard role assigned upon registration. Can operate POS, take orders, view tables, and track assigned sales.",
    permissions: [
      "pos_access",
      "take_orders",
      "view_tables",
      "view_assigned_receipts",
    ],
  },
];
