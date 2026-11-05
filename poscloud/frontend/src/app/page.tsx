"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Search,
  Bell,
  Moon,
  Sun,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  MoreVertical,
  MoreHorizontal,
  ArrowRight,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Menu as MenuIcon,
  Wifi,
  Wallet,
  Filter,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { usePOSStore, getTodayProfitReport } from "@/lib/store";
import { useAuth } from "@/lib/authContext";
import Sidebar from "@/components/Sidebar";

// -------------------------------------------------------------
// Fintrack Types & Data
// -------------------------------------------------------------
type Status = "Success" | "Pending" | "Failed";
type Category = "Food" | "Subscription" | "Travel" | "Shopping" | "Utilities" | "Transport" | "Dine-in";

interface Transaction {
  id: string;
  description: string;
  category: Category;
  date: string;
  amount: number;
  status: Status;
  initial: string;
  badgeBg: string;
  badgeColor: string;
}

const CATEGORY_COLORS: Record<Category, string> = {
  Food: "#a855f7",
  Subscription: "#f59e0b",
  Travel: "#22c55e",
  Shopping: "#3b82f6",
  Utilities: "#ef4444",
  Transport: "#14b8a6",
  "Dine-in": "#10b981",
};

const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: "TXN-2026-001",
    description: "Starbucks Coffee",
    category: "Food",
    date: "Jul 01, 2026",
    amount: -8.75,
    status: "Success",
    initial: "S",
    badgeBg: "bg-emerald-100 dark:bg-emerald-950/60",
    badgeColor: "text-emerald-700 dark:text-emerald-400",
  },
  {
    id: "TXN-2026-002",
    description: "Netflix Subscription",
    category: "Subscription",
    date: "Jul 01, 2026",
    amount: -15.99,
    status: "Success",
    initial: "N",
    badgeBg: "bg-rose-100 dark:bg-rose-950/60",
    badgeColor: "text-rose-700 dark:text-rose-400",
  },
  {
    id: "TXN-2026-003",
    description: "Hotel Booking",
    category: "Travel",
    date: "Jul 02, 2026",
    amount: -285.1,
    status: "Pending",
    initial: "H",
    badgeBg: "bg-amber-100 dark:bg-amber-950/60",
    badgeColor: "text-amber-700 dark:text-amber-400",
  },
  {
    id: "TXN-2026-004",
    description: "Amazon Purchase",
    category: "Shopping",
    date: "Jul 02, 2026",
    amount: -79.99,
    status: "Failed",
    initial: "A",
    badgeBg: "bg-stone-200 dark:bg-stone-800",
    badgeColor: "text-stone-700 dark:text-stone-300",
  },
  {
    id: "TXN-2026-005",
    description: "Electricity Bill",
    category: "Utilities",
    date: "Jul 03, 2026",
    amount: -64.2,
    status: "Success",
    initial: "E",
    badgeBg: "bg-rose-100 dark:bg-rose-950/60",
    badgeColor: "text-rose-700 dark:text-rose-400",
  },
  {
    id: "TXN-2026-006",
    description: "Uber Ride",
    category: "Transport",
    date: "Jul 03, 2026",
    amount: -18.4,
    status: "Success",
    initial: "U",
    badgeBg: "bg-teal-100 dark:bg-teal-950/60",
    badgeColor: "text-teal-700 dark:text-teal-400",
  },
  {
    id: "TXN-2026-007",
    description: "Spotify Premium",
    category: "Subscription",
    date: "Jul 04, 2026",
    amount: -10.99,
    status: "Success",
    initial: "S",
    badgeBg: "bg-emerald-100 dark:bg-emerald-950/60",
    badgeColor: "text-emerald-700 dark:text-emerald-400",
  },
  {
    id: "TXN-2026-008",
    description: "Whole Foods Market",
    category: "Food",
    date: "Jul 04, 2026",
    amount: -92.35,
    status: "Pending",
    initial: "W",
    badgeBg: "bg-amber-100 dark:bg-amber-950/60",
    badgeColor: "text-amber-700 dark:text-amber-400",
  },
];

type Range = "Daily" | "Weekly" | "Monthly";

