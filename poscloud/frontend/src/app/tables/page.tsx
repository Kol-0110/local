"use client";

import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Users,
  Clock,
  PlusCircle,
  Receipt,
  CreditCard,
  UtensilsCrossed,
  Filter,
  CheckCircle2,
  X,
  Smartphone,
  Eye,
  Search,
  Sun,
  Moon,
  Bell,
  Menu as MenuIcon,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import {
  usePOSStore,
  Table,
  TableStatus,
  Order,
  requestTableBill,
} from "@/lib/store";
import { useAuth } from "@/lib/authContext";
import PaymentModal from "@/components/PaymentModal";
import ReceiptModal from "@/components/ReceiptModal";
import Sidebar from "@/components/Sidebar";

export default function TablesPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { tables, orders } = usePOSStore();
  const { isSuperAdmin } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Selected order for payment / details
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [paidReceiptOrder, setPaidReceiptOrder] = useState<Order | null>(null);

  // Status counters
  const counts = useMemo(() => {
    return {
      all: tables.length,
      available: tables.filter((t) => t.status === "available").length,
      occupied: tables.filter((t) => t.status === "occupied").length,
      bill_requested: tables.filter((t) => t.status === "bill_requested").length,
      reserved: tables.filter((t) => t.status === "reserved").length,
    };
  }, [tables]);

  // Filtered tables
  const filteredTables = useMemo(() => {
    return tables.filter((tbl) => {
      const matchSec = selectedSection === "All" || tbl.section === selectedSection;
      const matchStat = statusFilter === "All" || tbl.status === statusFilter;
      const matchSearch =
        searchQuery === "" ||
        String(tbl.number).includes(searchQuery) ||
        (tbl.waiterName && tbl.waiterName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        tbl.section.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSec && matchStat && matchSearch;
    });
  }, [tables, selectedSection, statusFilter, searchQuery]);

  // Open POS or Waiter with table
  const handleStartOrder = (tableNumber: number) => {
    if (isSuperAdmin) return;
    router.push(`/pos?table=${tableNumber}`);
  };

  // Open Payment modal directly for table
  const handleOpenPayment = (table: Table) => {
    if (isSuperAdmin) return;
    const order = orders.find((o) => o.id === table.orderId && o.paymentStatus !== "PAID");
    if (order) {
      setSelectedOrder(order);
      setIsPaymentOpen(true);
    }
  };

  const handlePaymentSuccess = (paid: Order) => {
    setIsPaymentOpen(false);
    setPaidReceiptOrder(paid);
    setIsReceiptOpen(true);
  };

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
              Floor Plan &amp; Tables
            </h1>
            <p className="text-xs text-[#5f6670] dark:text-[#8b8f94] mt-0.5">
              Live floor occupancy, active table bills, and assigned server dispatch
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Search Input */}
            <div className="relative flex items-center bg-white dark:bg-[#141516] border border-[#e3e6ea] dark:border-[#232527] rounded-lg px-3 py-1.5 w-full sm:w-60 shadow-sm focus-within:border-cyan-600 transition duration-200">
              <Search className="h-4 w-4 text-[#9aa1a9] dark:text-[#5d6166] mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search table #, waiter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-[#111418] dark:text-[#f2f3f4] placeholder-[#9aa1a9] focus:outline-none"
              />
            </div>

            {/* View Mode Badge or Mobile Switch */}
            {isSuperAdmin ? (
              <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <Eye className="h-4 w-4 text-emerald-500" />
                <span>Super Admin (View-Only)</span>
              </div>
            ) : (
              <button
                onClick={() => router.push("/waiter")}
                className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:from-amber-500 hover:to-orange-500 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
              >
                <Smartphone className="h-4 w-4" />
                <span>Waiter Mobile View</span>
              </button>
            )}

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

        {/* Status KPI Filter Cards with Hover Lift */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { id: "All", label: "All Tables", count: counts.all, color: "text-[#111418] dark:text-[#f2f3f4]", dot: "bg-cyan-500" },
            { id: "available", label: "Available", count: counts.available, color: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
            { id: "occupied", label: "Occupied", count: counts.occupied, color: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
            { id: "bill_requested", label: "Bill Due", count: counts.bill_requested, color: "text-purple-600 dark:text-purple-400", dot: "bg-purple-500" },
            { id: "reserved", label: "Reserved", count: counts.reserved, color: "text-blue-600 dark:text-blue-400", dot: "bg-blue-500" },
          ].map((item) => {
            const isSelected = statusFilter === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setStatusFilter(item.id)}
                className={`flex flex-col justify-between p-4 rounded-xl border text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                  isSelected
                    ? "bg-white dark:bg-[#18191b] border-cyan-500 shadow-md ring-2 ring-cyan-500/20"
                    : "bg-white dark:bg-[#141516] border-[#e3e6ea] dark:border-[#232527] hover:border-slate-300 dark:hover:border-[#383a3e] shadow-sm"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-medium text-[#5f6670] dark:text-[#8b8f94]">
                    {item.label}
                  </span>
                  <span className={`h-2 w-2 rounded-full ${item.dot}`} />
                </div>
                <div className={`text-2xl font-black tracking-tight ${item.color}`}>
                  {item.count}
                </div>
              </button>
            );
          })}
        </div>

        {/* Section Filter Pills */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex flex-wrap gap-1.5">
            {["All", "Main Dining", "Terrace", "VIP Lounge"].map((sec) => (
              <button
                key={sec}
                onClick={() => setSelectedSection(sec)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  selectedSection === sec
                    ? "bg-cyan-600 text-white shadow-sm font-bold"
                    : "bg-white dark:bg-[#141516] text-[#5f6670] dark:text-[#8b8f94] hover:text-[#111418] dark:hover:text-white border border-[#e3e6ea] dark:border-[#232527] hover:bg-[#f8f9fa] dark:hover:bg-[#18191b]"
                }`}
              >
                {sec}
              </button>
            ))}
          </div>

          <div className="text-xs text-[#5f6670] dark:text-[#8b8f94] font-medium">
            Showing <span className="font-bold text-[#111418] dark:text-white">{filteredTables.length}</span> tables
          </div>
        </div>

        {/* Floor Plan Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTables.map((table) => {
            const activeOrder = orders.find((o) => o.id === table.orderId && o.paymentStatus !== "PAID");
            const isOccupied = table.status === "occupied" || table.status === "bill_requested";

            return (
              <div
                key={table.id}
                className="relative flex flex-col justify-between rounded-2xl border border-[#e3e6ea] dark:border-[#232527] bg-white dark:bg-[#141516] p-5 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 group"
              >
                {/* Top Table Info */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f1f3f5] dark:bg-[#1f2022] text-lg font-black text-[#111418] dark:text-[#f2f3f4] border border-[#e3e6ea] dark:border-[#2b2d30] shadow-sm group-hover:scale-105 group-hover:border-cyan-500/40 transition-transform">
                      T{table.number}
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${
                        table.status === "available"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30"
                          : table.status === "bill_requested"
                          ? "bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300 border border-purple-200 dark:border-purple-500/40 animate-pulse"
                          : table.status === "occupied"
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30"
                          : "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30"
                      }`}
                    >
                      {table.status === "bill_requested"
                        ? "Bill Due"
                        : table.status === "occupied"
                        ? "Occupied"
                        : table.status === "available"
                        ? "Available"
                        : "Reserved"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#5f6670] dark:text-[#8b8f94]">
                    <span className="flex items-center gap-1 font-medium">
                      <Users className="h-3.5 w-3.5" />
                      {table.seats} Seats
                    </span>
                    <span className="text-[11px] font-semibold text-[#9aa1a9] dark:text-[#5d6166]">• {table.section}</span>
                  </div>

                  {/* Active Order Preview if occupied */}
                  {isOccupied && activeOrder && (
                    <div className="mt-4 rounded-xl border border-[#e3e6ea] dark:border-[#232527] bg-[#f8f9fa] dark:bg-[#18191b] p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 text-[#5f6670] dark:text-[#8b8f94]">
                          <Clock className="h-3 w-3" />
                          {table.seatedAt || "Active"}
                        </span>
                        <span className="font-bold text-[#111418] dark:text-[#f2f3f4]">
                          {activeOrder.items.length} items
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#5f6670] dark:text-[#8b8f94]">Assigned Waiter:</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          {table.waiterName || activeOrder.waiterName || "Staff"}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between border-t border-[#e3e6ea] dark:border-[#232527] pt-2">
                        <span className="text-[11px] font-semibold text-[#5f6670] dark:text-[#8b8f94]">
                          Current Bill:
                        </span>
                        <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                          {activeOrder.totalAmount.toLocaleString()} ETB
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Table Actions / View-Only Mode */}
                {isSuperAdmin ? (
                  <div className="mt-4 pt-3 border-t border-[#e3e6ea] dark:border-[#232527] flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                      <Eye className="h-3.5 w-3.5" />
                      <span>View-Only</span>
                    </span>
                    <span className="text-[11px] font-mono text-[#5f6670] dark:text-[#8b8f94] bg-[#f1f3f5] dark:bg-[#1b1c1e] px-2 py-0.5 rounded-md border border-[#e3e6ea] dark:border-[#232527]">
                      Cannot Edit
                    </span>
                  </div>
                ) : (
                  <div className="mt-5 space-y-2">
                    {table.status === "available" ? (
                      <button
                        onClick={() => handleStartOrder(table.number)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 text-xs font-bold text-white shadow-sm hover:from-emerald-500 hover:to-teal-500 transition-all duration-200 hover:shadow-md hover:shadow-emerald-500/20 active:scale-[0.98]"
                      >
                        <PlusCircle className="h-4 w-4" />
                        <span>Take Order</span>
                      </button>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleStartOrder(table.number)}
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-[#e3e6ea] dark:border-[#2a2c2f] bg-[#f8f9fa] dark:bg-[#1b1c1e] py-2 text-xs font-bold text-[#111418] dark:text-[#f2f3f4] hover:bg-slate-200 dark:hover:bg-[#282a2d] transition"
                        >
                          <UtensilsCrossed className="h-3.5 w-3.5" />
                          <span>Add Items</span>
                        </button>

                        <button
                          onClick={() => handleOpenPayment(table)}
                          className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold text-white shadow-sm transition active:scale-[0.98] ${
                            table.status === "bill_requested"
                              ? "bg-purple-600 hover:bg-purple-500 shadow-purple-600/20"
                              : "bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/20"
                          }`}
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                          <span>Pay Bill</span>
                        </button>
                      </div>
                    )}

                    {isOccupied && table.status !== "bill_requested" && (
                      <button
                        onClick={() => requestTableBill(table.number)}
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition"
                      >
                        <Receipt className="h-3 w-3" />
                        <span>Mark Bill Requested</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* Payment Modal */}
      <PaymentModal
        order={selectedOrder}
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        order={paidReceiptOrder}
        isOpen={isReceiptOpen}
        onClose={() => {
          setIsReceiptOpen(false);
          setPaidReceiptOrder(null);
        }}
      />
    </div>
  );
}
