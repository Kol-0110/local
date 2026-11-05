"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
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
  Search,
  Bell,
  Moon,
  Sun,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  AlertTriangle,
  MoreVertical,
  ArrowRight,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Clock,
  X,
  Menu as MenuIcon,
  Wifi,
  Sparkles,
  Wallet,
  Layers,
  Database,
  RefreshCw,
  LogOut,
  Filter,
} from "lucide-react";
import { usePOSStore, getTodayProfitReport, BRANCHES } from "@/lib/store";
import { useAuth } from "@/lib/authContext";
import { getServerStatus } from "@/lib/api";

// -------------------------------------------------------------
// Sample Initial Transactions matching the screenshot aesthetic
// -------------------------------------------------------------
interface TransactionItem {
  id: string;
  description: string;
  category: "Food Cost" | "Labor" | "Utilities" | "Rent" | "Marketing" | "Supplies" | "Dine-in Sales";
  date: string;
  amount: number;
  type: "in" | "out";
  status: "Success" | "Pending" | "Failed";
}

const DEFAULT_TRANSACTIONS: TransactionItem[] = [
  {
    id: "ORD-2026-001",
    description: "Fresh Produce Supplier",
    category: "Food Cost",
    date: "Oct 01, 2026",
    amount: 4250,
    type: "out",
    status: "Success",
  },
  {
    id: "ORD-2026-002",
    description: "Staff Payroll - Week 44",
    category: "Labor",
    date: "Oct 01, 2026",
    amount: 18700,
    type: "out",
    status: "Success",
  },
  {
    id: "ORD-2026-003",
    description: "Electricity - Ethio Telecom",
    category: "Utilities",
    date: "Oct 02, 2026",
    amount: 3200,
    type: "out",
    status: "Pending",
  },
  {
    id: "ORD-2026-004",
    description: "Monthly Rent - Bole",
    category: "Rent",
    date: "Oct 03, 2026",
    amount: 25000,
    type: "out",
    status: "Failed",
  },
  {
    id: "ORD-2026-005",
    description: "Facebook Ads Campaign",
    category: "Marketing",
    date: "Oct 03, 2026",
    amount: 1850,
    type: "out",
    status: "Success",
  },
  {
    id: "ORD-2026-006",
    description: "Kitchen Supplies - Restock",
    category: "Supplies",
    date: "Oct 04, 2026",
    amount: 980,
    type: "out",
    status: "Success",
  },
];