export default function FintrackDashboard() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { orders } = usePOSStore();

  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "All">("All");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [range, setRange] = useState<Range>("Monthly");
  const [hoveredChartPoint, setHoveredChartPoint] = useState<number | null>(null);
  const [showAlert, setShowAlert] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Real store reports
  const todayReport = useMemo(() => {
    return getTodayProfitReport("all");
  }, [orders]);

  // Merge live POS orders with Fintrack transactions
  const allTransactions = useMemo(() => {
    const liveItems: Transaction[] = orders.slice(-10).map((o, idx) => ({
      id: `TXN-2026-${String(idx + 10).padStart(3, "0")}`,
      description: o.orderType === "takeout" ? `Takeout - ${o.customerName || "Walk-in"}` : `Table ${o.tableNumber} - Order`,
      category: "Dine-in",
      date: new Date(o.createdAt || Date.now()).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
      amount: -o.totalAmount,
      status: o.paymentStatus === "PAID" ? "Success" : "Pending",
      initial: o.customerName ? o.customerName[0].toUpperCase() : "T",
      badgeBg: "bg-cyan-100 dark:bg-cyan-950/60",
      badgeColor: "text-cyan-700 dark:text-cyan-400",
    }));

    return [...DEFAULT_TRANSACTIONS, ...liveItems];
  }, [orders]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let list = allTransactions;
    if (statusFilter !== "All") {
      list = list.filter((t) => t.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allTransactions, statusFilter, searchQuery]);

  // Pagination (8 per page)
  const pageSize = 8;
  const totalPages = Math.ceil(filteredTransactions.length / pageSize) || 1;
  const pagedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, currentPage]);

  const toggleSelectAll = () => {
    if (selectedIds.size === pagedTransactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pagedTransactions.map((t) => t.id)));
    }
  };

  const toggleSelectId = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Cash Flow Chart Data series
  const chartSeries = useMemo(() => {
    if (range === "Monthly") {
      return [
        { label: "Jan", income: 3700, expenses: 2650 },
        { label: "Feb", income: 3950, expenses: 2950 },
        { label: "Mar", income: 3250, expenses: 3300 },
        { label: "Apr", income: 3500, expenses: 3400 },
        { label: "May", income: 4000, expenses: 4500 },
        { label: "Jun", income: 5620, expenses: 5780 },
        { label: "Jul", income: 6200, expenses: 5900 },
        { label: "Aug", income: 6650, expenses: 5100 },
        { label: "Sep", income: 6650, expenses: 4600 },
        { label: "Oct", income: 6650, expenses: 4400 },
        { label: "Nov", income: 5450, expenses: 4100 },
        { label: "Dec", income: 5400, expenses: 3500 },
      ];
    }
    if (range === "Weekly") {
      return [
        { label: "W1", income: 1100, expenses: 950 },
        { label: "W2", income: 1400, expenses: 1050 },
        { label: "W3", income: 1350, expenses: 1200 },
        { label: "W4", income: 1650, expenses: 1100 },
        { label: "W5", income: 1800, expenses: 1350 },
        { label: "W6", income: 2100, expenses: 1400 },
        { label: "W7", income: 1950, expenses: 1300 },
        { label: "W8", income: 2250, expenses: 1500 },
      ];
    }
    // Daily
    return [
      { label: "Mon", income: 220, expenses: 170 },
      { label: "Tue", income: 260, expenses: 190 },
      { label: "Wed", income: 210, expenses: 240 },
      { label: "Thu", income: 290, expenses: 210 },
      { label: "Fri", income: 420, expenses: 280 },
      { label: "Sat", income: 490, expenses: 310 },
      { label: "Sun", income: 380, expenses: 250 },
    ];
  }, [range]);

  // Number of active pills in Card Spending meter (15 out of 24)
  const meterCount = 24;
  const activeMeterBars = 15;

  return (
    <div className="min-h-screen bg-[#f4f6f8] dark:bg-[#0b0c0d] text-[#111418] dark:text-[#f2f3f4] flex flex-col lg:flex-row font-sans selection:bg-cyan-500/20 transition-colors duration-200">
      
      {/* 1. SHARED UNIFIED FINTRACK SIDEBAR */}
      <Sidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

      {/* 2. MOBILE TOPBAR */}
      <div className="lg:hidden flex items-center justify-between border-b border-[#e3e6ea] dark:border-[#232527] bg-white dark:bg-[#0f1011] px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 font-black text-[#04262d] text-xs shadow-sm">
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

      {/* 3. MAIN DASHBOARD CONTENT AREA */}
      <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-7 space-y-5 max-w-[1500px] w-full overflow-y-auto">
        
        {/* 3.1 TOPBAR */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-[#111418] dark:text-[#f2f3f4]">
            Dashboard
          </h1>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Search Input with ⌘ K */}
            <div className="relative flex items-center bg-white dark:bg-[#141516] border border-[#e3e6ea] dark:border-[#232527] rounded-lg px-3 py-1.5 w-full sm:w-60 shadow-sm focus-within:border-cyan-600 transition-all duration-200">
              <Search className="h-4 w-4 text-[#9aa1a9] dark:text-[#5d6166] mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-[#111418] dark:text-[#f2f3f4] placeholder-[#9aa1a9] focus:outline-none"
              />
              <kbd className="hidden sm:inline-block bg-[#f1f3f5] dark:bg-[#1b1c1e] text-[#5f6670] dark:text-[#8b8f94] text-[10px] font-mono px-1.5 py-0.5 rounded border border-[#e3e6ea] dark:border-[#232527] shrink-0">
                ⌘ K
              </kbd>
            </div>

            {/* Notification Bell */}
            <button
              onClick={() => alert("You have 1 unread spending alert.")}
              className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-[#e3e6ea] dark:border-[#232527] bg-white dark:bg-[#141516] text-[#5f6670] dark:text-[#8b8f94] hover:text-[#111418] dark:hover:text-[#f2f3f4] hover:scale-105 active:scale-95 transition-all shadow-sm"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#141516]" />
            </button>

            {/* Fintrack Theme Toggle (Dark & Light buttons) */}
            <div className="flex items-center rounded-lg border border-[#e3e6ea] dark:border-[#232527] bg-[#f1f3f5] dark:bg-[#1b1c1e] p-0.5 shadow-sm">
              <button
                onClick={() => setTheme("dark")}
                className={`flex h-7 w-7 items-center justify-center rounded-md transition-all duration-200 ${
                  theme === "dark"
                    ? "bg-[#141516] text-white shadow-sm scale-105"
                    : "text-[#5f6670] hover:text-[#111418]"
                }`}
                title="Dark mode (Secondary)"
              >
                <Moon className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setTheme("light")}
                className={`flex h-7 w-7 items-center justify-center rounded-md transition-all duration-200 ${
                  theme === "light" || !theme
                    ? "bg-white text-[#111418] shadow-sm scale-105"
                    : "text-[#8b8f94] hover:text-white"
                }`}
                title="Light mode (Default)"
              >
                <Sun className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </header>

        {/* 3.2 SPENDING ALERT BANNER */}
        {showAlert && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-[#fde68a] dark:border-[#524412] bg-[#fef3c7] dark:bg-[#3a3210] px-4 py-2.5 text-xs text-[#a16207] dark:text-[#facc15] shadow-sm animate-in fade-in transition-all duration-200 hover:shadow-md">
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle className="h-4 w-4 shrink-0 text-[#a16207] dark:text-[#facc15]" />
              <span>
                <strong>Spending Alert:</strong> Dining expenses are 15% higher than your monthly average.
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/menu"
                className="font-semibold text-[#a16207] dark:text-[#facc15] hover:underline flex items-center gap-1 group"
              >
                <span>See details</span>
                <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <button onClick={() => setShowAlert(false)} className="opacity-70 hover:opacity-100">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* 3.3 TOP 3 STAT CARDS WITH COOL HOVER EFFECTS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Card 1: Total Balance */}
          <article className="group rounded-xl border border-[#e3e6ea] dark:border-[#232527] bg-white dark:bg-[#141516] shadow-sm flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:border-cyan-500/40 dark:hover:border-cyan-400/40 cursor-pointer">
            <div className="flex items-center justify-between p-3.5 pb-0 text-xs text-[#5f6670] dark:text-[#8b8f94]">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-[#f1f3f5] dark:bg-[#1b1c1e] text-[#111418] dark:text-white group-hover:bg-cyan-50 dark:group-hover:bg-cyan-950/40 group-hover:text-cyan-600 transition-colors">
                  <Wallet className="h-4 w-4" />
                </span>
                <span className="font-medium group-hover:text-[#111418] dark:group-hover:text-white transition-colors">Total Balance</span>
              </div>
              <button className="text-[#9aa1a9] hover:text-[#111418] dark:hover:text-white">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
            <div className="px-3.5 py-3 text-2xl font-semibold text-[#111418] dark:text-[#f2f3f4] font-mono tracking-tight group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
              ${(todayReport.totalSales > 0 ? todayReport.totalSales + 77387 : 82450).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center justify-between border-t border-[#e3e6ea] dark:border-[#232527] px-3.5 py-2.5 text-xs text-[#5f6670] dark:text-[#8b8f94]">
              <span>Positive growth</span>
              <span className="rounded bg-[#dcfce7] dark:bg-[#12301a] px-2 py-0.5 text-[10.5px] font-semibold text-[#15803d] dark:text-[#4ade80] shadow-sm">
                +12.4%
              </span>
            </div>
          </article>

          {/* Card 2: Total Income */}
          <article className="group rounded-xl border border-[#e3e6ea] dark:border-[#232527] bg-white dark:bg-[#141516] shadow-sm flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:border-emerald-500/40 dark:hover:border-emerald-400/40 cursor-pointer">
            <div className="flex items-center justify-between p-3.5 pb-0 text-xs text-[#5f6670] dark:text-[#8b8f94]">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-[#f1f3f5] dark:bg-[#1b1c1e] text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/40 transition-colors">
                  <TrendingUp className="h-4 w-4" />
                </span>
                <span className="font-medium group-hover:text-[#111418] dark:group-hover:text-white transition-colors">Total Income</span>
              </div>
              <button className="text-[#9aa1a9] hover:text-[#111418] dark:hover:text-white">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
            <div className="px-3.5 py-3 text-2xl font-semibold text-[#111418] dark:text-[#f2f3f4] font-mono tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              ${(todayReport.totalSales > 0 ? todayReport.totalSales : 9820).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center justify-between border-t border-[#e3e6ea] dark:border-[#232527] px-3.5 py-2.5 text-xs text-[#5f6670] dark:text-[#8b8f94]">
              <span>Monthly increase</span>
              <span className="rounded bg-[#dcfce7] dark:bg-[#12301a] px-2 py-0.5 text-[10.5px] font-semibold text-[#15803d] dark:text-[#4ade80] shadow-sm">
                +8.6%
              </span>
            </div>
          </article>

          {/* Card 3: Total Expenses */}
          <article className="group rounded-xl border border-[#e3e6ea] dark:border-[#232527] bg-white dark:bg-[#141516] shadow-sm flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:border-rose-500/40 dark:hover:border-rose-400/40 cursor-pointer">
            <div className="flex items-center justify-between p-3.5 pb-0 text-xs text-[#5f6670] dark:text-[#8b8f94]">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-[#f1f3f5] dark:bg-[#1b1c1e] text-rose-600 dark:text-rose-400 group-hover:bg-rose-50 dark:group-hover:bg-rose-950/40 transition-colors">
                  <TrendingDown className="h-4 w-4" />
                </span>
                <span className="font-medium group-hover:text-[#111418] dark:group-hover:text-white transition-colors">Total Expenses</span>
              </div>
              <button className="text-[#9aa1a9] hover:text-[#111418] dark:hover:text-white">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
            <div className="px-3.5 py-3 text-2xl font-semibold text-[#111418] dark:text-[#f2f3f4] font-mono tracking-tight group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
              ${(todayReport.totalCost > 0 ? todayReport.totalCost : 4630).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center justify-between border-t border-[#e3e6ea] dark:border-[#232527] px-3.5 py-2.5 text-xs text-[#5f6670] dark:text-[#8b8f94]">
              <span>Lower spending</span>
              <span className="rounded bg-[#fee2e2] dark:bg-[#3a1414] px-2 py-0.5 text-[10.5px] font-semibold text-[#b91c1c] dark:text-[#f87171] shadow-sm">
                -5.1%
              </span>
            </div>
          </article>
        </div>

        {/* 3.4 MIDDLE GRID: Cash Flow Overview (Left) + My Cards (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* ============================================================== */}
          {/* 3.4.1 LEFT: CASH FLOW OVERVIEW CHART (8 cols)                  */}
          {/* ============================================================== */}
          <article className="lg:col-span-8 rounded-xl border border-[#e3e6ea] dark:border-[#232527] bg-white dark:bg-[#141516] p-5 shadow-sm space-y-4 flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:border-cyan-500/30">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#111418] dark:text-[#f2f3f4]">
                Cash Flow Overview
              </h2>

              {/* Range Switcher */}
              <div className="flex items-center rounded-lg border border-[#e3e6ea] dark:border-[#232527] bg-[#f1f3f5] dark:bg-[#1b1c1e] p-0.5">
                {(["Daily", "Weekly", "Monthly"] as Range[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`rounded-md px-2.5 py-1 text-xs transition-all duration-200 ${
                      range === r
                        ? "bg-white dark:bg-[#141516] text-[#111418] dark:text-white font-medium shadow-sm scale-105"
                        : "text-[#5f6670] dark:text-[#8b8f94] hover:text-[#111418] dark:hover:text-white"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Chart Area */}
            <div className="relative pt-2">
              <div className="flex justify-between text-[11px] text-[#9aa1a9] dark:text-[#5d6166] font-mono mb-2">
                <span>$7.5K</span>
                <span>$6.0K</span>
                <span>$4.5K</span>
                <span>$3.0K</span>
                <span>$1.5K</span>
                <span>$0</span>
              </div>

              <div className="relative h-60 w-full overflow-hidden">
                {/* Horizontal grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
                  <div className="border-b border-[#e3e6ea] dark:border-[#232527]" />
                  <div className="border-b border-[#e3e6ea] dark:border-[#232527]" />
                  <div className="border-b border-[#e3e6ea] dark:border-[#232527]" />
                  <div className="border-b border-[#e3e6ea] dark:border-[#232527]" />
                  <div className="border-b border-[#e3e6ea] dark:border-[#232527]" />
                </div>

                {/* SVG Curves */}
                <svg
                  className="w-full h-full overflow-visible"
                  viewBox="0 0 1000 220"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="fintrackIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0891b2" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#0891b2" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {(() => {
                    const maxVal = 7500;
                    const stepX = 1000 / (chartSeries.length - 1);
                    const incPoints = chartSeries.map((d, i) => {
                      const x = i * stepX;
                      const y = 210 - (d.income / maxVal) * 190;
                      return { x, y, ...d };
                    });

                    let incPath = `M ${incPoints[0].x} ${incPoints[0].y}`;
                    for (let i = 0; i < incPoints.length - 1; i++) {
                      const p0 = incPoints[i];
                      const p1 = incPoints[i + 1];
                      const cx = (p0.x + p1.x) / 2;
                      incPath += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
                    }

                    const areaPath = `${incPath} L 1000 220 L 0 220 Z`;

                    // Expenses dashed line
                    let expPath = "";
                    chartSeries.forEach((d, i) => {
                      const x = i * stepX;
                      const y = 210 - (d.expenses / maxVal) * 190;
                      if (i === 0) expPath += `M ${x} ${y}`;
                      else expPath += ` L ${x} ${y}`;
                    });

                    return (
                      <>
                        <path d={areaPath} fill="url(#fintrackIncomeGrad)" />
                        <path
                          d={incPath}
                          fill="none"
                          stroke="#0891b2"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          className="drop-shadow-sm"
                        />
                        <path
                          d={expPath}
                          fill="none"
                          stroke="#b7880f"
                          strokeWidth="1.8"
                          strokeDasharray="6 5"
                        />

                        {incPoints.map((pt, idx) => (
                          <circle
                            key={idx}
                            cx={pt.x}
                            cy={pt.y}
                            r={hoveredChartPoint === idx ? 6 : 3.5}
                            fill="#0891b2"
                            stroke="#ffffff"
                            strokeWidth="2"
                            onMouseEnter={() => setHoveredChartPoint(idx)}
                            onMouseLeave={() => setHoveredChartPoint(null)}
                            className="cursor-pointer transition-all duration-200"
                          />
                        ))}
                      </>
                    );
                  })()}
                </svg>

                {/* Hover Tooltip */}
                {hoveredChartPoint !== null && chartSeries[hoveredChartPoint] && (
                  <div
                    className="absolute z-20 rounded-lg border border-[#e3e6ea] dark:border-[#2a2c2f] bg-white dark:bg-[#1b1c1e] p-2.5 text-xs text-[#111418] dark:text-white shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full transition-all duration-150"
                    style={{
                      left: `${(hoveredChartPoint / (chartSeries.length - 1)) * 100}%`,
                      top: "35%",
                    }}
                  >
                    <div className="font-bold text-[#0891b2] mb-1">
                      {chartSeries[hoveredChartPoint].label} Overview
                    </div>
                    <div className="flex justify-between gap-3 text-xs">
                      <span className="text-[#5f6670]">Income:</span>
                      <strong className="text-cyan-700 dark:text-cyan-400 font-mono">
                        ${chartSeries[hoveredChartPoint].income}
                      </strong>
                    </div>
                    <div className="flex justify-between gap-3 text-xs">
                      <span className="text-[#5f6670]">Expenses:</span>
                      <strong className="text-amber-700 dark:text-amber-400 font-mono">
                        ${chartSeries[hoveredChartPoint].expenses}
                      </strong>
                    </div>
                  </div>
                )}
              </div>

              {/* X Axis labels */}
              <div className="flex justify-between pt-3 text-[11px] text-[#5f6670] dark:text-[#8b8f94]">
                {chartSeries.map((d, i) => (
                  <span
                    key={i}
                    className={`transition-colors ${hoveredChartPoint === i ? "text-cyan-600 font-bold" : ""}`}
                  >
                    {d.label}
                  </span>
                ))}
              </div>
            </div>
          </article>

          {/* ============================================================== */}
          {/* 3.4.2 RIGHT: MY CARDS & CARD SPENDING (4 cols)                 */}
          {/* ============================================================== */}
          <article className="lg:col-span-4 rounded-xl border border-[#e3e6ea] dark:border-[rgba(34,211,238,0.25)] bg-white dark:bg-[#141516] p-5 shadow-sm space-y-4 flex flex-col justify-between transition-all duration-300 hover:shadow-md">
            
            {/* My Cards Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#111418] dark:text-[#f2f3f4]">
                My Cards
              </h2>
              <button
                onClick={() => alert("Card management available.")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#e3e6ea] dark:border-[#232527] bg-[#f1f3f5] dark:bg-[#1b1c1e] px-2.5 py-1 text-xs font-medium text-[#111418] dark:text-[#f2f3f4] hover:border-cyan-500 hover:text-cyan-600 hover:scale-105 active:scale-95 transition-all"
              >
                <Plus className="h-3 w-3" />
                <span>Add Card</span>
              </button>
            </div>

            {/* The Black Credit Card Widget with 3D Hover Lift */}
            <div className="relative rounded-[14px] p-4 text-[#e5e7eb] aspect-[1.66] flex flex-col justify-between shadow-xl bg-gradient-to-br from-[#3a3c3f] via-[#232426] to-[#2d2f31] border border-[#3f4245] transition-all duration-300 hover:scale-[1.03] hover:rotate-[0.5deg] hover:shadow-2xl cursor-pointer">
              {/* Chip & Contactless */}
              <div className="flex items-center gap-2 text-[#c9cbcf]">
                <div className="h-5 w-7 rounded-[4px] border border-amber-300/40 bg-amber-400/80 flex items-center justify-center text-[7px] font-black text-amber-950">
                  CHIP
                </div>
                <Wifi className="h-3.5 w-3.5 rotate-90" />
              </div>

              {/* Number */}
              <div className="my-auto font-mono text-sm tracking-[0.14em] text-[#a3a6ab] whitespace-nowrap">
                3110 2322 2342 1123
              </div>

              {/* Bottom Info + Mastercard circles */}
              <div className="flex items-end justify-between text-xs whitespace-nowrap">
                <div>
                  <small className="block text-[9.5px] text-[#9ca3af]">Card Holder Name</small>
                  <strong className="font-semibold text-white">Lily Rose</strong>
                </div>
                <div>
                  <small className="block text-[9.5px] text-[#9ca3af]">Expired Date</small>
                  <strong className="font-semibold text-white">11/30</strong>
                </div>
                {/* Mastercard Logo */}
                <div className="flex">
                  <div className="h-4 w-4 rounded-full bg-[#eb001b]" />
                  <div className="h-4 w-4 rounded-full bg-[#f79e1b] -ml-1.5 opacity-90" />
                </div>
              </div>
            </div>

            {/* Card Spending Header */}
            <div className="flex items-center justify-between pt-1">
              <h3 className="text-xs font-semibold text-[#111418] dark:text-[#f2f3f4]">
                Card Spending
              </h3>
              <select className="rounded-lg border border-[#e3e6ea] dark:border-[#232527] bg-[#f1f3f5] dark:bg-[#1b1c1e] px-2 py-1 text-xs text-[#111418] dark:text-[#f2f3f4] outline-none cursor-pointer">
                <option>This Month</option>
                <option>Last Month</option>
                <option>This Year</option>
              </select>
            </div>

            {/* Spend Value & Trend */}
            <div className="flex items-baseline gap-2 flex-wrap">
              <strong className="text-2xl font-bold text-[#111418] dark:text-white font-mono">
                $2,486.50
              </strong>
              <span className="inline-flex items-center gap-0.5 text-xs font-medium text-[#15803d] dark:text-[#4ade80]">
                <ArrowUpRight className="h-3.5 w-3.5" />
                +8.6%
              </span>
              <small className="text-xs text-[#5f6670] dark:text-[#8b8f94]">vs last month</small>
            </div>

            {/* The Segmented Pill Progress Meter with Hover Glow */}
            <div className="flex gap-1 h-8 my-1 group" aria-label="Spending meter">
              {Array.from({ length: meterCount }).map((_, idx) => (
                <span
                  key={idx}
                  className={`flex-1 rounded-[2px] transition-all duration-200 hover:scale-125 cursor-pointer ${
                    idx < activeMeterBars
                      ? "bg-gradient-to-t from-[#0891b2] to-[#06b6d4] group-hover:brightness-110"
                      : "bg-[#f1f3f5] dark:bg-[#1b1c1e]"
                  }`}
                />
              ))}
            </div>

            {/* Limit Banner */}
            <div className="rounded-lg bg-[#f1f3f5] dark:bg-[#1b1c1e] p-2 text-xs text-[#5f6670] dark:text-[#8b8f94]">
              Monthly Limit: <strong className="text-[#111418] dark:text-[#f2f3f4] font-semibold">$4,000.00</strong>
            </div>
          </article>
        </div>

        {/* 3.5 BOTTOM PANEL: TRANSACTION HISTORY */}
        <article className="rounded-xl border border-[#e3e6ea] dark:border-[#232527] bg-white dark:bg-[#141516] p-5 shadow-sm space-y-4 transition-all duration-300 hover:shadow-md">
          
          {/* Header & Tools */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-[#111418] dark:text-[#f2f3f4]">
              Transaction History
            </h2>

            <div className="flex items-center gap-2.5">
              {/* Search */}
              <div className="relative flex items-center bg-[#f1f3f5] dark:bg-[#1b1c1e] border border-[#e3e6ea] dark:border-[#232527] rounded-lg px-2.5 py-1 text-xs w-48 sm:w-56 focus-within:border-cyan-600 transition-colors">
                <Search className="h-3.5 w-3.5 text-[#9aa1a9] mr-1.5 shrink-0" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs text-[#111418] dark:text-[#f2f3f4] focus:outline-none"
                />
              </div>

              {/* Filter */}
              <div className="relative">
                <button
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#e3e6ea] dark:border-[#232527] bg-[#f1f3f5] dark:bg-[#1b1c1e] px-2.5 py-1 text-xs font-medium text-[#111418] dark:text-[#f2f3f4] hover:border-cyan-500 hover:scale-105 active:scale-95 transition-all"
                >
                  <Filter className="h-3 w-3" />
                  <span>Filter {statusFilter !== "All" ? `(${statusFilter})` : ""}</span>
                </button>

                {showFilterMenu && (
                  <div className="absolute right-0 top-full mt-1.5 z-30 rounded-lg border border-[#e3e6ea] dark:border-[#2a2c2f] bg-white dark:bg-[#1b1c1e] p-1 shadow-xl min-w-[120px] animate-in fade-in">
                    {(["All", "Success", "Pending", "Failed"] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => {
                          setStatusFilter(st);
                          setShowFilterMenu(false);
                        }}
                        className={`w-full text-left rounded px-2.5 py-1 text-xs transition-colors ${
                          statusFilter === st
                            ? "bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-400 font-bold"
                            : "text-[#5f6670] dark:text-[#8b8f94] hover:bg-[#f1f3f5] dark:hover:bg-[#232527]"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Table with interactive hover rows */}
          <div className="overflow-x-auto border border-[#e3e6ea] dark:border-[#232527] rounded-lg">
            <table className="w-full text-left text-xs min-w-[760px]">
              <thead>
                <tr className="bg-[#f1f3f5] dark:bg-[#1b1c1e] text-[#9aa1a9] dark:text-[#5d6166] font-normal text-xs">
                  <th className="py-2.5 px-3 w-10">
                    <input
                      type="checkbox"
                      checked={pagedTransactions.length > 0 && selectedIds.size === pagedTransactions.length}
                      onChange={toggleSelectAll}
                      className="rounded accent-cyan-600 cursor-pointer"
                    />
                  </th>
                  <th className="py-2.5 px-3">Transaction ID</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e6ea] dark:divide-[#232527]">
                {pagedTransactions.map((tx) => {
                  const isSelected = selectedIds.has(tx.id);
                  const catDotColor = CATEGORY_COLORS[tx.category] || "#0891b2";

                  return (
                    <tr
                      key={tx.id}
                      className={`hover:bg-cyan-50/50 dark:hover:bg-cyan-950/20 transition-all duration-150 group cursor-pointer ${
                        isSelected ? "bg-cyan-50/60 dark:bg-cyan-950/20" : ""
                      }`}
                    >
                      <td className="py-3 px-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectId(tx.id)}
                          className="rounded accent-cyan-600 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-3 font-mono text-[11.5px] text-[#5f6670] dark:text-[#8b8f94] group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                        {tx.id}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${tx.badgeBg} ${tx.badgeColor} transition-transform duration-200 group-hover:scale-110`}
                          >
                            {tx.initial}
                          </span>
                          <span className="font-medium text-[#111418] dark:text-[#f2f3f4]">
                            {tx.description}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1.5 text-xs text-[#5f6670] dark:text-[#8b8f94]">
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: catDotColor }}
                          />
                          <span>{tx.category}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#5f6670] dark:text-[#8b8f94]">
                        {tx.date}
                      </td>
                      <td className="py-3 px-3 font-mono font-medium text-[#111418] dark:text-[#f2f3f4]">
                        -${Math.abs(tx.amount).toFixed(2)}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-[11px] font-medium transition-transform group-hover:scale-105 ${
                            tx.status === "Success"
                              ? "bg-[#dcfce7] dark:bg-[#12301a] text-[#15803d] dark:text-[#4ade80] border border-emerald-500/20"
                              : tx.status === "Pending"
                              ? "bg-[#fef3c7] dark:bg-[#3a3210] text-[#a16207] dark:text-[#facc15] border border-amber-500/20"
                              : "bg-[#fee2e2] dark:bg-[#3a1414] text-[#b91c1c] dark:text-[#f87171] border border-rose-500/20"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button className="text-[#9aa1a9] hover:text-[#111418] dark:hover:text-white hover:scale-110 transition-all">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer / Pager */}
          <div className="flex items-center justify-between text-xs text-[#5f6670] dark:text-[#8b8f94] pt-2">
            <span>
              Showing {filteredTransactions.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-
              {Math.min(currentPage * pageSize, filteredTransactions.length)} of {filteredTransactions.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="flex h-7 w-7 items-center justify-center rounded border border-[#e3e6ea] dark:border-[#232527] bg-white dark:bg-[#141516] disabled:opacity-40 hover:bg-[#f1f3f5] hover:scale-105 active:scale-95 transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-medium text-[#111418] dark:text-white">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="flex h-7 w-7 items-center justify-center rounded border border-[#e3e6ea] dark:border-[#232527] bg-white dark:bg-[#141516] disabled:opacity-40 hover:bg-[#f1f3f5] hover:scale-105 active:scale-95 transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
