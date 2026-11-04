"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Grid3X3,
  ArrowRight,
  Sparkles,
  Store,
  Clock,
  CheckCircle2,
  Trophy,
  Users,
  UtensilsCrossed,
  QrCode,
  Smartphone,
  Banknote,
  RotateCcw,
  Calendar,
  Layers,
  Database,
  ArrowUpRight,
  Flame,
  Receipt,
  Check,
  RefreshCw,
  Cloud,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
} from "lucide-react";
import {
  usePOSStore,
  BRANCHES,
  getTodayProfitReport,
  resetDemoData,
  syncAllDataToMongoDB,
  saveDailySalesRecord,
} from "@/lib/store";
import {
  fetchDailySales,
  fetchDailySalesList,
  DailySalesRecord,
} from "@/lib/api";
import { useAuth } from "@/lib/authContext";

export default function OwnerDashboard() {
  const { orders, tables, waiters } = usePOSStore();
  const { isSuperAdmin } = useAuth();

  const [selectedBranch, setSelectedBranch] = useState("all");
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const isToday = selectedDate === todayStr;

  const [dbInfo, setDbInfo] = useState<{ connected: boolean; message: string }>({
    connected: false,
    message: "Connecting...",
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Daily Sales by Date states
  const [savedDailyRecords, setSavedDailyRecords] = useState<DailySalesRecord[]>([]);
  const [remoteDayRecord, setRemoteDayRecord] = useState<DailySalesRecord | null>(null);
  const [isLoadingDate, setIsLoadingDate] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Collapsible section states ("kpi" | "money" | "waiters" | null)
  const [expandedSection, setExpandedSection] = useState<"kpi" | "money" | "waiters" | null>(null);
  const [expandAll, setExpandAll] = useState(false);

  // Global click anywhere listener: when any section is expanded in detail mode,
  // clicking anywhere (on the card or anywhere on the page) collapses it back
  useEffect(() => {
    if (!expandedSection) return;

    const handleGlobalClick = () => {
      setExpandedSection(null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setExpandedSection(null);
      }
    };

    const timer = setTimeout(() => {
      window.addEventListener("click", handleGlobalClick);
      window.addEventListener("keydown", handleKeyDown);
    }, 60);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("click", handleGlobalClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [expandedSection]);

  // Check DB status
  useEffect(() => {
    fetch("/api/status")
      .then((res) => res.json())
      .then((data) => {
        setDbInfo({
          connected: Boolean(data.connected),
          message: data.message,
        });
      })
      .catch(() => {
        setDbInfo({
          connected: false,
          message: "Local memory & storage sync active",
        });
      });
  }, []);

  // Fetch list of saved daily sales dates from MongoDB
  const loadSavedDailyList = () => {
    fetchDailySalesList({ branchId: selectedBranch, limit: 30 })
      .then((res) => {
        if (res.success && res.records) {
          setSavedDailyRecords(res.records);
        }
      })
      .catch(() => { });
  };

  useEffect(() => {
    loadSavedDailyList();
  }, [selectedBranch]);

  // Load daily sales record from MongoDB when selectedDate or branch changes
  useEffect(() => {
    let active = true;
    setIsLoadingDate(true);
    fetchDailySales(selectedDate, selectedBranch)
      .then((res) => {
        if (active && res.success && res.record) {
          setRemoteDayRecord(res.record);
        } else if (active) {
          setRemoteDayRecord(null);
        }
      })
      .catch(() => {
        if (active) setRemoteDayRecord(null);
      })
      .finally(() => {
        if (active) setIsLoadingDate(false);
      });
    return () => {
      active = false;
    };
  }, [selectedDate, selectedBranch]);

  // Auto-sync current orders and daily sales to MongoDB on load
  useEffect(() => {
    const timer = setTimeout(() => {
      syncAllDataToMongoDB()
        .then((res) => {
          if (res.success) {
            console.log("Auto-synced to MongoDB Atlas successfully");
            loadSavedDailyList();
          }
        })
        .catch(() => { });
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleSyncToMongoDB = async () => {
    setIsSyncing(true);
    setSyncFeedback("Syncing orders, staff, item consumption, and daily sales to MongoDB Atlas...");
    try {
      const res = await syncAllDataToMongoDB();
      if (res.success) {
        setSyncFeedback(
          `✓ Saved to MongoDB Atlas (${res.ordersSaved} orders, ${res.waitersSaved} staff, daily sales saved)`
        );
        loadSavedDailyList();
      } else {
        setSyncFeedback(res.message);
      }
    } catch (err: any) {
      setSyncFeedback("Sync error: " + err.message);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncFeedback(null), 6000);
    }
  };

  // Dedicated Save Daily Sales for selected date
  const handleSaveDailySalesForDate = async () => {
    setIsSyncing(true);
    setSyncFeedback(`Saving daily sales for date ${selectedDate} to MongoDB Atlas...`);
    try {
      const res = await saveDailySalesRecord(selectedDate, selectedBranch);
      if (res.success) {
        setSyncFeedback(`✓ Daily sales for ${selectedDate} saved to MongoDB Atlas successfully!`);
        if (res.record) setRemoteDayRecord(res.record);
        loadSavedDailyList();
      } else {
        setSyncFeedback(res.message);
      }
    } catch (err: any) {
      setSyncFeedback("Save error: " + err.message);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncFeedback(null), 6000);
    }
  };

  // Listen to branch switch from header
  useEffect(() => {
    const handleBranchSwitched = (e: any) => {
      if (e.detail) setSelectedBranch(e.detail);
    };
    window.addEventListener("branch_switched", handleBranchSwitched);
    return () => window.removeEventListener("branch_switched", handleBranchSwitched);
  }, []);

  // Compute local metrics for selected date
  const localReport = useMemo(() => {
    return getTodayProfitReport(selectedBranch, selectedDate);
  }, [orders, waiters, selectedBranch, selectedDate]);

  // Combine remote saved daily sales record or live local orders
  const report = useMemo(() => {
    if (remoteDayRecord && (!isToday || remoteDayRecord.totalSales >= localReport.totalSales)) {
      return {
        totalSales: remoteDayRecord.totalSales,
        totalCost: remoteDayRecord.totalCost,
        netProfit: remoteDayRecord.netProfit,
        profitMargin: remoteDayRecord.profitMargin,
        paidCount: remoteDayRecord.paidOrdersCount,
        cashTotal: remoteDayRecord.moneyBreakdown?.cash || 0,
        qrTotal: remoteDayRecord.moneyBreakdown?.qr || 0,
        ussdTotal: remoteDayRecord.moneyBreakdown?.ussd || 0,
        waiterStats: remoteDayRecord.waiterPerformances || [],
        topWaiter: remoteDayRecord.waiterPerformances?.[0] || null,
        itemConsumption: (remoteDayRecord.itemsSold || []).map((i) => ({
          name: i.name,
          category: i.category || "General",
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          unitCost: i.unitCost,
          revenue: i.totalRevenue,
          cost: i.totalCost,
          profit: i.profit,
          profitMargin: i.profitMargin || "0",
          percentageOfTotalExpenses:
            remoteDayRecord.totalCost > 0
              ? ((i.totalCost / remoteDayRecord.totalCost) * 100).toFixed(1)
              : "0.0",
        })),
      };
    }
    return localReport;
  }, [remoteDayRecord, localReport, isToday]);

  const topWaiter = report.topWaiter;

  // Highest payment channel breakdown recorded today
  const highestPaymentChannel = useMemo(() => {
    const channels = [
      {
        id: "qr",
        name: "Telebirr & CBE Birr QR",
        amount: report.qrTotal,
        icon: QrCode,
        color: "emerald",
        badgeBg: "bg-emerald-500/10",
        badgeBorder: "border-emerald-500/30",
        textColor: "text-emerald-400",
        desc: "Scanned and verified directly in restaurant merchant account",
      },
      {
        id: "cash",
        name: "Physical Cash in Drawer",
        amount: report.cashTotal,
        icon: Banknote,
        color: "amber",
        badgeBg: "bg-amber-500/10",
        badgeBorder: "border-amber-500/30",
        textColor: "text-amber-400",
        desc: "Collected manually by waiters from cash paying guests",
      },
      {
        id: "ussd",
        name: "USSD Push Money",
        amount: report.ussdTotal,
        icon: Smartphone,
        color: "cyan",
        badgeBg: "bg-cyan-500/10",
        badgeBorder: "border-cyan-500/30",
        textColor: "text-cyan-400",
        desc: "Triggered directly to customer phone number via USSD",
      },
    ];

    const sorted = [...channels].sort((a, b) => b.amount - a.amount);
    const top = sorted[0];
    const pct = report.totalSales > 0 ? ((top.amount / report.totalSales) * 100).toFixed(0) : "0";

    return {
      ...top,
      percentage: pct,
      channels,
    };
  }, [report.qrTotal, report.cashTotal, report.ussdTotal, report.totalSales]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">

      {/* 1. TOP HEADER & DATE CONTROL */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Restaurant Daily Sales & Profit
            </h1>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/20">
              Live Output
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time calculation of today's sales, item consumption, money ledger, and waiter rankings
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Database indicator */}
          <div
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold ${dbInfo.connected
                ? "border-emerald-500/30 bg-emerald-950/40 text-emerald-400"
                : "border-cyan-500/30 bg-cyan-950/40 text-cyan-400"
              }`}
            title={dbInfo.message}
          >
            <Database className="h-3.5 w-3.5" />
            <span className="hidden md:inline">
              {dbInfo.connected ? "MongoDB Atlas Synced" : "Database Ready"}
            </span>
          </div>

          {!isSuperAdmin && (
            <Link
              href="/waiter"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-950 hover:from-emerald-500 hover:to-teal-500 transition active:scale-95"
            >
              <Smartphone className="h-4 w-4" />
              <span>Open Waiter App</span>
            </Link>
          )}
        </div>
      </div>

      {/* 1.1 DATE SELECTOR & DATABASE CONTROLS */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Calendar className="h-4 w-4 text-emerald-400" />
            <span>Select Date:</span>
          </div>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-bold text-white focus:border-emerald-500 focus:outline-none transition"
          />

          <button
            onClick={() => setSelectedDate(todayStr)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${isToday
                ? "bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-950"
                : "bg-slate-800 text-slate-300 hover:bg-slate-750"
              }`}
          >
            Today
          </button>

          <button
            onClick={() => {
              const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
              setSelectedDate(y);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${selectedDate === new Date(Date.now() - 86400000).toISOString().slice(0, 10)
                ? "bg-emerald-500 text-slate-950 font-black"
                : "bg-slate-800 text-slate-300 hover:bg-slate-750"
              }`}
          >
            Yesterday
          </button>

          {/* Database saved status pill */}
          {remoteDayRecord ? (
            <span className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs font-bold text-emerald-400">
              <Check className="h-3.5 w-3.5" />
              <span>Saved in Database ({remoteDayRecord.totalSales.toLocaleString()} ETB)</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 text-xs font-bold text-amber-400">
              <Clock className="h-3.5 w-3.5" />
              <span>{isToday ? "Live Day (Auto-syncing)" : "Calculated from orders"}</span>
            </span>
          )}

          {isLoadingDate && (
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <RefreshCw className="h-3 w-3 animate-spin text-emerald-400" />
              <span>Fetching...</span>
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Expand/Compact All toggle */}
          <button
            onClick={() => {
              if (expandAll) {
                setExpandAll(false);
                setExpandedSection(null);
              } else {
                setExpandAll(true);
                setExpandedSection(null);
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200 transition"
            title={expandAll ? "Collapse all rows into simple highlight cards" : "Expand all rows into detailed cards"}
          >
            {expandAll ? (
              <>
                <Minimize2 className="h-3.5 w-3.5 text-amber-400" />
                <span>Compact View</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Expand All</span>
              </>
            )}
          </button>

          {/* History drawer toggle */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200 transition"
          >
            <Layers className="h-3.5 w-3.5 text-cyan-400" />
            <span>{showHistory ? "Hide Daily History" : `Daily Sales Records (${savedDailyRecords.length})`}</span>
          </button>

          {/* Save Daily Sales to MongoDB button */}
          <button
            onClick={handleSaveDailySalesForDate}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-950 transition active:scale-95 disabled:opacity-50"
          >
            <Database className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "Saving..." : `Save ${isToday ? "Today's" : selectedDate} Sales to Database`}</span>
          </button>
        </div>
      </div>

      {syncFeedback && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-4 py-2.5 text-xs font-bold text-emerald-300 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-400" />
            <span>{syncFeedback}</span>
          </span>
          <button
            onClick={() => setSyncFeedback(null)}
            className="text-slate-400 hover:text-white text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1.2 SAVED DAILY SALES HISTORY TABLE (IF TOGGLED) */}
      {showHistory && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Database className="h-4 w-4 text-emerald-400" />
                <span>Saved Daily Sales Records in MongoDB Database</span>
              </h2>
              <p className="text-xs text-slate-400">
                Daily sales totals, net profits, and order breakdowns saved by date in the database
              </p>
            </div>
            <button
              onClick={loadSavedDailyList}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 font-semibold"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Refresh List</span>
            </button>
          </div>

          {savedDailyRecords.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No daily sales saved in the database yet. Click "Save to Database" above to save today's record!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-3">Branch</th>
                    <th className="py-3 px-3 text-right">Gross Sales (ETB)</th>
                    <th className="py-3 px-3 text-right">Cost (ETB)</th>
                    <th className="py-3 px-3 text-right">Net Profit (ETB)</th>
                    <th className="py-3 px-3 text-center">Margin</th>
                    <th className="py-3 px-3 text-center">Paid Orders</th>
                    <th className="py-3 px-3 text-right">Cash / QR / USSD</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {savedDailyRecords.map((rec) => {
                    const isSelected = rec.date === selectedDate;
                    return (
                      <tr
                        key={rec.id || rec.date}
                        className={`transition ${isSelected ? "bg-emerald-950/30 font-bold" : "hover:bg-slate-850"
                          }`}
                      >
                        <td className="py-3 px-4 text-white font-bold flex items-center gap-2">
                          <CalendarDays className="h-3.5 w-3.5 text-emerald-400" />
                          <span>{rec.date}</span>
                          {rec.date === todayStr && (
                            <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-black text-emerald-400">
                              Today
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 uppercase text-[11px] text-slate-400">
                          {rec.branchId}
                        </td>
                        <td className="py-3 px-3 text-right font-black text-white">
                          {rec.totalSales.toLocaleString()} ETB
                        </td>
                        <td className="py-3 px-3 text-right text-rose-300 font-mono">
                          {rec.totalCost.toLocaleString()} ETB
                        </td>
                        <td className="py-3 px-3 text-right font-black text-emerald-400">
                          +{rec.netProfit.toLocaleString()} ETB
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold text-[10px]">
                            {rec.profitMargin}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center text-slate-300">
                          {rec.paidOrdersCount}
                        </td>
                        <td className="py-3 px-3 text-right text-[11px] text-slate-400">
                          <span>{rec.moneyBreakdown?.cash || 0}</span> /{" "}
                          <span>{rec.moneyBreakdown?.qr || 0}</span> /{" "}
                          <span>{rec.moneyBreakdown?.ussd || 0}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedDate(rec.date);
                              setShowHistory(false);
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${isSelected
                                ? "bg-emerald-500 text-slate-950"
                                : "bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300"
                              }`}
                          >
                            {isSelected ? "Viewing" : "View Day"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 2. CORE FINANCIAL KPI CARDS: COLLAPSIBLE HIGHLIGHT CARD & SMOOTH DETAIL SPREAD */}
      {expandedSection === "kpi" || expandAll ? (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setExpandedSection(null);
          }}
          className="rounded-2xl bg-slate-900/90 border border-emerald-500/40 p-5 shadow-2xl space-y-4 animate-spread cursor-pointer transition-all duration-300 ring-1 ring-emerald-500/20"
          title="Click anywhere to collapse back to summary"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-400" />
                <span>{isToday ? "Today's Financial Performance" : `Financial Performance (${selectedDate})`}</span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                  Detail Mode
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Detailed breakdown of gross revenue, kitchen cost, net margins, and top waiter
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700 hover:text-white transition">
                <ChevronUp className="h-3.5 w-3.5 text-emerald-400" />
                <span>Click anywhere to collapse</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Sales */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800/80 p-5 border border-slate-800 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {isToday ? "Today's Gross Sales" : `Gross Sales (${selectedDate})`}
                </span>
                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-black text-white tracking-tight">
                  {report.totalSales.toLocaleString()} <span className="text-lg text-emerald-400 font-bold">ETB</span>
                </div>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <span>{report.paidCount} paid transactions</span>
                </p>
              </div>
            </div>

            {/* Card 2: Cost of Goods / What Was Used */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800/80 p-5 border border-slate-800 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {isToday ? "Cost of What Was Used" : `Cost of Goods (${selectedDate})`}
                </span>
                <div className="h-9 w-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                  <UtensilsCrossed className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-black text-rose-300 tracking-tight">
                  {report.totalCost.toLocaleString()} <span className="text-lg text-rose-400 font-bold">ETB</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Exact food, drinks & ingredient expenses
                </p>
              </div>
            </div>

            {/* Card 3: Net Profit Output */}
            <div className="rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-teal-950/30 p-5 border border-emerald-500/40 shadow-xl relative overflow-hidden ring-1 ring-emerald-500/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  {isToday ? "Today's Net Profit" : `Net Profit (${selectedDate})`}
                </span>
                <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-black text-emerald-400 tracking-tight">
                  +{report.netProfit.toLocaleString()} <span className="text-lg font-bold">ETB</span>
                </div>
                <p className="text-xs text-emerald-300/80 mt-1 flex items-center gap-1 font-semibold">
                  <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[11px] font-black">
                    {report.profitMargin}% Profit Margin
                  </span>
                  <span>(Sales minus Cost)</span>
                </p>
              </div>
            </div>

            {/* Card 4: Top Waiter of the Day */}
            <div className="rounded-2xl bg-gradient-to-br from-amber-950/30 via-slate-900 to-orange-950/30 p-5 border border-amber-500/30 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  {isToday ? "#1 Top Waiter Today" : `#1 Top Waiter (${selectedDate})`}
                </span>
                <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Trophy className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                {topWaiter ? (
                  <>
                    <div className="text-2xl font-black text-white flex items-center gap-2">
                      <span className="text-2xl">{topWaiter.avatar}</span>
                      <span>{topWaiter.name}</span>
                    </div>
                    <p className="text-xs text-amber-300 font-bold mt-1">
                      {topWaiter.sales.toLocaleString()} ETB ({topWaiter.percentageOfTotal}% of total sales)
                    </p>
                  </>
                ) : (
                  <div className="text-sm text-slate-400">No waiter sales recorded yet</div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Row 1 Collapsed: ONLY Gross Sales & Net Profit */
        <div
          onClick={(e) => {
            e.stopPropagation();
            setExpandedSection("kpi");
          }}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-850 p-5 border border-slate-800 hover:border-emerald-500/50 shadow-xl transition-all duration-300 cursor-pointer hover:shadow-2xl hover:shadow-emerald-950/20 hover:-translate-y-0.5"
          title="Click to view detailed financial breakdown (Gross, Cost of Used, Net Margin)"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <DollarSign className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{isToday ? "Today's Financial Overview" : `Financial Overview (${selectedDate})`}</span>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                    Revenue & Profit
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Gross Sales and Net Profit Margin
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800/80 text-emerald-400 border border-slate-700/80 group-hover:bg-emerald-500 group-hover:text-slate-950 group-hover:border-emerald-400 transition-all duration-200 shadow-sm">
                <Maximize2 className="h-3.5 w-3.5" />
                <span>View Details</span>
                <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:translate-y-0.5" />
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Gross Sales */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <div className="h-12 w-12 shrink-0 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-inner">
                <DollarSign className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Today's Gross Sales
                </span>
                <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {report.totalSales.toLocaleString()} <span className="text-base text-emerald-400 font-bold">ETB</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{report.paidCount} paid transactions</p>
              </div>
            </div>

            {/* Net Profit */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-emerald-950/30 to-slate-950/80 border border-emerald-500/30">
              <div className="h-12 w-12 shrink-0 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-inner">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400 block">
                  Today's Net Profit
                </span>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
                  +{report.netProfit.toLocaleString()} <span className="text-base font-bold">ETB</span>
                </div>
                <p className="text-xs text-emerald-300/80 mt-0.5 font-semibold flex items-center gap-1.5">
                  <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-black">
                    {report.profitMargin}% Margin
                  </span>
                  <span>(Sales minus Cost)</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. ROW 2: HIGHEST MONEY BREAKDOWN RECORDED & TOP 1 WAITER (COLLAPSED BY DEFAULT, SMOOTH SPREAD TO DETAIL MODE) */}
      {expandedSection === "money" ? (
        /* Payment Breakdown Detail Mode */
        <div
          onClick={(e) => {
            e.stopPropagation();
            setExpandedSection(null);
          }}
          className="rounded-2xl bg-slate-900/90 border border-cyan-500/40 p-5 shadow-2xl space-y-4 animate-spread cursor-pointer transition-all duration-300 ring-1 ring-cyan-500/20"
          title="Click anywhere to collapse back to summary"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Banknote className="h-4 w-4 text-cyan-400" />
                <span>Money In Restaurant Today (Payment Breakdown)</span>
                <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-400 border border-cyan-500/20">
                  Payment Channels Detail
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Detailed breakdown of physical cash collected vs mobile money directly received via QR and USSD
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="text-xs font-mono font-bold text-slate-300 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                Total Money: {report.totalSales.toLocaleString()} ETB
              </div>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700 hover:text-white transition">
                <ChevronUp className="h-3.5 w-3.5 text-cyan-400" />
                <span>Click anywhere to collapse</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Physical Cash in Register */}
            <div className="rounded-xl bg-slate-950 border border-amber-500/30 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-amber-400 flex items-center gap-1.5">
                  <Banknote className="h-4 w-4" />
                  <span>Physical Cash in Drawer</span>
                </span>
                <span className="text-xs font-black text-amber-300">
                  {report.totalSales > 0 ? ((report.cashTotal / report.totalSales) * 100).toFixed(0) : 0}%
                </span>
              </div>
              <div className="text-2xl font-black text-white">
                {report.cashTotal.toLocaleString()} <span className="text-sm text-amber-400">ETB</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Collected manually by waiters from cash paying guests
              </p>
            </div>

            {/* Telebirr & CBE Birr QR */}
            <div className="rounded-xl bg-slate-950 border border-emerald-500/30 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-emerald-400 flex items-center gap-1.5">
                  <QrCode className="h-4 w-4" />
                  <span>Telebirr & CBE Birr QR</span>
                </span>
                <span className="text-xs font-black text-emerald-300">
                  {report.totalSales > 0 ? ((report.qrTotal / report.totalSales) * 100).toFixed(0) : 0}%
                </span>
              </div>
              <div className="text-2xl font-black text-white">
                {report.qrTotal.toLocaleString()} <span className="text-sm text-emerald-400">ETB</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Scanned and verified directly in restaurant merchant account
              </p>
            </div>

            {/* USSD Push Mobile Money */}
            <div className="rounded-xl bg-slate-950 border border-cyan-500/30 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-cyan-400 flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4" />
                  <span>USSD Push Money</span>
                </span>
                <span className="text-xs font-black text-cyan-300">
                  {report.totalSales > 0 ? ((report.ussdTotal / report.totalSales) * 100).toFixed(0) : 0}%
                </span>
              </div>
              <div className="text-2xl font-black text-white">
                {report.ussdTotal.toLocaleString()} <span className="text-sm text-cyan-400">ETB</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Triggered directly to customer phone number via USSD
              </p>
            </div>
          </div>
        </div>
      ) : expandedSection === "waiters" ? (
        /* Waiter Performance Leaderboard Detail Mode */
        <div
          onClick={(e) => {
            e.stopPropagation();
            setExpandedSection(null);
          }}
          className="rounded-2xl bg-slate-900/90 border border-amber-500/40 p-5 shadow-2xl space-y-4 animate-spread cursor-pointer transition-all duration-300 ring-1 ring-amber-500/20"
          title="Click anywhere to collapse back to summary"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-400" />
                <span>Waiter Performance Leaderboard (Who Sold the Most Today)</span>
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                  Staff Rankings Detail
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Ranked by total sales revenue generated today, order count, and payment method breakdown
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full">
                {report.waiterStats.length} Waiters Active
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700 hover:text-white transition">
                <ChevronUp className="h-3.5 w-3.5 text-amber-400" />
                <span>Click anywhere to collapse</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {report.waiterStats.map((w, index) => {
              const isWinner = index === 0 && w.sales > 0;
              return (
                <div
                  key={w.id}
                  className={`rounded-2xl p-4 border transition flex flex-col justify-between ${
                    isWinner
                      ? "bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/60 ring-2 ring-amber-500/30"
                      : "bg-slate-950/80 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span
                        className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-black ${
                          isWinner
                            ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-900"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        #{index + 1}
                      </span>
                      {isWinner && (
                        <span className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                          🏆 Leader
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5 mt-3">
                      <span className="text-3xl">{w.avatar}</span>
                      <div>
                        <h4 className="text-sm font-bold text-white leading-tight">{w.name}</h4>
                        <p className="text-[11px] text-slate-400">{w.ordersCount} orders served</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 space-y-1.5">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-slate-400">Total Sales:</span>
                        <span className="text-lg font-black text-white">
                          {w.sales.toLocaleString()} <span className="text-xs text-emerald-400">ETB</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Avg Ticket:</span>
                        <span className="font-semibold text-slate-200">{w.avgTicket} ETB</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Net Profit Generated:</span>
                        <span className="font-semibold text-emerald-400">+{w.profit.toLocaleString()} ETB</span>
                      </div>

                      {/* Mini Payment Breakdown Bar */}
                      <div className="pt-2">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                          <span>Cash: {w.cash}</span>
                          <span>QR: {w.qr}</span>
                          <span>USSD: {w.ussd}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                          {w.sales > 0 && (
                            <>
                              <div
                                style={{ width: `${(w.cash / w.sales) * 100}%` }}
                                className="bg-amber-500"
                                title={`Cash: ${w.cash} ETB`}
                              />
                              <div
                                style={{ width: `${(w.qr / w.sales) * 100}%` }}
                                className="bg-emerald-500"
                                title={`QR: ${w.qr} ETB`}
                              />
                              <div
                                style={{ width: `${(w.ussd / w.sales) * 100}%` }}
                                className="bg-cyan-500"
                                title={`USSD: ${w.ussd} ETB`}
                              />
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 text-right">
                    <span className="text-[10px] font-bold text-slate-500">
                      {w.percentageOfTotal}% of total restaurant sales
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : expandAll ? (
        /* Expand All Mode: Payment Breakdown & Waiter Leaderboard */
        <div className="space-y-6">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-emerald-400" />
                  <span>Money In Restaurant Today (Payment Breakdown)</span>
                </h2>
                <p className="text-xs text-slate-400">
                  See physical cash collected vs mobile money directly received via QR and USSD
                </p>
              </div>
              <div className="text-xs font-mono font-bold text-slate-300 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                Total Money: {report.totalSales.toLocaleString()} ETB
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl bg-slate-950 border border-amber-500/30 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-amber-400 flex items-center gap-1.5">
                    <Banknote className="h-4 w-4" />
                    <span>Physical Cash in Drawer</span>
                  </span>
                  <span className="text-xs font-black text-amber-300">
                    {report.totalSales > 0 ? ((report.cashTotal / report.totalSales) * 100).toFixed(0) : 0}%
                  </span>
                </div>
                <div className="text-2xl font-black text-white">
                  {report.cashTotal.toLocaleString()} <span className="text-sm text-amber-400">ETB</span>
                </div>
                <p className="text-[11px] text-slate-400">Collected manually by waiters from cash paying guests</p>
              </div>

              <div className="rounded-xl bg-slate-950 border border-emerald-500/30 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-emerald-400 flex items-center gap-1.5">
                    <QrCode className="h-4 w-4" />
                    <span>Telebirr & CBE Birr QR</span>
                  </span>
                  <span className="text-xs font-black text-emerald-300">
                    {report.totalSales > 0 ? ((report.qrTotal / report.totalSales) * 100).toFixed(0) : 0}%
                  </span>
                </div>
                <div className="text-2xl font-black text-white">
                  {report.qrTotal.toLocaleString()} <span className="text-sm text-emerald-400">ETB</span>
                </div>
                <p className="text-[11px] text-slate-400">Scanned and verified directly in restaurant merchant account</p>
              </div>

              <div className="rounded-xl bg-slate-950 border border-cyan-500/30 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-cyan-400 flex items-center gap-1.5">
                    <Smartphone className="h-4 w-4" />
                    <span>USSD Push Money</span>
                  </span>
                  <span className="text-xs font-black text-cyan-300">
                    {report.totalSales > 0 ? ((report.ussdTotal / report.totalSales) * 100).toFixed(0) : 0}%
                  </span>
                </div>
                <div className="text-2xl font-black text-white">
                  {report.ussdTotal.toLocaleString()} <span className="text-sm text-cyan-400">ETB</span>
                </div>
                <p className="text-[11px] text-slate-400">Triggered directly to customer phone number via USSD</p>
              </div>
            </div>
          </div>

          {/* Waiter Performance Leaderboard (Expand All Mode) */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-400" />
                  <span>Waiter Performance Leaderboard (Who Sold the Most Today)</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Ranked by total sales revenue generated today, order count, and payment method breakdown
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full">
                {report.waiterStats.length} Waiters Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {report.waiterStats.map((w, index) => {
                const isWinner = index === 0 && w.sales > 0;
                return (
                  <div
                    key={w.id}
                    className={`rounded-2xl p-4 border transition flex flex-col justify-between ${
                      isWinner
                        ? "bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/60 ring-2 ring-amber-500/30"
                        : "bg-slate-950/80 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span
                          className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-black ${
                            isWinner
                              ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-900"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          #{index + 1}
                        </span>
                        {isWinner && (
                          <span className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                            🏆 Leader
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2.5 mt-3">
                        <span className="text-3xl">{w.avatar}</span>
                        <div>
                          <h4 className="text-sm font-bold text-white leading-tight">{w.name}</h4>
                          <p className="text-[11px] text-slate-400">{w.ordersCount} orders served</p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800 space-y-1.5">
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs text-slate-400">Total Sales:</span>
                          <span className="text-lg font-black text-white">
                            {w.sales.toLocaleString()} <span className="text-xs text-emerald-400">ETB</span>
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Avg Ticket:</span>
                          <span className="font-semibold text-slate-200">{w.avgTicket} ETB</span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Net Profit Generated:</span>
                          <span className="font-semibold text-emerald-400">+{w.profit.toLocaleString()} ETB</span>
                        </div>

                        {/* Mini Payment Breakdown Bar */}
                        <div className="pt-2">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                            <span>Cash: {w.cash}</span>
                            <span>QR: {w.qr}</span>
                            <span>USSD: {w.ussd}</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                            {w.sales > 0 && (
                              <>
                                <div
                                  style={{ width: `${(w.cash / w.sales) * 100}%` }}
                                  className="bg-amber-500"
                                  title={`Cash: ${w.cash} ETB`}
                                />
                                <div
                                  style={{ width: `${(w.qr / w.sales) * 100}%` }}
                                  className="bg-emerald-500"
                                  title={`QR: ${w.qr} ETB`}
                                />
                                <div
                                  style={{ width: `${(w.ussd / w.sales) * 100}%` }}
                                  className="bg-cyan-500"
                                  title={`USSD: ${w.ussd} ETB`}
                                />
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 text-right">
                      <span className="text-[10px] font-bold text-slate-500">
                        {w.percentageOfTotal}% of total restaurant sales
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Row 2 Collapsed: ONLY Highest Money Breakdown & Top 1 Waiter in 2 Clean Columns */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Highest Money Breakdown Recorded */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              setExpandedSection("money");
            }}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-850 p-5 border border-slate-800 hover:border-cyan-500/50 shadow-xl transition-all duration-300 cursor-pointer hover:shadow-2xl hover:shadow-cyan-950/20 hover:-translate-y-0.5 flex flex-col justify-between"
            title="Click to view full payment breakdown (Cash, QR, USSD)"
          >
            <div>
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                    <Banknote className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Payment Breakdown
                    </span>
                    <h4 className="text-xs font-black text-white">Highest Recorded Channel</h4>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-800/80 text-cyan-400 border border-slate-700/80 group-hover:bg-cyan-500 group-hover:text-slate-950 group-hover:border-cyan-400 transition-all shadow-sm">
                  <Maximize2 className="h-3 w-3" />
                  <span>Details</span>
                  <ChevronDown className="h-3 w-3" />
                </span>
              </div>

              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 shrink-0 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shadow-inner">
                  <highestPaymentChannel.icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white truncate">
                      {highestPaymentChannel.name}
                    </span>
                    <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-black text-cyan-300 border border-cyan-500/30">
                      {highestPaymentChannel.percentage}% of Money
                    </span>
                  </div>
                  <div className="text-2xl font-black text-white tracking-tight mt-0.5">
                    {highestPaymentChannel.amount.toLocaleString()} <span className="text-sm text-cyan-400 font-bold">ETB</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                    {highestPaymentChannel.desc}
                  </p>
                </div>
              </div>
            </div>

            {/* Mini multi-channel ratio bar */}
            <div className="mt-4 pt-3 border-t border-slate-800/60">
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                <span className="text-amber-400 font-medium">Cash: {report.cashTotal.toLocaleString()}</span>
                <span className="text-emerald-400 font-medium">QR: {report.qrTotal.toLocaleString()}</span>
                <span className="text-cyan-400 font-medium">USSD: {report.ussdTotal.toLocaleString()}</span>
              </div>
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                {report.totalSales > 0 ? (
                  <>
                    <div
                      style={{ width: `${(report.cashTotal / report.totalSales) * 100}%` }}
                      className="bg-amber-400 transition-all duration-500"
                      title={`Cash: ${report.cashTotal} ETB`}
                    />
                    <div
                      style={{ width: `${(report.qrTotal / report.totalSales) * 100}%` }}
                      className="bg-emerald-400 transition-all duration-500"
                      title={`QR: ${report.qrTotal} ETB`}
                    />
                    <div
                      style={{ width: `${(report.ussdTotal / report.totalSales) * 100}%` }}
                      className="bg-cyan-400 transition-all duration-500"
                      title={`USSD: ${report.ussdTotal} ETB`}
                    />
                  </>
                ) : (
                  <div className="w-full bg-slate-800" />
                )}
              </div>
            </div>
          </div>

          {/* Card 2: #1 Top Waiter Today */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              setExpandedSection("waiters");
            }}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-850 p-5 border border-slate-800 hover:border-amber-500/50 shadow-xl transition-all duration-300 cursor-pointer hover:shadow-2xl hover:shadow-amber-950/20 hover:-translate-y-0.5 flex flex-col justify-between"
            title="Click to view full waiter performance leaderboard"
          >
            <div>
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                    <Trophy className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Staff Leaderboard
                    </span>
                    <h4 className="text-xs font-black text-white">#1 Top Waiter Today</h4>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-800/80 text-amber-400 border border-slate-700/80 group-hover:bg-amber-500 group-hover:text-slate-950 group-hover:border-amber-400 transition-all shadow-sm">
                  <Maximize2 className="h-3 w-3" />
                  <span>Leaderboard</span>
                  <ChevronDown className="h-3 w-3" />
                </span>
              </div>

              {topWaiter ? (
                <div className="flex items-center gap-3.5">
                  <div className="h-12 w-12 shrink-0 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-2xl shadow-inner">
                    {topWaiter.avatar || "🏆"}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-white truncate">
                        {topWaiter.name}
                      </span>
                      <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-black text-amber-400 border border-amber-500/30 uppercase">
                        Leader
                      </span>
                    </div>
                    <div className="text-2xl font-black text-white tracking-tight mt-0.5">
                      {topWaiter.sales.toLocaleString()} <span className="text-sm text-amber-400 font-bold">ETB</span>
                    </div>
                    <p className="text-[11px] text-amber-300 font-bold mt-0.5">
                      {topWaiter.percentageOfTotal}% of total sales • {topWaiter.ordersCount} orders served
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-xs text-slate-400">No waiter sales recorded yet</div>
              )}
            </div>

            {/* Active staff indicator */}
            <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400">Total Active Staff:</span>
              <span className="font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[11px]">
                {report.waiterStats.length} Waiters Active
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 5. ITEM CONSUMPTION TRACKER: WHAT PEOPLE USED & PAID FOR TODAY */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5 text-emerald-400" />
              <span>What People Used and Paid For Today (Item Consumption & Profit)</span>
            </h2>
            <p className="text-xs text-slate-400">
              Complete breakdown of every dish and drink consumed, units sold, money collected, and net profit
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSyncToMongoDB}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "Saving to Database..." : "Save to MongoDB"}</span>
            </button>
            <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
              {report.itemConsumption.length} Unique Menu Items Sold
            </span>
          </div>
        </div>

        {syncFeedback && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-4 py-2 text-xs font-semibold text-emerald-300 flex items-center justify-between animate-fadeIn">
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-400" />
              <span>{syncFeedback}</span>
            </span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Item Name</th>
                <th className="py-3 px-3 text-center">Qty Consumed</th>
                <th className="py-3 px-3 text-right">Gross Sales (ETB)</th>
                <th className="py-3 px-3 text-right">Net Profit (ETB)</th>
                <th className="py-3 px-4 text-center">Profit Margin</th>
                <th className="py-3 px-4 text-right text-rose-300">Cost Incurred (ETB)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {report.itemConsumption.map((item) => {
                const margin = item.revenue > 0 ? ((item.profit / item.revenue) * 100).toFixed(0) : "0";
                return (
                  <tr key={item.name} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 text-white font-bold flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span>{item.name}</span>
                    </td>
                    <td className="py-3 px-3 text-center font-black text-amber-300">
                      <span className="bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                        {item.quantity} units
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-white">
                      {item.revenue.toLocaleString()} ETB
                    </td>
                    <td className="py-3 px-3 text-right font-black text-emerald-400">
                      +{item.profit.toLocaleString()} ETB
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold text-[10px]">
                        {margin}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-rose-300 font-bold font-mono">
                      {item.cost.toLocaleString()} ETB
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. DEDICATED COST INCURRED & EXPENSES TABLE AT THE END */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-rose-400" />
              <h2 className="text-base font-bold text-white">
                Cost Incurred & Kitchen Expenses Breakdown
              </h2>
              <span className="rounded-md bg-rose-500/10 px-2 py-0.5 text-[11px] font-bold text-rose-400 border border-rose-500/20">
                Expense Ledger
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Itemized preparation cost for every dish and drink consumed today — deducted from revenue to calculate net profit
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Total Incurred:</span>
            <span className="font-black text-rose-400 text-sm px-2.5 py-1 bg-rose-500/10 rounded-lg border border-rose-500/20">
              {report.totalCost.toLocaleString()} ETB
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Item / Recipe Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-center">Units Consumed</th>
                <th className="py-3 px-3 text-right">Unit Prep Cost</th>
                <th className="py-3 px-3 text-right text-rose-300">Total Cost Incurred</th>
                <th className="py-3 px-4 text-right">% of Total Kitchen Expenses</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {report.itemConsumption.map((item) => (
                <tr key={item.name} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 text-white font-bold flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    <span>{item.name}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-400">
                    <span className="bg-slate-800/80 px-2 py-0.5 rounded text-[10px]">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-slate-200">
                    {item.quantity} units
                  </td>
                  <td className="py-3 px-3 text-right text-slate-300 font-mono">
                    {item.unitCost} ETB / unit
                  </td>
                  <td className="py-3 px-3 text-right font-black text-rose-400 font-mono">
                    {item.cost.toLocaleString()} ETB
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                        <div
                          className="h-full bg-rose-500 rounded-full"
                          style={{ width: `${Math.min(100, parseFloat(item.percentageOfTotalExpenses))}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-300">
                        {item.percentageOfTotalExpenses}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-slate-700 bg-slate-950/60 font-bold text-xs">
              <tr>
                <td colSpan={2} className="py-3 px-4 text-white uppercase text-[11px]">
                  Total Daily Kitchen Expenses Incurred
                </td>
                <td className="py-3 px-3 text-center text-amber-300">
                  {report.itemConsumption.reduce((s, i) => s + i.quantity, 0)} total units
                </td>
                <td className="py-3 px-3 text-right text-slate-400">
                  Avg: {report.itemConsumption.length > 0 ? Math.round(report.totalCost / (report.itemConsumption.reduce((s, i) => s + i.quantity, 0) || 1)) : 0} ETB
                </td>
                <td className="py-3 px-3 text-right text-rose-400 font-black text-sm">
                  {report.totalCost.toLocaleString()} ETB
                </td>
                <td className="py-3 px-4 text-right text-emerald-400 font-bold">
                  100% of Expenses
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 7. RESET DEMO DATA HELPER & MONGO FOOTER */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-850">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>BGS Restaurant Profit OS • MongoDB Atlas Live Connected</span>
        </div>
        <button
          onClick={resetDemoData}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset Sample Demo Data</span>
        </button>
      </div>

    </div>
  );
}
