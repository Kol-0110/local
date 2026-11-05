"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
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
  Sun,
  Moon,
  Bell,
  Menu as MenuIcon,
  X,
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
import Sidebar from "@/components/Sidebar";

export default function RolesManagementPage() {
  const { theme, setTheme } = useTheme();
  const { user: currentUser, token, canManageRoles, isSuperAdmin, isAdmin } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
      <div className="min-h-screen bg-[#f4f6f8] dark:bg-[#0b0c0d] text-[#111418] dark:text-[#f2f3f4] flex flex-col lg:flex-row font-sans">
        <Sidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl border border-[#e3e6ea] dark:border-[#232527] bg-white dark:bg-[#141516] p-8 text-center shadow-xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Lock className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold text-[#111418] dark:text-white">
              Administrator Access Required
            </h2>
            <p className="mt-2 text-xs text-[#5f6670] dark:text-[#8b8f94] leading-relaxed">
              Role management is restricted to authorized <span className="font-bold text-purple-600 dark:text-purple-400">Super Admins</span> and{" "}
              <span className="font-bold text-emerald-600 dark:text-emerald-400">Admins</span>.
              {currentUser && (
                <span className="block mt-2 font-mono text-[11px]">
                  Logged in as: <strong className="text-[#111418] dark:text-white">{currentUser.name}</strong> ({currentUser.role})
                </span>
              )}
            </p>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/login"
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-cyan-500 transition"
              >
                <span>Sign In as Admin</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/pos"
                className="w-full sm:w-auto rounded-xl border border-[#e3e6ea] dark:border-[#282a2d] bg-[#f8f9fa] dark:bg-[#18191b] px-5 py-2.5 text-xs font-bold text-[#5f6670] dark:text-[#8b8f94] hover:text-[#111418] dark:hover:text-white transition"
              >
                POS Register
              </Link>
            </div>
          </div>
        </main>
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
    <div className="min-h-screen bg-[#f4f6f8] dark:bg-[#0b0c0d] text-[#111418] dark:text-[#f2f3f4] flex flex-col lg:flex-row font-sans selection:bg-cyan-500/20 transition-colors duration-200">
      
      {/* 1. SHARED FINTRACK SIDEBAR */}
      <Sidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

      {/* 2. MOBILE TOPBAR */}
      <div className="lg:hidden flex items-center justify-between border-b border-[#e3e6ea] dark:border-[#232527] bg-white dark:bg-[#0f1011] px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 font-black text-[#04262d] text-xs">
            //
          </div>
          <span className="font-bold text-[#111418] dark:text-white text-base">Fintrack</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e3e6ea] dark:border-[#232527] bg-[#f1f3f5] dark:bg-[#1b1c1e] text-[#111418] dark:text-[#f2f3f4]"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </button>
      </div>

      {/* 3. MAIN CONTENT */}
      <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-7 space-y-6 max-w-[1500px] w-full overflow-y-auto">
        
        {/* Top Header Bar */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#111418] dark:text-[#f2f3f4]">
              Role &amp; Access Control
            </h1>
            <p className="text-xs text-[#5f6670] dark:text-[#8b8f94] mt-0.5">
              Multi-tier RBAC authority • MongoDB synchronized user profiles
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Search Input */}
            <div className="relative flex items-center bg-white dark:bg-[#141516] border border-[#e3e6ea] dark:border-[#232527] rounded-lg px-3 py-1.5 w-full sm:w-60 shadow-sm focus-within:border-cyan-600 transition duration-200">
              <Search className="h-4 w-4 text-[#9aa1a9] dark:text-[#5d6166] mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent text-xs text-[#111418] dark:text-[#f2f3f4] placeholder-[#9aa1a9] focus:outline-none"
              />
            </div>

            {/* Refresh Button */}
            <button
              onClick={loadData}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-lg border border-[#e3e6ea] dark:border-[#232527] bg-white dark:bg-[#141516] px-3 py-1.5 text-xs font-semibold text-[#5f6670] dark:text-[#8b8f94] hover:text-[#111418] dark:hover:text-white transition duration-200 shadow-sm hover:shadow"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>

            {/* Create User Link */}
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-cyan-500 transition-all duration-200 hover:shadow-md hover:shadow-cyan-600/20 active:scale-[0.98]"
            >
              <UserIcon className="h-3.5 w-3.5" />
              <span>Create User</span>
            </Link>

            {/* Notification Bell */}
            <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e3e6ea] dark:border-[#232527] bg-white dark:bg-[#141516] text-[#5f6670] dark:text-[#8b8f94] hover:text-[#111418] dark:hover:text-white transition duration-200 shadow-sm hover:shadow">
              <Bell className="h-4 w-4" />
            </button>

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title="Toggle Light / Dark mode"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e3e6ea] dark:border-[#232527] bg-white dark:bg-[#141516] text-[#5f6670] dark:text-[#8b8f94] hover:text-[#111418] dark:hover:text-white transition duration-200 shadow-sm hover:shadow"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-[#5f6670]" />
              )}
            </button>
          </div>
        </header>

        {/* 4 Role KPI Cards with Hover Lift */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-[#e3e6ea] dark:border-[#232527] bg-white dark:bg-[#141516] p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between text-[#5f6670] dark:text-[#8b8f94] text-xs font-medium">
              <span>Total Accounts</span>
              <Users className="h-4 w-4 text-cyan-500" />
            </div>
            <div className="mt-2 text-2xl font-black text-[#111418] dark:text-[#f2f3f4]">
              {totalCount}
            </div>
            <div className="mt-1 text-[11px] text-[#9aa1a9]">Live MongoDB verified users</div>
          </div>

          <div className="rounded-2xl border border-[#e3e6ea] dark:border-[#232527] bg-white dark:bg-[#141516] p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 text-xs font-medium">
              <span>Super Admins</span>
              <Crown className="h-4 w-4 text-purple-500" />
            </div>
            <div className="mt-2 text-2xl font-black text-purple-600 dark:text-purple-400">
              {superAdminCount}
            </div>
            <div className="mt-1 text-[11px] text-[#9aa1a9]">Full authority &amp; view permissions</div>
          </div>

          <div className="rounded-2xl border border-[#e3e6ea] dark:border-[#232527] bg-white dark:bg-[#141516] p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs font-medium">
              <span>Admins</span>
              <Shield className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {adminCount}
            </div>
            <div className="mt-1 text-[11px] text-[#9aa1a9]">Operations &amp; floor supervisors</div>
          </div>

          <div className="rounded-2xl border border-[#e3e6ea] dark:border-[#232527] bg-white dark:bg-[#141516] p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 text-xs font-medium">
              <span>Standard Users</span>
              <UserIcon className="h-4 w-4 text-blue-500" />
            </div>
            <div className="mt-2 text-2xl font-black text-blue-600 dark:text-blue-400">
              {userCount}
            </div>
            <div className="mt-1 text-[11px] text-[#9aa1a9]">Waiters &amp; counter cashiers</div>
          </div>
        </div>

        {/* Role Privileges Cards */}
        <div className="rounded-2xl border border-[#e3e6ea] dark:border-[#232527] bg-white dark:bg-[#141516] p-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#5f6670] dark:text-[#8b8f94] mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>Role Permissions &amp; Access Scope</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-purple-200 dark:border-purple-500/20 bg-purple-50 dark:bg-purple-500/5 p-3.5">
              <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-400 font-bold text-xs uppercase mb-1">
                <Crown className="h-3.5 w-3.5" />
                <span>Super Admin</span>
              </div>
              <p className="text-[11px] text-[#5f6670] dark:text-zinc-300 leading-relaxed">
                Full system oversight. Promotes/demotes accounts across tiers, audits owner dashboards, and configures restaurant branch settings.
              </p>
            </div>

            <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5 p-3.5">
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold text-xs uppercase mb-1">
                <Shield className="h-3.5 w-3.5" />
                <span>Admin</span>
              </div>
              <p className="text-[11px] text-[#5f6670] dark:text-zinc-300 leading-relaxed">
                Restaurant branch manager. Can promote standard Users to Admin or back. Cannot edit or override Super Admin accounts.
              </p>
            </div>

            <div className="rounded-xl border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/5 p-3.5">
              <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-bold text-xs uppercase mb-1">
                <UserIcon className="h-3.5 w-3.5" />
                <span>Standard User</span>
              </div>
              <p className="text-[11px] text-[#5f6670] dark:text-zinc-300 leading-relaxed">
                Default assigned role for all staff. Allows taking orders, managing assigned tables, and completing daily POS checkout tickets.
              </p>
            </div>
          </div>
        </div>

        {/* Status Alert Banner */}
        {statusMsg && (
          <div
            className={`rounded-xl border p-4 text-xs font-semibold flex items-center gap-3 ${
              statusMsg.type === "success"
                ? "border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300"
            }`}
          >
            {statusMsg.type === "success" ? (
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Role Filter Pills */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "all", label: "All Roles" },
              { id: "super_admin", label: "Super Admin" },
              { id: "admin", label: "Admin" },
              { id: "user", label: "User" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterRole(tab.id)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  filterRole === tab.id
                    ? "bg-cyan-600 text-white shadow-sm font-bold"
                    : "bg-white dark:bg-[#141516] text-[#5f6670] dark:text-[#8b8f94] hover:text-[#111418] dark:hover:text-white border border-[#e3e6ea] dark:border-[#232527] hover:bg-[#f8f9fa] dark:hover:bg-[#18191b]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="text-xs text-[#5f6670] dark:text-[#8b8f94] font-medium">
            Showing <span className="font-bold text-[#111418] dark:text-white">{filteredUsers.length}</span> accounts
          </div>
        </div>

        {/* Users Table Card */}
        <div className="overflow-hidden rounded-2xl border border-[#e3e6ea] dark:border-[#232527] bg-white dark:bg-[#141516] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#e3e6ea] dark:border-[#232527] bg-[#f8f9fa] dark:bg-[#18191b] text-[11px] font-bold uppercase tracking-wider text-[#5f6670] dark:text-[#8b8f94]">
                <tr>
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-5 py-3.5">Email</th>
                  <th className="px-5 py-3.5">Current Role</th>
                  <th className="px-5 py-3.5">Change Role (RBAC Action)</th>
                  <th className="px-5 py-3.5">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e6ea] dark:divide-[#232527] font-medium">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[#5f6670] dark:text-[#8b8f94]">
                      No users matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isCurrent = u.id === currentUser?.id;
                    const isSuper = u.role === "super_admin";
                    const isAdminRole = u.role === "admin";
                    const isUpdating = updatingUserId === u.id;

                    const canEditThisUser =
                      isSuperAdmin ||
                      (isAdmin && !isSuper && (!isAdminRole || isCurrent));

                    return (
                      <tr
                        key={u.id}
                        className="hover:bg-[#f8f9fa] dark:hover:bg-[#1a1b1d] transition-colors duration-150 group"
                      >
                        {/* Name & Avatar */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-9 w-9 items-center justify-center rounded-xl font-bold text-sm shadow-sm ${
                                isSuper
                                  ? "bg-gradient-to-tr from-purple-500 to-indigo-600 text-white"
                                  : isAdminRole
                                  ? "bg-gradient-to-tr from-emerald-500 to-teal-600 text-white"
                                  : "bg-gradient-to-tr from-blue-500 to-cyan-600 text-white"
                              }`}
                            >
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-[#111418] dark:text-white flex items-center gap-1.5">
                                <span>{u.name}</span>
                                {isCurrent && (
                                  <span className="rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.2 text-[9px] font-black uppercase">
                                    You
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-[#9aa1a9] font-mono">
                                ID: {u.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-5 py-4 whitespace-nowrap text-[#5f6670] dark:text-zinc-300 font-mono text-[11px]">
                          {u.email}
                        </td>

                        {/* Current Role Badge */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          {isSuper && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-500/10 px-2.5 py-1 text-[11px] font-bold text-purple-700 dark:text-purple-300">
                              <Crown className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                              <span>Super Admin</span>
                            </span>
                          )}
                          {isAdminRole && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                              <Shield className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                              <span>Admin</span>
                            </span>
                          )}
                          {!isSuper && !isAdminRole && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 text-[11px] font-bold text-blue-700 dark:text-blue-300">
                              <UserIcon className="h-3 w-3 text-blue-600 dark:text-blue-400" />
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
                                className="rounded-lg border border-[#e3e6ea] dark:border-[#2b2d30] bg-[#f8f9fa] dark:bg-[#18191b] px-3 py-1.5 text-xs font-semibold text-[#111418] dark:text-white outline-none focus:border-cyan-500 transition cursor-pointer"
                              >
                                {isSuperAdmin && (
                                  <option value="super_admin">👑 Super Admin</option>
                                )}
                                <option value="admin">🛡️ Admin</option>
                                <option value="user">👤 User</option>
                              </select>

                              {isUpdating && (
                                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-[#9aa1a9] italic">
                              Protected (Requires Super Admin)
                            </span>
                          )}
                        </td>

                        {/* Created Date */}
                        <td className="px-5 py-4 whitespace-nowrap text-[#5f6670] dark:text-[#8b8f94] text-[11px]">
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

      </main>
    </div>
  );
}
