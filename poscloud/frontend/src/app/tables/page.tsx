"use client";

import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import {
  usePOSStore,
  Table,
  TableStatus,
  Order,
  requestTableBill,
} from "@/lib/store";
import PaymentModal from "@/components/PaymentModal";
import ReceiptModal from "@/components/ReceiptModal";

export default function TablesPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { tables, orders } = usePOSStore();

  const [selectedSection, setSelectedSection] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");

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
      return matchSec && matchStat;
    });
  }, [tables, selectedSection, statusFilter]);

  // Open POS or Waiter with table
  const handleStartOrder = (tableNumber: number) => {
    router.push(`/pos?table=${tableNumber}`);
  };

  // Open Payment modal directly for table
  const handleOpenPayment = (table: Table) => {
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
    <div className="flex-1 bg-slate-950 p-4 sm:p-6 lg:p-8 text-slate-100 min-h-screen">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Floor Plan & Table Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Real-time table occupancies, active waiter assignments, and bill settlements
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/waiter")}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:from-amber-500 hover:to-orange-500 transition"
            >
              <Smartphone className="h-4 w-4" />
              <span>Waiter Mobile View</span>
            </button>
          </div>
        </div>

        {/* Section Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {["All", "Main Dining", "Terrace", "VIP Lounge"].map((sec) => (
            <button
              key={sec}
              onClick={() => setSelectedSection(sec)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                selectedSection === sec
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800"
              }`}
            >
              {sec}
            </button>
          ))}
        </div>

        {/* Status Filter Cards */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
          <button
            onClick={() => setStatusFilter("All")}
            className={`rounded-2xl border p-3.5 text-left transition ${
              statusFilter === "All"
                ? "border-emerald-500 bg-slate-900 ring-2 ring-emerald-500/30"
                : "border-slate-800 bg-slate-900/60 hover:bg-slate-900"
            }`}
          >
            <p className="text-[11px] font-semibold text-slate-400">Total Tables</p>
            <p className="text-2xl font-black text-white">{counts.all}</p>
          </button>

          <button
            onClick={() => setStatusFilter("available")}
            className={`rounded-2xl border p-3.5 text-left transition ${
              statusFilter === "available"
                ? "border-emerald-500 bg-emerald-950/40 ring-2 ring-emerald-500/30 text-emerald-400"
                : "border-slate-800 bg-slate-900/60 hover:bg-slate-900"
            }`}
          >
            <p className="text-[11px] font-semibold text-emerald-400">Available</p>
            <p className="text-2xl font-black text-emerald-400">{counts.available}</p>
          </button>

          <button
            onClick={() => setStatusFilter("occupied")}
            className={`rounded-2xl border p-3.5 text-left transition ${
              statusFilter === "occupied"
                ? "border-amber-500 bg-amber-950/40 ring-2 ring-amber-500/30 text-amber-400"
                : "border-slate-800 bg-slate-900/60 hover:bg-slate-900"
            }`}
          >
            <p className="text-[11px] font-semibold text-amber-400">Occupied</p>
            <p className="text-2xl font-black text-amber-400">{counts.occupied}</p>
          </button>

          <button
            onClick={() => setStatusFilter("bill_requested")}
            className={`rounded-2xl border p-3.5 text-left transition ${
              statusFilter === "bill_requested"
                ? "border-purple-500 bg-purple-950/40 ring-2 ring-purple-500/30 text-purple-400"
                : "border-slate-800 bg-slate-900/60 hover:bg-slate-900"
            }`}
          >
            <p className="text-[11px] font-semibold text-purple-400">Bill Requested</p>
            <p className="text-2xl font-black text-purple-400">{counts.bill_requested}</p>
          </button>

          <button
            onClick={() => setStatusFilter("reserved")}
            className={`col-span-2 sm:col-span-1 rounded-2xl border p-3.5 text-left transition ${
              statusFilter === "reserved"
                ? "border-sky-500 bg-sky-950/40 ring-2 ring-sky-500/30 text-sky-400"
                : "border-slate-800 bg-slate-900/60 hover:bg-slate-900"
            }`}
          >
            <p className="text-[11px] font-semibold text-sky-400">Reserved</p>
            <p className="text-2xl font-black text-sky-400">{counts.reserved}</p>
          </button>
        </div>

        {/* Floor Plan Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTables.map((table) => {
            const activeOrder = orders.find((o) => o.id === table.orderId && o.paymentStatus !== "PAID");
            const isOccupied = table.status === "occupied" || table.status === "bill_requested";

            return (
              <div
                key={table.id}
                className={`relative flex flex-col justify-between rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md ${
                  table.status === "available"
                    ? "border-slate-800 bg-slate-900/90"
                    : table.status === "bill_requested"
                    ? "border-purple-500/60 bg-purple-950/20 ring-2 ring-purple-500/30"
                    : table.status === "occupied"
                    ? "border-amber-500/50 bg-amber-950/20"
                    : "border-sky-800 bg-slate-900"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 text-lg font-black text-white shadow">
                      T{table.number}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider ${
                        table.status === "available"
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : table.status === "bill_requested"
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 animate-pulse"
                          : table.status === "occupied"
                          ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                          : "bg-sky-500/15 text-sky-400 border border-sky-500/30"
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

                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {table.seats} Seats
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">• {table.section}</span>
                  </div>

                  {/* Active Order Preview if occupied */}
                  {isOccupied && activeOrder && (
                    <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/80 p-3 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock className="h-3 w-3" />
                          {table.seatedAt || "Active"}
                        </span>
                        <span className="font-bold text-slate-300">
                          {activeOrder.items.length} items
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-amber-400 font-bold">
                        <span>Waiter:</span>
                        <span>👨🏾‍🍳 {table.waiterName || activeOrder.waiterName || "Staff"}</span>
                      </div>

                      <div className="flex items-baseline justify-between border-t border-slate-850 pt-1.5">
                        <span className="text-[11px] font-semibold text-slate-400">
                          Current Bill:
                        </span>
                        <span className="text-base font-black text-emerald-400">
                          {activeOrder.totalAmount.toLocaleString()} ETB
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Table Actions */}
                <div className="mt-5 space-y-2">
                  {table.status === "available" ? (
                    <button
                      onClick={() => handleStartOrder(table.number)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition active:scale-95"
                    >
                      <PlusCircle className="h-4 w-4" />
                      <span>Take Order</span>
                    </button>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleStartOrder(table.number)}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition"
                      >
                        <UtensilsCrossed className="h-3.5 w-3.5" />
                        <span>Add Items</span>
                      </button>

                      <button
                        onClick={() => handleOpenPayment(table)}
                        className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold text-white shadow transition ${
                          table.status === "bill_requested"
                            ? "bg-purple-600 hover:bg-purple-500"
                            : "bg-emerald-600 hover:bg-emerald-500"
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
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg py-1 text-[11px] font-semibold text-purple-400 hover:bg-purple-950/40"
                    >
                      <Receipt className="h-3 w-3" />
                      <span>Mark Bill Requested</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

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