export default function OwnerDashboard() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user: authUser, logout, canManageRoles, isSuperAdmin } = useAuth();
  const { orders, tables, waiters } = usePOSStore();

  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChartPeriod, setActiveChartPeriod] = useState<"Daily" | "Weekly" | "Monthly">("Monthly");
  const [activePaymentTab, setActivePaymentTab] = useState<"telebirr" | "cash" | "cbe">("telebirr");
  const [showAlert, setShowAlert] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [dbStatus, setDbStatus] = useState<"connected" | "ready">("ready");

  // Hover state for interactive SVG chart
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    getServerStatus()
      .then((res) => {
        if (res.connected) setDbStatus("connected");
      })
      .catch(() => {});
  }, []);

  // Today's real store reports
  const todayReport = useMemo(() => {
    return getTodayProfitReport("all");
  }, [orders]);

  // Merge demo transactions with live store orders for recent transactions table
  const transactions: TransactionItem[] = useMemo(() => {
    const liveOrders: TransactionItem[] = orders.slice(-6).map((o) => ({
      id: `ORD-${o.orderNumber || o.id.slice(0, 6).toUpperCase()}`,
      description: o.orderType === "takeout" ? `Takeout - ${o.customerName || "Guest"}` : `Table ${o.tableNumber} - Dine-in`,
      category: "Dine-in Sales",
      date: new Date(o.createdAt || Date.now()).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
      amount: o.totalAmount,
      type: "in",
      status: o.paymentStatus === "PAID" ? "Success" : "Pending",
    }));

    return [...liveOrders, ...DEFAULT_TRANSACTIONS];
  }, [orders]);

  // Filtered transactions by search query
  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    const q = searchQuery.toLowerCase();
    return transactions.filter(
      (t) =>
        t.id.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.status.toLowerCase().includes(q)
    );
  }, [transactions, searchQuery]);

  // Dynamic Chart points based on active period
  const chartData = useMemo(() => {
    if (activeChartPeriod === "Daily") {
      return [
        { label: "08:00", revenue: 2400, expense: 950 },
        { label: "10:00", revenue: 5800, expense: 2100 },
        { label: "12:00", revenue: 14200, expense: 4800 },
        { label: "14:00", revenue: 18420, expense: 6200 },
        { label: "16:00", revenue: 12100, expense: 4100 },
        { label: "18:00", revenue: 19800, expense: 6900 },
        { label: "20:00", revenue: 24500, expense: 8400 },
        { label: "22:00", revenue: 11200, expense: 3900 },
      ];
    }
    if (activeChartPeriod === "Weekly") {
      return [
        { label: "Mon", revenue: 16400, expense: 6200 },
        { label: "Tue", revenue: 19200, expense: 7100 },
        { label: "Wed", revenue: 22800, expense: 8400 },
        { label: "Thu", revenue: 21500, expense: 7800 },
        { label: "Fri", revenue: 34900, expense: 11800 },
        { label: "Sat", revenue: 42800, expense: 14200 },
        { label: "Sun", revenue: 38600, expense: 13100 },
      ];
    }
    // Monthly (matching screenshot)
    return [
      { label: "Jan", revenue: 54000, expense: 24000 },
      { label: "Feb", revenue: 62000, expense: 25500 },
      { label: "Mar", revenue: 69000, expense: 28000 },
      { label: "Apr", revenue: 82000, expense: 31000 },
      { label: "May", revenue: 98000, expense: 36000 },
      { label: "Jun", revenue: 112000, expense: 39500 },
      { label: "Jul", revenue: 104000, expense: 38000 },
      { label: "Aug", revenue: 116000, expense: 41000 },
      { label: "Sep", revenue: 125000, expense: 44000 },
      { label: "Oct", revenue: 118000, expense: 42500 },
      { label: "Nov", revenue: 134000, expense: 47000 },
      { label: "Dec", revenue: 146000, expense: 52000 },
    ];
  }, [activeChartPeriod]);

  // Payment card info by tab
  const paymentCardInfo = useMemo(() => {
    if (activePaymentTab === "telebirr") {
      return {
        brand: "Telebirr",
        accountNumber: "0912 345 678",
        balance: 28451,
        share: "54.0%",
        gradient: "from-emerald-700 via-teal-700 to-emerald-900 border-emerald-500/30",
        type: "Mobile Merchant",
      };
    }
    if (activePaymentTab === "cbe") {
      return {
        brand: "CBE Birr",
        accountNumber: "1000 4829 1930",
        balance: 32180,
        share: "32.5%",
        gradient: "from-indigo-800 via-purple-800 to-indigo-950 border-indigo-500/30",
        type: "Direct Bank QR",
      };
    }
    return {
      brand: "Cash Drawer",
      accountNumber: "Cash Drawer #1",
      balance: 16269,
      share: "13.5%",
      gradient: "from-amber-700 via-orange-800 to-amber-950 border-amber-500/30",
      type: "Physical Cash",
    };
  }, [activePaymentTab]);

  // KPI Calculations
  const todayRevenue = todayReport.totalSales > 0 ? todayReport.totalSales : 18420;
  const totalExpense = todayReport.totalCost > 0 ? todayReport.totalCost : 76900;
  const profitMarginPercent =
    todayReport.totalSales > 0 ? todayReport.profitMargin : "40.1%";

  // Navigation Items matching the side navigation, retaining application paths
  const mainNavItems = [
    { href: "/", label: "Owner Dashboard", icon: LayoutDashboard, active: true },
    { href: "/receipts", label: "Sales Log", icon: ReceiptText },
    { href: "/tables", label: "Floor Tables", icon: Grid3X3 },
    { href: "/menu", label: "Menu & Cost", icon: BookOpen },
    ...(canManageRoles
      ? [{ href: "/roles", label: "Role Control", icon: ShieldCheck }]
      : []),
    ...(!isSuperAdmin
      ? [
          { href: "/waiter", label: "Waiter Mode", icon: Smartphone },
          { href: "/pos", label: "Register / POS", icon: ShoppingBag },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-[#0e0c0a] text-stone-100 flex flex-col lg:flex-row font-sans selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* ============================================================== */}
      {/* 1. LEFT SIDE NAVIGATION                                        */}
      {/* ============================================================== */}
      <aside className="hidden lg:flex w-64 flex-col justify-between border-r border-[#221c17] bg-[#120f0d] p-4 shrink-0 select-none">
        <div className="space-y-6">
          
          {/* 1.1 Brand Logo */}
          <div className="flex items-center gap-3 px-2 pt-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 font-black text-stone-950 shadow-md shadow-amber-500/20 text-sm">
              <span className="tracking-tighter font-mono">{"//"}</span>
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-white block leading-tight">
                Bistro OS
              </span>
              <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-widest block">
                Restaurant Cloud
              </span>
            </div>
          </div>

          {/* 1.2 User Profile Card */}
          <div className="relative">
            <div
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center justify-between rounded-2xl border border-[#2b221a] bg-[#1a1512] p-2.5 transition hover:bg-[#221c17] cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-amber-800 text-xs font-black text-white shadow-inner">
                  {authUser?.name
                    ? authUser.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()
                    : "AK"}
                </div>
                <div className="text-left leading-tight">
                  <span className="block text-xs font-bold text-white">
                    {authUser?.name || "Abebe Kebede"}
                  </span>
                  <span className="block text-[11px] text-stone-400">
                    Bistro Addis
                  </span>
                </div>
              </div>
              <MoreVertical className="h-4 w-4 text-stone-500 hover:text-stone-300" />
            </div>

            {/* Profile Dropdown */}
            {showUserDropdown && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-[#342921] bg-[#181411] p-2 shadow-2xl animate-in fade-in slide-in-from-top-1">
                <div className="px-2 py-1.5 text-[11px] text-stone-400 border-b border-[#292019] mb-1">
                  <span className="block font-bold text-white">{authUser?.email || "owner@bistro.et"}</span>
                  <span className="text-[10px] uppercase font-bold text-amber-400">
                    Role: {authUser?.role?.replace("_", " ") || "Owner"}
                  </span>
                </div>
                {authUser ? (
                  <button
                    onClick={() => logout()}
                    className="flex w-full items-center gap-2 rounded-lg p-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="flex w-full items-center gap-2 rounded-lg p-2 text-xs font-semibold text-amber-400 hover:bg-amber-500/10 transition"
                  >
                    <span>Sign In</span>
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* 1.3 Main Menu Navigation */}
          <div>
            <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Main menu
            </div>
            <nav className="space-y-1">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                      item.active
                        ? "bg-[#241c16] text-amber-400 font-bold border-l-2 border-amber-500 shadow-sm"
                        : "text-stone-400 hover:bg-[#1a1512] hover:text-stone-200"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${item.active ? "text-amber-400" : "text-stone-500"}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* 1.4 Support Section */}
          <div>
            <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Support
            </div>
            <nav className="space-y-1">
              <button
                onClick={() => alert("Settings configuration panel is ready in Role Control and Menu.")}
                className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-stone-400 hover:bg-[#1a1512] hover:text-stone-200 transition text-left"
              >
                <Settings className="h-4 w-4 text-stone-500" />
                <span>Settings</span>
              </button>
              <button
                onClick={() => alert("Bistro OS Support: Call +251 911 234 567 or visit docs.")}
                className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-stone-400 hover:bg-[#1a1512] hover:text-stone-200 transition text-left"
              >
                <HelpCircle className="h-4 w-4 text-stone-500" />
                <span>Help & Support</span>
              </button>
            </nav>
          </div>
        </div>

        {/* 1.5 Upgrade to Pro Card */}
        <div className="mt-6 rounded-2xl border border-[#2e231b] bg-gradient-to-b from-[#1a1512] to-[#14100d] p-4 shadow-xl space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-500/20 text-amber-400 text-xs">
              ★
            </span>
            <span className="text-xs font-bold text-white">Upgrade to Pro</span>
          </div>
          <p className="text-[11px] text-stone-400 leading-relaxed">
            AI insights, multi-branch & advanced reports.
          </p>
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-2 text-xs font-extrabold text-stone-950 shadow-md shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition active:scale-95"
          >
            <span>Upgrade Pro</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* 2. MOBILE TOP BAR & DRAWER                                     */}
      {/* ============================================================== */}
      <div className="lg:hidden flex items-center justify-between border-b border-[#221c17] bg-[#120f0d] px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 font-black text-stone-950 text-xs">
            //
          </div>
          <span className="font-black text-white text-base">Bistro OS</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#2b221a] bg-[#1a1512] text-stone-300"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm p-4 pt-16 flex flex-col justify-between">
          <div className="space-y-4 bg-[#14100d] border border-[#2b221a] rounded-2xl p-4">
            <div className="flex items-center justify-between border-b border-[#221c17] pb-3">
              <span className="font-bold text-white text-sm">Navigation</span>
              <button onClick={() => setMobileMenuOpen(false)} className="text-stone-400">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="space-y-1">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold ${
                      item.active ? "bg-[#241c16] text-amber-400 font-bold" : "text-stone-300"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="w-full py-3 rounded-xl bg-stone-800 text-stone-300 text-xs font-bold"
          >
            Close Menu
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. MAIN DASHBOARD CONTENT AREA                                 */}
      {/* ============================================================== */}
      <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto w-full overflow-y-auto">
        
        {/* 3.1 TOP BAR (Dashboard Title & Controls) */}
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Dashboard
            </h1>
            <p className="text-xs text-stone-400 mt-0.5">
              Live executive summary, sales revenue, payment reconciliation, and ledger
            </p>
          </div>

          {/* Top Controls: Search, Notifications, Theme, User */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            {/* Search Input */}
            <div className="relative flex items-center bg-[#171310] border border-[#2b221a] rounded-xl px-3 py-1.5 focus-within:border-amber-500/60 transition w-full sm:w-56 md:w-64">
              <Search className="h-3.5 w-3.5 text-stone-400 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-white placeholder-stone-500 focus:outline-none"
              />
              <span className="hidden sm:inline-block bg-[#241c16] text-stone-400 text-[10px] font-mono px-1.5 py-0.5 rounded border border-[#382b21] shrink-0">
                ⌘ K
              </span>
            </div>

            {/* Notification Bell */}
            <button
              onClick={() => alert("All restaurant systems operational. No unhandled alerts.")}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#2b221a] bg-[#171310] text-stone-300 hover:text-white transition"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-[#120f0d]" />
            </button>

            {/* Theme Toggle (Warm Moon / Sun) */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#2b221a] bg-[#171310] text-amber-400 hover:bg-[#221a14] transition"
              title="Toggle Theme Mode"
            >
              <Moon className="h-4 w-4" />
            </button>

            {/* Small Avatar Pill */}
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 text-xs font-bold text-white shadow">
              {authUser?.name ? authUser.name[0].toUpperCase() : "A"}
            </div>
          </div>
        </div>

        {/* 3.2 ALERT BANNER (From Screenshot 2) */}
        {showAlert && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#3e2c1e] bg-[#221a14] p-3.5 sm:px-4 shadow-lg animate-in fade-in">
            <div className="flex items-center gap-3 text-xs text-amber-200/90 font-medium">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 font-bold">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
              </span>
              <span>
                <strong className="text-white font-bold">Alert:</strong> Food cost is running 1.2% above target this week.
              </span>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Link
                href="/menu"
                className="flex items-center gap-1.5 rounded-xl border border-[#4a3525] bg-[#2d2218] px-3.5 py-1.5 text-xs font-bold text-stone-200 hover:bg-[#382b20] transition"
              >
                <span>Review budgets</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
              <button
                onClick={() => setShowAlert(false)}
                className="text-stone-400 hover:text-white p-1"
                title="Dismiss Alert"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* 3.3 THREE TOP KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* CARD 1: Today's Revenue (The Radiant Cobalt Blue Featured Card from Screenshot 2) */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2563eb] via-[#1d4ed8] to-[#1e40af] p-5 text-white shadow-2xl shadow-blue-950/40 border border-blue-400/30 flex flex-col justify-between group">
            {/* Subtle light aura */}
            <div className="absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-white/10 blur-2xl group-hover:bg-white/15 transition" />

            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 text-white backdrop-blur-sm">
                    <Wallet className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-xs font-semibold text-blue-100">
                    Today&apos;s Revenue
                  </span>
                </div>
                <button
                  onClick={() => router.push("/receipts")}
                  className="text-blue-200 hover:text-white p-1 transition"
                  title="View sales logs"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>

              {/* Big Value */}
              <div className="mt-4">
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                  ETB {todayRevenue.toLocaleString()}
                </h2>
              </div>
            </div>

            {/* Bottom info */}
            <div className="mt-4 flex items-center justify-between pt-2 border-t border-white/15 text-xs">
              <span className="text-blue-100 font-medium">vs yesterday</span>
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-black text-white border border-white/25 backdrop-blur-sm">
                +12.4%
              </span>
            </div>
          </div>

          {/* CARD 2: Total Expense */}
          <div className="rounded-2xl border border-[#2b221a] bg-[#16120f] p-5 shadow-lg flex flex-col justify-between hover:border-[#3a2d23] transition">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#241c16] text-stone-400">
                    <ReceiptText className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-xs font-semibold text-stone-400">
                    Total Expense
                  </span>
                </div>
                <button
                  onClick={() => router.push("/menu")}
                  className="text-stone-500 hover:text-stone-300 p-1"
                  title="View item costs"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4">
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                  ETB {totalExpense.toLocaleString()}
                </h2>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between pt-2 border-t border-[#241c16] text-xs">
              <span className="text-stone-400 font-medium">this month</span>
              <span className="rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 px-2.5 py-0.5 text-xs font-bold">
                +3.8%
              </span>
            </div>
          </div>

          {/* CARD 3: Profit Margin */}
          <div className="rounded-2xl border border-[#2b221a] bg-[#16120f] p-5 shadow-lg flex flex-col justify-between hover:border-[#3a2d23] transition">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#241c16] text-stone-400">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                  </span>
                  <span className="text-xs font-semibold text-stone-400">
                    Profit Margin
                  </span>
                </div>
                <button
                  onClick={() => alert(`Gross Sales: ${todayRevenue} ETB\nTotal Costs: ${totalExpense} ETB\nNet Profit Margin: ${profitMarginPercent}`)}
                  className="text-stone-500 hover:text-stone-300 p-1"
                  title="Margin details"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4">
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                  {profitMarginPercent}
                </h2>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between pt-2 border-t border-[#241c16] text-xs">
              <span className="text-stone-400 font-medium">target ≥ 35%</span>
              <span className="rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold">
                +2%
              </span>
            </div>
          </div>
        </div>

        {/* 3.4 TWO COLUMN MIDDLE SECTION: Chart (Left) + Payment Methods & Widgets (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* ============================================================== */}
          {/* 3.4.1 LEFT: REVENUE VS EXPENSES INTERACTIVE CHART (8 cols)     */}
          {/* ============================================================== */}
          <div className="lg:col-span-8 flex flex-col justify-between rounded-2xl border border-[#2b221a] bg-[#16120f] p-5 shadow-xl space-y-4">
            
            {/* Chart Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Revenue vs Expenses
                </h3>
                <p className="text-[11px] text-stone-400">
                  Cashflow trajectory comparing gross customer bills against inventory and operating overhead
                </p>
              </div>

              {/* Daily / Weekly / Monthly Switcher */}
              <div className="flex items-center rounded-xl bg-[#201914] p-1 border border-[#2b221a] self-start sm:self-auto">
                {(["Daily", "Weekly", "Monthly"] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setActiveChartPeriod(period)}
                    className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                      activeChartPeriod === period
                        ? "bg-[#2d2218] text-white shadow-sm border border-[#3f2e21]"
                        : "text-stone-400 hover:text-white"
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            {/* SVG Chart Canvas */}
            <div className="relative w-full pt-4">
              <div className="flex justify-between text-[11px] text-stone-500 font-mono mb-2">
                <span>160K</span>
                <span>120K</span>
                <span>80K</span>
                <span>40K</span>
                <span>0 ETB</span>
              </div>

              <div className="relative h-64 sm:h-72 w-full overflow-hidden">
                {/* Horizontal reference lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                  <div className="border-b border-stone-600 w-full" />
                  <div className="border-b border-stone-600 w-full" />
                  <div className="border-b border-stone-600 w-full" />
                  <div className="border-b border-stone-600 w-full" />
                  <div className="border-b border-stone-600 w-full" />
                </div>

                {/* SVG Curves */}
                <svg
                  className="w-full h-full overflow-visible"
                  viewBox="0 0 1000 240"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                      <stop offset="85%" stopColor="#10b981" stopOpacity="0.02" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Dynamic Revenue Curve Area */}
                  {(() => {
                    const maxVal = 160000;
                    const stepX = 1000 / (chartData.length - 1);
                    const revPoints = chartData.map((d, i) => {
                      const x = i * stepX;
                      const y = 230 - (d.revenue / maxVal) * 200;
                      return { x, y, ...d };
                    });

                    // Build smooth bezier path
                    let revPath = `M ${revPoints[0].x} ${revPoints[0].y}`;
                    for (let i = 0; i < revPoints.length - 1; i++) {
                      const p0 = revPoints[i];
                      const p1 = revPoints[i + 1];
                      const cx = (p0.x + p1.x) / 2;
                      revPath += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
                    }

                    const areaPath = `${revPath} L ${1000} 240 L 0 240 Z`;

                    // Expenses dotted line
                    let expPath = "";
                    const expPoints = chartData.map((d, i) => {
                      const x = i * stepX;
                      const y = 230 - (d.expense / maxVal) * 200;
                      return { x, y };
                    });
                    expPoints.forEach((p, i) => {
                      if (i === 0) expPath += `M ${p.x} ${p.y}`;
                      else expPath += ` L ${p.x} ${p.y}`;
                    });

                    return (
                      <>
                        {/* Area fill */}
                        <path d={areaPath} fill="url(#revenueGradient)" />

                        {/* Revenue line */}
                        <path
                          d={revPath}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2.8"
                          strokeLinecap="round"
                          className="drop-shadow-[0_2px_10px_rgba(16,185,129,0.5)]"
                        />

                        {/* Expense dotted line */}
                        <path
                          d={expPath}
                          fill="none"
                          stroke="#f43f5e"
                          strokeWidth="2"
                          strokeDasharray="5 5"
                          strokeOpacity="0.85"
                        />

                        {/* Interactive Data Nodes */}
                        {revPoints.map((pt, idx) => (
                          <g
                            key={idx}
                            onMouseEnter={() => setHoveredPointIndex(idx)}
                            onMouseLeave={() => setHoveredPointIndex(null)}
                            className="cursor-pointer"
                          >
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={hoveredPointIndex === idx ? 6 : 3.5}
                              fill="#10b981"
                              stroke="#16120f"
                              strokeWidth="2"
                              className="transition-all"
                            />
                          </g>
                        ))}
                      </>
                    );
                  })()}
                </svg>

                {/* Hover Tooltip display */}
                {hoveredPointIndex !== null && chartData[hoveredPointIndex] && (
                  <div
                    className="absolute z-20 rounded-xl border border-[#3e2e21] bg-[#1a1410] p-2.5 text-xs text-white shadow-2xl pointer-events-none transform -translate-x-1/2 -translate-y-full"
                    style={{
                      left: `${(hoveredPointIndex / (chartData.length - 1)) * 100}%`,
                      top: "35%",
                    }}
                  >
                    <div className="font-bold text-amber-400 mb-1">
                      {chartData[hoveredPointIndex].label} Summary
                    </div>
                    <div className="flex items-center justify-between gap-4 text-emerald-400 font-semibold">
                      <span>Revenue:</span>
                      <span>ETB {chartData[hoveredPointIndex].revenue.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-rose-400 font-semibold">
                      <span>Expense:</span>
                      <span>ETB {chartData[hoveredPointIndex].expense.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* X Axis Labels */}
              <div className="flex justify-between pt-3 text-[11px] font-semibold text-stone-400">
                {chartData.map((d, i) => (
                  <span
                    key={i}
                    className={`transition ${hoveredPointIndex === i ? "text-amber-400 font-bold" : ""}`}
                  >
                    {d.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Chart Legend */}
            <div className="flex items-center justify-end gap-5 pt-2 border-t border-[#241c16] text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                <span className="text-stone-300 font-medium">Revenue (Inflow)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-0.5 w-3 border-t-2 border-dashed border-rose-400" />
                <span className="text-stone-300 font-medium">Expense (Outflow)</span>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* 3.4.2 RIGHT: PAYMENT METHODS & MONTHLY SPLIT (4 cols)          */}
          {/* ============================================================== */}
          <div className="lg:col-span-4 flex flex-col justify-between gap-4">
            
            {/* Widget 1: Payment Methods with Digital Card (From Screenshot 2) */}
            <div className="rounded-2xl border border-[#2b221a] bg-[#16120f] p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Payment Methods
                </h3>

                {/* Tab Selectors: Telebirr | Cash | CBE */}
                <div className="flex items-center rounded-xl bg-[#201914] p-0.5 border border-[#2b221a]">
                  {(["telebirr", "cash", "cbe"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActivePaymentTab(tab)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-bold capitalize transition ${
                        activePaymentTab === tab
                          ? "bg-[#2d2218] text-white shadow border border-[#3f2e21]"
                          : "text-stone-400 hover:text-white"
                      }`}
                    >
                      {tab === "cbe" ? "CBE" : tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* The Glowing Realistic Digital Wallet Card */}
              <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-tr ${paymentCardInfo.gradient} p-5 text-white shadow-2xl border flex flex-col justify-between h-44 group transition-all duration-300`}>
                
                {/* Chip & contactless wave */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-8 rounded bg-amber-400/80 border border-amber-300/40 flex items-center justify-center text-[8px] font-black text-amber-950">
                      CHIP
                    </div>
                    <Wifi className="h-4 w-4 rotate-90 text-white/70" />
                  </div>
                  <span className="text-xs font-black tracking-widest uppercase text-white/90">
                    {paymentCardInfo.brand}
                  </span>
                </div>

                {/* Account / Phone */}
                <div>
                  <span className="text-xs font-mono tracking-widest text-white/80 block">
                    {paymentCardInfo.accountNumber}
                  </span>
                  <span className="text-[10px] text-white/70 uppercase tracking-wider block mt-0.5">
                    Available Balance
                  </span>
                </div>

                {/* Big Balance & Share Pill */}
                <div className="flex items-end justify-between">
                  <h4 className="text-2xl font-black text-white tracking-tight">
                    ETB {paymentCardInfo.balance.toLocaleString()}
                  </h4>
                  <span className="rounded-full bg-black/35 px-2.5 py-0.5 text-xs font-black text-emerald-200 border border-white/20 backdrop-blur-sm">
                    {paymentCardInfo.share}
                  </span>
                </div>
              </div>
            </div>

            {/* Widget 2: This Month Money In vs Money Out Summary */}
            <div className="rounded-2xl border border-[#2b221a] bg-[#16120f] p-4 sm:p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">This month</span>
                <span className="rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-black">
                  Net +ETB 51,720
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-[11px] text-stone-400 block font-medium">Money in</span>
                  <span className="text-base font-black text-emerald-400 block mt-0.5">
                    ETB 64,200
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-stone-400 block font-medium">Money out</span>
                  <span className="text-base font-black text-rose-400 block mt-0.5">
                    ETB 12,480
                  </span>
                </div>
              </div>

              {/* Dual Colored Progress Split Bar (Green & Red) */}
              <div className="w-full flex h-2 rounded-full overflow-hidden bg-stone-900 mt-2">
                <div className="bg-emerald-500 h-full w-[84%] transition-all" />
                <div className="bg-rose-500 h-full w-[16%] transition-all" />
              </div>
            </div>

            {/* Widget 3: Latest Activity (ETB) */}
            <div className="rounded-2xl border border-[#2b221a] bg-[#16120f] p-4 sm:p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Latest activity (ETB)
                </h4>
                <Link
                  href="/receipts"
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold"
                >
                  History
                </Link>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <ArrowDownLeft className="h-4 w-4" />
                    </span>
                    <div>
                      <span className="block text-xs font-bold text-white">
                        Dinner service payments
                      </span>
                      <span className="block text-[10px] text-stone-500">Today</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">+4,850</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/30">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                    <div>
                      <span className="block text-xs font-bold text-white">
                        Fresh Produce Supplier
                      </span>
                      <span className="block text-[10px] text-stone-500">Yesterday</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-stone-300">-4,250</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/30">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                    <div>
                      <span className="block text-xs font-bold text-white">
                        Water Bill
                      </span>
                      <span className="block text-[10px] text-stone-500">Oct 06</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-stone-300">-890</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3.5 BOTTOM TABLE: RECENT TRANSACTIONS (From Screenshots) */}
        <div className="rounded-2xl border border-[#2b221a] bg-[#16120f] p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Recent Transactions
              </h3>
              <p className="text-[11px] text-stone-400">
                Detailed journal entries, restaurant supplier payouts, and settled guest orders
              </p>
            </div>
            <Link
              href="/receipts"
              className="flex items-center gap-1 text-xs font-bold text-stone-400 hover:text-white transition"
            >
              <span>View all</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#261e18] text-[11px] uppercase tracking-wider text-stone-500">
                  <th className="py-3 px-3">ID</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#211a14]">
                {filteredTransactions.map((tx) => {
                  const isFood = tx.category === "Food Cost" || tx.category === "Dine-in Sales";
                  const isLabor = tx.category === "Labor";
                  const isUtil = tx.category === "Utilities";
                  const isRent = tx.category === "Rent";
                  const isMarketing = tx.category === "Marketing";

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-[#1d1713] transition group text-stone-300"
                    >
                      <td className="py-3.5 px-3 font-mono text-[11px] text-stone-400 group-hover:text-amber-400 font-semibold">
                        {tx.id}
                      </td>
                      <td className="py-3.5 px-3 font-bold text-white">
                        {tx.description}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              isFood
                                ? "bg-emerald-400"
                                : isLabor
                                ? "bg-blue-400"
                                : isUtil
                                ? "bg-amber-400"
                                : isRent
                                ? "bg-rose-400"
                                : isMarketing
                                ? "bg-purple-400"
                                : "bg-cyan-400"
                            }`}
                          />
                          <span className="text-stone-300 font-medium">
                            {tx.category}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-stone-400 font-medium">
                        {tx.date}
                      </td>
                      <td className="py-3.5 px-3 font-bold text-white font-mono">
                        ETB {tx.amount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            tx.status === "Success"
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : tx.status === "Pending"
                              ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                              : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              tx.status === "Success"
                                ? "bg-emerald-400"
                                : tx.status === "Pending"
                                ? "bg-amber-400"
                                : "bg-rose-400"
                            }`}
                          />
                          <span>{tx.status}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ============================================================== */}
      {/* 4. UPGRADE TO PRO MODAL                                         */}
      {/* ============================================================== */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="max-w-md w-full rounded-2xl border border-[#3e2e21] bg-[#16120f] p-6 shadow-2xl space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 font-bold text-xl shadow">
              ★
            </div>
            <h3 className="text-xl font-black text-white">Upgrade to Bistro OS Pro</h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Unlock real-time cloud multi-branch synchronization, AI revenue predictions, automated payroll, and unlimited order history.
            </p>
            <div className="rounded-xl border border-[#2b221a] bg-[#1c1612] p-3 text-xs text-left space-y-2">
              <div className="flex items-center gap-2 text-stone-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Unlimited multi-branch inventory tracking</span>
              </div>
              <div className="flex items-center gap-2 text-stone-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Automated Telebirr & CBE merchant reconciliation</span>
              </div>
              <div className="flex items-center gap-2 text-stone-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>AI food cost anomaly alerts & budget forecasting</span>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#2b221a] text-xs font-bold text-stone-400 hover:text-white"
              >
                Maybe Later
              </button>
              <button
                onClick={() => {
                  alert("Pro tier activated for your restaurant tenant!");
                  setShowUpgradeModal(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 font-bold text-xs text-stone-950 shadow-lg shadow-amber-500/20"
              >
                Activate Pro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
