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
} from "lucide-react";
import {
  usePOSStore,
  BRANCHES,
  getTodayProfitReport,
  resetDemoData,
  syncAllDataToMongoDB,
} from "@/lib/store";

export default function OwnerDashboard() {
  const { orders, tables, waiters } = usePOSStore();

  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dbInfo, setDbInfo] = useState<{ connected: boolean; message: string }>({
    connected: false,
    message: "Connecting...",
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

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

  // Auto-sync current orders and consumption to MongoDB on load
  useEffect(() => {
    const timer = setTimeout(() => {
      syncAllDataToMongoDB()
        .then((res) => {
          if (res.success) {
            console.log("Auto-synced to MongoDB Atlas successfully");
          }
        })
        .catch(() => {});
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleSyncToMongoDB = async () => {
    setIsSyncing(true);
    setSyncFeedback("Syncing orders, staff, and item consumption to MongoDB Atlas...");
    try {
      const res = await syncAllDataToMongoDB();
      if (res.success) {
        setSyncFeedback(
          `✓ Saved to MongoDB Atlas (${res.ordersSaved} orders, ${res.waitersSaved} staff, daily consumption saved)`
        );
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

  // Listen to branch switch from header
  useEffect(() => {
    const handleBranchSwitched = (e: any) => {
      if (e.detail) setSelectedBranch(e.detail);
    };
    window.addEventListener("branch_switched", handleBranchSwitched);
    return () => window.removeEventListener("branch_switched", handleBranchSwitched);
  }, []);

  // Compute Today's Financial & Waiter metrics
  const report = useMemo(() => {
    return getTodayProfitReport(selectedBranch);
  }, [orders, waiters, selectedBranch]);

  const topWaiter = report.topWaiter;

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
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold ${
              dbInfo.connected
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

          <Link
            href="/waiter"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-950 hover:from-emerald-500 hover:to-teal-500 transition active:scale-95"
          >
            <Smartphone className="h-4 w-4" />
            <span>Open Waiter App</span>
          </Link>
        </div>
      </div>

      {/* 2. CORE FINANCIAL KPI CARDS (SALES, COST, NET PROFIT, TICKET) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Total Sales */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800/80 p-5 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Today's Gross Sales
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
              <span>{report.paidCount} paid transactions today</span>
            </p>
          </div>
        </div>

        {/* Card 2: Cost of Goods / What Was Used */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800/80 p-5 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Cost of What Was Used
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

        {/* Card 3: Today's Net Profit Output */}
        <div className="rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-teal-950/30 p-5 border border-emerald-500/40 shadow-xl relative overflow-hidden ring-1 ring-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
              Today's Net Profit
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
              #1 Top Waiter Today
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

      {/* 3. MONEY LEDGER: CASH VS QR VS USSD */}
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

      {/* 4. WAITER LEADERBOARD: WHO DID THE MOST TODAY? */}
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
