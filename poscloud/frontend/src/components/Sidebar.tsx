"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ReceiptText,
  Grid3X3,
  BookOpen,
  ShieldCheck,
  Smartphone,
  ShoppingBag,
  Settings,
  HelpCircle,
  ChevronDown,
  LogOut,
  ArrowRight,
  Menu as MenuIcon,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";

interface SidebarProps {
  mobileMenuOpen?: boolean;
  setMobileMenuOpen?: (open: boolean) => void;
}

export default function Sidebar({ mobileMenuOpen, setMobileMenuOpen }: SidebarProps) {
  const pathname = usePathname();
  const { user: authUser, logout, canManageRoles, isSuperAdmin } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const mainNavItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/receipts", label: "Sales Log", icon: ReceiptText },
    { href: "/tables", label: "Floor Tables", icon: Grid3X3 },
    { href: "/menu", label: "Menu & Cost", icon: BookOpen },
    ...(canManageRoles ? [{ href: "/roles", label: "Role Control", icon: ShieldCheck }] : []),
    ...(!isSuperAdmin
      ? [
          { href: "/waiter", label: "Waiter Mode", icon: Smartphone },
          { href: "/pos", label: "Register / POS", icon: ShoppingBag },
        ]
      : []),
  ];

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full select-none">
      <div className="space-y-6">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 font-black text-[#04262d] shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:shadow-cyan-500/30">
            <span className="text-xs font-mono font-bold tracking-tighter">{"//"}</span>
          </div>
          <span className="text-[17px] font-bold tracking-tight text-[#111418] dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
            Fintrack
          </span>
        </Link>

        {/* User Profile Card */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex w-full items-center gap-2.5 rounded-[10px] border border-[#e3e6ea] dark:border-[#232527] bg-[#f1f3f5] dark:bg-[#1b1c1e] p-2.5 text-left transition-all duration-200 hover:border-[#cfd4dc] dark:hover:border-[#383a3e] hover:shadow-sm"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-pink-300 to-purple-400 text-xs font-semibold text-[#1e1b2e] shadow-inner">
              {authUser?.name
                ? authUser.name
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                : "LR"}
            </div>
            <div className="flex-1 min-w-0">
              <strong className="block text-[13.5px] font-medium text-[#111418] dark:text-[#f2f3f4] truncate">
                {authUser?.name || "Lily Rose"}
              </strong>
              <small className="block text-[11px] text-[#5f6670] dark:text-[#8b8f94] truncate">
                {authUser?.email || "rose@gmail.com"}
              </small>
            </div>
            <ChevronDown className="h-4 w-4 text-[#9aa1a9] dark:text-[#5d6166] shrink-0 transition-transform duration-200" />
          </button>

          {showUserDropdown && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-[#e3e6ea] dark:border-[#2a2c2f] bg-white dark:bg-[#18191b] p-2 shadow-xl animate-in fade-in slide-in-from-top-1">
              <div className="px-2 py-1 text-[11px] text-[#5f6670] dark:text-[#8b8f94] border-b border-[#e3e6ea] dark:border-[#232527] mb-1">
                <span className="block font-bold text-[#111418] dark:text-white truncate">
                  {authUser?.email || "owner@restaurant.et"}
                </span>
                <span className="text-[10px] uppercase font-bold text-cyan-600 dark:text-cyan-400">
                  Role: {authUser?.role?.replace("_", " ") || "Owner"}
                </span>
              </div>
              {authUser ? (
                <button
                  onClick={() => logout()}
                  className="flex w-full items-center gap-2 rounded-lg p-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <Link
                  href="/login"
                  className="flex w-full items-center gap-2 rounded-lg p-2 text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 transition-colors"
                >
                  <span>Sign In</span>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Main Menu */}
        <div>
          <p className="px-1 pb-2 text-[11px] font-semibold text-[#9aa1a9] dark:text-[#5d6166] uppercase tracking-wider">
            Main menu
          </p>
          <nav className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen && setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200 group ${
                    isActive
                      ? "bg-[#f1f3f5] dark:bg-[#1b1c1e] text-[#111418] dark:text-[#f2f3f4] border border-[#e3e6ea] dark:border-[#232527] shadow-sm font-semibold"
                      : "text-[#5f6670] dark:text-[#8b8f94] hover:bg-[#f8f9fa] dark:hover:bg-[#161718] hover:text-[#111418] dark:hover:text-[#f2f3f4] hover:translate-x-1"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? "text-cyan-600 dark:text-cyan-400 opacity-100" : "opacity-80"
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Support */}
        <div>
          <p className="px-1 pb-2 text-[11px] font-semibold text-[#9aa1a9] dark:text-[#5d6166] uppercase tracking-wider">
            Support
          </p>
          <nav className="space-y-1">
            <button
              onClick={() => alert("Settings panel configuration available in Role Control.")}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-[#5f6670] dark:text-[#8b8f94] hover:bg-[#f8f9fa] dark:hover:bg-[#161718] hover:text-[#111418] dark:hover:text-[#f2f3f4] transition-all hover:translate-x-1 text-left"
            >
              <Settings className="h-4 w-4 shrink-0 opacity-80" />
              <span>Settings</span>
            </button>
            <button
              onClick={() => alert("Help & Support: Call +251 911 234 567.")}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-[#5f6670] dark:text-[#8b8f94] hover:bg-[#f8f9fa] dark:hover:bg-[#161718] hover:text-[#111418] dark:hover:text-[#f2f3f4] transition-all hover:translate-x-1 text-left"
            >
              <HelpCircle className="h-4 w-4 shrink-0 opacity-80" />
              <span>Help &amp; Support</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Upgrade to Pro Card */}
      <div className="mt-6 rounded-xl border border-[#2b2d30] bg-gradient-to-b from-[#121315] to-[#1e2023] p-3.5 text-white shadow-md space-y-2 hover:border-cyan-500/40 transition-all duration-300">
        <strong className="block text-[13px] font-semibold text-white">Upgrade to Pro</strong>
        <p className="text-[11px] text-[#9aa1a9] leading-tight">
          Upgrade for AI insights and advanced financial analytics.
        </p>
        <button
          onClick={() => setShowUpgradeModal(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#2b2e33] hover:bg-[#373a40] py-1.5 px-3 text-xs font-medium text-white border border-[#3f4349] transition active:scale-95 hover:shadow-sm"
        >
          <span>Upgrade Pro</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="max-w-md w-full rounded-2xl border border-[#e3e6ea] dark:border-[#2b2d30] bg-white dark:bg-[#16181b] p-6 shadow-2xl space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 font-bold text-xl shadow">
              ★
            </div>
            <h3 className="text-xl font-bold text-[#111418] dark:text-white">Upgrade to Fintrack Pro</h3>
            <p className="text-xs text-[#5f6670] dark:text-[#8b8f94] leading-relaxed">
              Unlock AI spending insights, real-time multi-account syncing, automated limits, and unlimited history.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 py-2.5 rounded-lg border border-[#e3e6ea] dark:border-[#2b2d30] text-xs font-semibold text-[#5f6670] dark:text-[#8b8f94]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert("Pro tier activated!");
                  setShowUpgradeModal(false);
                }}
                className="flex-1 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 font-semibold text-xs text-white shadow-md shadow-cyan-600/20"
              >
                Activate Pro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:flex w-[230px] flex-col justify-between border-r border-[#e3e6ea] dark:border-[#232527] bg-white dark:bg-[#0f1011] p-5 shrink-0 select-none sticky top-0 h-screen overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4 pt-16 flex flex-col justify-between animate-in fade-in">
          <div className="space-y-4 bg-white dark:bg-[#141516] border border-[#e3e6ea] dark:border-[#232527] rounded-xl p-4 shadow-2xl overflow-y-auto max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-[#e3e6ea] dark:border-[#232527] pb-3">
              <span className="font-bold text-[#111418] dark:text-white text-sm">Navigation</span>
              <button onClick={() => setMobileMenuOpen && setMobileMenuOpen(false)}>
                <X className="h-5 w-5 text-[#5f6670]" />
              </button>
            </div>
            {sidebarContent}
          </div>
          <button
            onClick={() => setMobileMenuOpen && setMobileMenuOpen(false)}
            className="w-full py-3 rounded-xl bg-stone-900 text-white text-xs font-bold"
          >
            Close Menu
          </button>
        </div>
      )}
    </>
  );
}

