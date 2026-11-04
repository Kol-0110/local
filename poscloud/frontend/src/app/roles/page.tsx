"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Crown,
  Shield,
  User as UserIcon,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Search,
  Check,
  ChevronDown,
  ArrowRight,
  Database,
  Lock,
  Sparkles,
  Users,
  KeyRound,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";
import {
  AuthUser,
  UserRole,
  fetchAllUsers,
  updateUserRoleApi,
  fetchRolesApi,
  RoleDefinition,
} from "@/lib/api";

export default function RolesManagementPage() {
  const { user: currentUser, token, canManageRoles, isSuperAdmin, isAdmin } = useAuth();

  const [users, setUsers] = useState<AuthUser[]>([]);
  const [roleDefs, setRoleDefs] = useState<RoleDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setStatusMsg(null);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        fetchAllUsers(token || undefined),
        fetchRolesApi(),
      ]);

      if (usersRes.success && usersRes.users) {
        setUsers(usersRes.users);
      }
      if (rolesRes.success && rolesRes.roles) {
        setRoleDefs(rolesRes.roles);
      }
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: err?.message || "Failed to load users from database.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (canManageRoles) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [canManageRoles, token]);

  const handleRoleChange = async (targetUser: AuthUser, newRole: UserRole) => {
    if (targetUser.role === newRole) return;

    setUpdatingUserId(targetUser.id);
    setStatusMsg(null);

    try {
      const res = await updateUserRoleApi({
        userId: targetUser.id,
        newRole,
        token: token || undefined,
      });

      if (res.success && res.user) {
        setUsers((prev) =>
          prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u))
        );
        setStatusMsg({
          type: "success",
          text: `Role for "${targetUser.name}" successfully updated to ${newRole.toUpperCase()}!`,
        });
      }
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: err?.message || "Failed to update user role.",
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  // If unauthorized or not logged in
  if (!canManageRoles) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-8 sm:p-12 text-center backdrop-blur-md shadow-2xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Lock className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-black text-white">Administrator Access Required</h2>
          <p className="mt-2 text-sm text-zinc-400 max-w-md mx-auto">
            Role management is restricted to authorized <span className="font-bold text-purple-400">Super Admins</span> and{" "}
            <span className="font-bold text-emerald-400">Admins</span>.
            {currentUser && (
              <span className="block mt-2 text-xs font-mono text-zinc-400">
                Currently logged in as: <span className="text-white font-bold">{currentUser.name}</span> (Role: {currentUser.role})
              </span>
            )}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition"
            >
              <span>Switch / Sign In as Admin</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pos"
              className="rounded-xl border border-zinc-700 bg-zinc-800 px-6 py-3 text-sm font-bold text-zinc-300 hover:bg-zinc-700 transition"
            >
              Return to POS Register
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Summary counts
  const totalCount = users.length;
  const superAdminCount = users.filter((u) => u.role === "super_admin").length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const userCount = users.filter((u) => u.role === "user").length;

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
      
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/25">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Role & Access Management
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400">
                Connected to MongoDB • Dynamic 3-Tier RBAC Control
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-2.5 text-xs font-bold text-zinc-200 hover:bg-zinc-700 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh Users</span>
          </button>
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-500 transition"
          >
            <UserIcon className="h-3.5 w-3.5" />
            <span>Create New User</span>
          </Link>
        </div>
      </div>

      {/* Role Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Users */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Total Accounts
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-white">{totalCount}</div>
          <div className="mt-1 text-xs text-zinc-500">Live MongoDB documents</div>
        </div>

        {/* Super Admins */}
        <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
              Super Admins
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
              <Crown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-purple-200">{superAdminCount}</div>
          <div className="mt-1 text-xs text-purple-300/80">Full administrative authority</div>
        </div>

        {/* Admins */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              Admins
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <Shield className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-emerald-200">{adminCount}</div>
          <div className="mt-1 text-xs text-emerald-300/80">Operations & User managers</div>
        </div>

        {/* Standard Users */}
        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
              Standard Users
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
              <UserIcon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-blue-200">{userCount}</div>
          <div className="mt-1 text-xs text-blue-300/80">Default signup tier (POS & orders)</div>
        </div>
      </div>

      {/* Role Explanation Cards */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-400" />
          Role Permission Privileges
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3.5">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase mb-1">
              <Crown className="h-3.5 w-3.5" />
              <span>Super Admin</span>
            </div>
            <p className="text-[11px] text-zinc-300 leading-relaxed">
              Full system sovereignty. Can promote or demote any account between Super Admin, Admin, and User, audit financial metrics, and adjust system settings.
            </p>
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase mb-1">
              <Shield className="h-3.5 w-3.5" />
              <span>Admin</span>
            </div>
            <p className="text-[11px] text-zinc-300 leading-relaxed">
              Restaurant operations manager. Can change standard User roles to Admin or back to User. Cannot modify or assign Super Admin accounts.
            </p>
          </div>

          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase mb-1">
              <UserIcon className="h-3.5 w-3.5" />
              <span>Standard User</span>
            </div>
            <p className="text-[11px] text-zinc-300 leading-relaxed">
              Automatically assigned to every new signup. Staff members can place orders, view assigned tables, and run daily POS registers.
            </p>
          </div>
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusMsg && (
        <div
          className={`rounded-xl border p-4 text-xs font-semibold flex items-center gap-3 ${
            statusMsg.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-rose-500/30 bg-rose-500/10 text-rose-300"
          }`}
        >
          {statusMsg.type === "success" ? (
            <Check className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Users Table Card */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 shadow-xl overflow-hidden">
        
        {/* Table Filters Toolbar */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search user by name or email..."
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-2.5 pl-10 text-xs text-white placeholder-zinc-500 outline-none focus:border-emerald-500"
            />
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-zinc-400 hidden sm:inline">Filter Role:</span>
            <div className="flex rounded-xl bg-zinc-950 p-1 border border-zinc-800 w-full sm:w-auto">
              {[
                { id: "all", label: "All" },
                { id: "super_admin", label: "Super Admin" },
                { id: "admin", label: "Admin" },
                { id: "user", label: "User" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterRole(tab.id)}
                  className={`flex-1 sm:flex-none rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    filterRole === tab.id
                      ? "bg-zinc-800 text-white shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/60 text-zinc-400 font-bold uppercase tracking-wider text-[10px] border-b border-zinc-800">
              <tr>
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Email</th>
                <th className="px-5 py-3.5">Current Role</th>
                <th className="px-5 py-3.5">Change Role (Admin Action)</th>
                <th className="px-5 py-3.5">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-500">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = u.id === currentUser?.id;
                  const isSuper = u.role === "super_admin";
                  const isAdminRole = u.role === "admin";
                  const isUpdating = updatingUserId === u.id;

                  // Disabled conditions:
                  // - Admin cannot change a Super Admin
                  // - Admin cannot change another Admin
                  const canEditThisUser =
                    isSuperAdmin ||
                    (isAdmin && !isSuper && (!isAdminRole || isCurrent));

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-zinc-800/40 transition-colors"
                    >
                      {/* Name & Avatar */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-xl font-bold text-sm shadow-sm ${
                              isSuper
                                ? "bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-purple-600/30"
                                : isAdminRole
                                ? "bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-emerald-600/30"
                                : "bg-gradient-to-tr from-blue-600 to-cyan-600 text-white shadow-blue-600/30"
                            }`}
                          >
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isCurrent && (
                                <span className="rounded bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 text-[9px] font-black uppercase">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              ID: {u.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-5 py-4 whitespace-nowrap text-zinc-300 font-mono text-[11px]">
                        {u.email}
                      </td>

                      {/* Current Role Badge */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {isSuper && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-[11px] font-bold text-purple-300">
                            <Crown className="h-3 w-3 text-purple-400" />
                            <span>Super Admin</span>
                          </span>
                        )}
                        {isAdminRole && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
                            <Shield className="h-3 w-3 text-emerald-400" />
                            <span>Admin</span>
                          </span>
                        )}
                        {!isSuper && !isAdminRole && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-[11px] font-bold text-blue-300">
                            <UserIcon className="h-3 w-3 text-blue-400" />
                            <span>User</span>
                          </span>
                        )}
                      </td>

                      {/* Change Role Selector */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {canEditThisUser ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={u.role}
                              disabled={isUpdating}
                              onChange={(e) =>
                                handleRoleChange(u, e.target.value as UserRole)
                              }
                              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-white outline-none focus:border-emerald-500 transition cursor-pointer"
                            >
                              {/* Only Super Admin can promote to Super Admin */}
                              {isSuperAdmin && (
                                <option value="super_admin">👑 Super Admin</option>
                              )}
                              <option value="admin">🛡️ Admin</option>
                              <option value="user">👤 User</option>
                            </select>

                            {isUpdating && (
                              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-zinc-500 italic">
                            Protected (Requires Super Admin)
                          </span>
                        )}
                      </td>

                      {/* Created Date */}
                      <td className="px-5 py-4 whitespace-nowrap text-zinc-400 text-[11px]">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "Initial Seed"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
