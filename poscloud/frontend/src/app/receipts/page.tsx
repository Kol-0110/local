"use client";

import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import {
  ReceiptText,
  Printer,
  Calendar,
  CreditCard,
  Banknote,
  Smartphone,
  Search,
  QrCode,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  Filter,
  Sun,
  Moon,
  Bell,
  Menu as MenuIcon,
  X,
  ChevronDown,
  Layers,
} from "lucide-react";
import { usePOSStore, Order } from "@/lib/store";
import ReceiptModal from "@/components/ReceiptModal";
import Sidebar from "@/components/Sidebar";

export default function ReceiptsPage() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { orders } = usePOSStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [filterChannel, setFilterChannel] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);

  // Paid orders list
  const paidOrders = useMemo(() => {
    return orders.filter((o) => o.paymentStatus === "PAID");
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return paidOrders.filter((o) => {
      const matchChannel = filterChannel === "ALL" || o.paymentChannel === filterChannel;
      const matchSearch =
        o.orderNumber.includes(searchQuery) ||
        (o.waiterName && o.waiterName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (o.transactionRef && o.transactionRef.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (o.tableNumber && String(o.tableNumber).includes(searchQuery));
      return matchChannel && matchSearch;
    });
  }, [paidOrders, filterChannel, searchQuery]);

  const totalSettledRevenue = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  }, [filteredOrders]);

  const totalSettledProfit = useMemo(() => {
    return filteredOrders.reduce(
      (sum, o) => sum + (o.netProfit || o.totalAmount - (o.totalCost || 0)),
      0
    );
  }, [filteredOrders]);

  const avgTicket = useMemo(() => {
    if (filteredOrders.length === 0) return 0;
    return Math.round(totalSettledRevenue / filteredOrders.length);
  }, [filteredOrders, totalSettledRevenue]);

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
              Sales Log &amp; Ledger
            </h1>
            <p className="text-xs text-[#5f6670] dark:text-[#8b8f94] mt-0.5">
              Reconciled ticket settlements, waiter audits, and profit breakdown
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Search Input with ⌘ K */}
            <div className="relative flex items-center bg-white dark:bg-[#141516] border border-[#e3e6ea] dark:border-[#232527] rounded-lg px-3 py-1.5 w-full sm:w-64 shadow-sm focus-within:border-cyan-600 transition duration-200">
              <Search className="h-4 w-4 text-[#9aa1a9] dark:text-[#5d6166] mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search ticket #, waiter, table..."
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
              onClick={() => alert("All orders synchronized with cloud database.")}
              className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-[#e3e6ea] dark:border-[#232527] bg-white dark:bg-[#141516] text-[#5f6670] dark:text-[#8b8f94] hover:text-[#111418] dark:hover:text-[#f2f3f4] transition shadow-sm"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#141516]" />
            </button>

            {/* Theme Toggle Button Group */}
            <div className="flex items-center rounded-lg border border-[#e3e6ea] dark:border-[#232527] bg-[#f1f3f5] dark:bg-[#1b1c1e] p-0.5 shadow-sm">
              <button
                onClick={() => setTheme("dark")}
                className={`flex h-7 w-7 items-center justify-center rounded-md transition ${
                  theme === "dark"
                    ? "bg-[#141516] text-white shadow-sm"
                    : "text-[#5f6670] hover:text-[#111418]"
                }`}
                title="Dark mode"
              >
                <Moon className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setTheme("light")}
                className={`flex h-7 w-7 items-center justify-center rounded-md transition ${
                  theme === "light" || !theme
                    ? "bg-white text-[#111418] shadow-sm"
                    : "text-[#8b8f94] hover:text-white"
                }`}
                title="Light mode"
              >
                <Sun className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </header>

        {/* 3 Top Summary KPI Cards with Cool Hover Effects */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Settled Revenue */}
          <article className="group rounded-xl border border-[#e3e6ea] dark:border-[#232527] bg-white dark:bg-[#141516] p-4 shadow-sm flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-cyan-500/40 dark:hover:border-cyan-400/40 cursor-pointer">
            <div className="flex items-center justify-between text-xs text-[#5f6670] dark:text-[#8b8f94]">
              <span className="font-medium">Settled Revenue</span>
              <span className="p-1.5 rounded-lg bg-[#f1f3f5] dark:bg-[#1b1c1e] text-[#111418] dark:text-white group-hover:bg-cyan-50 dark:group-hover:bg-cyan-950/40 group-hover:text-cyan-600 transition-colors">
                <Wallet className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3 text-2xl font-bold font-mono text-[#111418] dark:text-[#f2f3f4] tracking-tight group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
              {totalSettledRevenue.toLocaleString()} ETB
            </div>
            <div className="mt-3 pt-2 border-t border-[#e3e6ea] dark:border-[#232527] flex items-center justify-between text-xs text-[#5f6670] dark:text-[#8b8f94]">
              <span>Paid volume</span>
              <span className="rounded bg-[#dcfce7] dark:bg-[#12301a] px-2 py-0.5 text-[10.5px] font-semibold text-[#15803d] dark:text-[#4ade80]">
                Live Synced ✓
              </span>
            </div>
          </article>

          {/* Card 2: Net Profit */}
          <article className="group rounded-xl border border-[#e3e6ea] dark:border-[#232527] bg-white dark:bg-[#141516] p-4 shadow-sm flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-emerald-500/40 dark:hover:border-emerald-400/40 cursor-pointer">
            <div className="flex items-center justify-between text-xs text-[#5f6670] dark:text-[#8b8f94]">
              <span className="font-medium">Total Net Profit</span>
              <span className="p-1.5 rounded-lg bg-[#f1f3f5] dark:bg-[#1b1c1e] text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/40 transition-colors">
                <TrendingUp className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3 text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
              +{totalSettledProfit.toLocaleString()} ETB
            </div>
            <div className="mt-3 pt-2 border-t border-[#e3e6ea] dark:border-[#232527] flex items-center justify-between text-xs text-[#5f6670] dark:text-[#8b8f94]">
              <span>Margin</span>
              <span className="rounded bg-[#dcfce7] dark:bg-[#12301a] px-2 py-0.5 text-[10.5px] font-semibold text-[#15803d] dark:text-[#4ade80]">
                {totalSettledRevenue > 0
                  ? ((totalSettledProfit / totalSettledRevenue) * 100).toFixed(1)
                  : "0.0"}
                %
              </span>
            </div>
          </article>

          {/* Card 3: Paid Tickets */}
          <article className="group rounded-xl border border-[#e3e6ea] dark:border-[#232527] bg-white dark:bg-[#141516] p-4 shadow-sm flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-purple-500/40 dark:hover:border-purple-400/40 cursor-pointer">
            <div className="flex items-center justify-between text-xs text-[#5f6670] dark:text-[#8b8f94]">
              <span className="font-medium">Settled Tickets</span>
              <span className="p-1.5 rounded-lg bg-[#f1f3f5] dark:bg-[#1b1c1e] text-purple-600 dark:text-purple-400 group-hover:bg-purple-50 dark:group-hover:bg-purple-950/40 transition-colors">
                <ReceiptText className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3 text-2xl font-bold font-mono text-[#111418] dark:text-[#f2f3f4] tracking-tight">
              {filteredOrders.length}
            </div>
            <div className="mt-3 pt-2 border-t border-[#e3e6ea] dark:border-[#232527] flex items-center justify-between text-xs text-[#5f6670] dark:text-[#8b8f94]">
              <span>Total orders</span>
              <span className="rounded bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 text-[10.5px] font-semibold text-purple-700 dark:text-purple-400">
                100% Paid
              </span>
            </div>
          </article>

          {/* Card 4: Avg Ticket */}
          <article className="group rounded-xl border border-[#e3e6ea] dark:border-[#232527] bg-white dark:bg-[#141516] p-4 shadow-sm flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-amber-500/40 dark:hover:border-amber-400/40 cursor-pointer">
            <div className="flex items-center justify-between text-xs text-[#5f6670] dark:text-[#8b8f94]">
              <span className="font-medium">Avg Ticket Size</span>
              <span className="p-1.5 rounded-lg bg-[#f1f3f5] dark:bg-[#1b1c1e] text-amber-600 dark:text-amber-400 group-hover:bg-amber-50 dark:group-hover:bg-amber-950/40 transition-colors">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3 text-2xl font-bold font-mono text-[#111418] dark:text-[#f2f3f4] tracking-tight">
              {avgTicket.toLocaleString()} ETB
            </div>
            <div className="mt-3 pt-2 border-t border-[#e3e6ea] dark:border-[#232527] flex items-center justify-between text-xs text-[#5f6670] dark:text-[#8b8f94]">
              <span>Guest spend</span>
              <span className="rounded bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 text-[10.5px] font-semibold text-amber-700 dark:text-amber-400">
                Healthy
              </span>
            </div>
          </article>
        </div>

        {/* Channel Filter Pills with Cool Hover Effects */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: "ALL", label: "All Channels" },
              { id: "ETHQR", label: "ETHQR (Telebirr/CBE)" },
              { id: "CASH", label: "Cash in Drawer" },
              { id: "USSD_PUSH", label: "USSD Push" },
            ].map((ch) => (
              <button
                key={ch.id}
                onClick={() => setFilterChannel(ch.id)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 active:scale-95 ${
                  filterChannel === ch.id
                    ? "bg-[#111418] text-white dark:bg-white dark:text-[#111418] shadow-sm font-bold"
                    : "bg-white dark:bg-[#141516] border border-[#e3e6ea] dark:border-[#232527] text-[#5f6670] dark:text-[#8b8f94] hover:border-[#cfd4dc] dark:hover:border-[#383a3e] hover:text-[#111418] dark:hover:text-white"
                }`}
              >
                {ch.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-[#5f6670] dark:text-[#8b8f94] font-medium">
            Showing <strong className="text-[#111418] dark:text-white">{filteredOrders.length}</strong> settled tickets
          </span>
        </div>

        {/* Receipts Ledger Table (Fintrack Style) */}
        <div className="rounded-xl border border-[#e3e6ea] dark:border-[#232527] bg-white dark:bg-[#141516] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[850px]">
              <thead>
                <tr className="bg-[#f1f3f5] dark:bg-[#1b1c1e] text-[#9aa1a9] dark:text-[#5d6166] text-[11px] uppercase tracking-wider font-semibold border-b border-[#e3e6ea] dark:border-[#232527]">
                  <th className="px-4 py-3">Order #</th>
                  <th className="px-4 py-3">Waiter</th>
                  <th className="px-4 py-3">Table / Type</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Payment Method</th>
                  <th className="px-4 py-3">Txn Reference</th>
                  <th className="px-4 py-3 font-mono">Total (ETB)</th>
                  <th className="px-4 py-3 font-mono">Profit</th>
                  <th className="px-4 py-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e6ea] dark:divide-[#232527]">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-[#5f6670] dark:text-[#8b8f94]">
                      No settled orders found matching the filter query.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const profit =
                      order.netProfit || order.totalAmount - (order.totalCost || 0);

                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-cyan-50/50 dark:hover:bg-cyan-950/20 transition-all duration-150 group"
                      >
                        <td className="px-4 py-3.5 font-bold font-mono text-[#111418] dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                          #{order.orderNumber}
                        </td>
                        <td className="px-4 py-3.5 font-medium text-[#111418] dark:text-[#f2f3f4]">
                          <span className="flex items-center gap-1.5">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 text-[10px] font-bold">
                              {order.waiterName ? order.waiterName[0].toUpperCase() : "W"}
                            </span>
                            <span>{order.waiterName || "Staff"}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-[#5f6670] dark:text-[#8b8f94]">
                          {order.tableNumber ? `Table ${order.tableNumber}` : "Takeout / Guest"}
                        </td>
                        <td className="px-4 py-3.5 text-[#5f6670] dark:text-[#8b8f94]">
                          {new Date(order.paidAt || order.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border border-[#e3e6ea] dark:border-[#2a2c2f] bg-[#f1f3f5] dark:bg-[#1b1c1e] text-[#111418] dark:text-[#f2f3f4]">
                            {order.paymentChannel === "CASH" && (
                              <Banknote className="h-3 w-3 text-amber-500" />
                            )}
                            {order.paymentChannel === "ETHQR" && (
                              <QrCode className="h-3 w-3 text-emerald-500" />
                            )}
                            {order.paymentChannel === "USSD_PUSH" && (
                              <Smartphone className="h-3 w-3 text-cyan-500" />
                            )}
                            <span>{order.paymentChannel || "CASH"}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[11px] text-[#5f6670] dark:text-[#8b8f94]">
                          {order.transactionRef || "N/A"}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-[#111418] dark:text-white font-mono text-sm">
                          {order.totalAmount.toLocaleString()} ETB
                        </td>
                        <td className="px-4 py-3.5 font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                          +{profit.toLocaleString()} ETB
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={() => setSelectedReceiptOrder(order)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#e3e6ea] dark:border-[#2a2c2f] bg-white dark:bg-[#1b1c1e] px-2.5 py-1 text-xs font-semibold text-[#111418] dark:text-[#f2f3f4] hover:border-cyan-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:scale-105 active:scale-95 shadow-sm transition-all duration-200"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            <span>View</span>
                          </button>
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

      {/* Reprint / View Receipt Modal */}
      <ReceiptModal
        order={selectedReceiptOrder}
        isOpen={Boolean(selectedReceiptOrder)}
        onClose={() => setSelectedReceiptOrder(null)}
      />
    </div>
  );
}
