"use client";

import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
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
} from "lucide-react";
import { usePOSStore, Order } from "@/lib/store";
import ReceiptModal from "@/components/ReceiptModal";

export default function ReceiptsPage() {
  const { t } = useTranslation();
  const { orders } = usePOSStore();

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
    return filteredOrders.reduce((sum, o) => sum + (o.netProfit || o.totalAmount - (o.totalCost || 0)), 0);
  }, [filteredOrders]);

  return (
    <div className="flex-1 bg-slate-950 p-4 sm:p-6 lg:p-8 text-slate-100 min-h-screen">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
              <ReceiptText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">
                Sales Ledger & Transactions
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Audit historical sales, waiter settlements, and net profit per ticket
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Settled Revenue</p>
              <p className="text-base font-black text-white">
                {totalSettledRevenue.toLocaleString()} ETB
              </p>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Total Profit</p>
              <p className="text-base font-black text-emerald-400">
                +{totalSettledProfit.toLocaleString()} ETB
              </p>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order #, Waiter, Table, or Txn Ref..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-10 pr-4 py-2 text-xs sm:text-sm font-medium text-white focus:border-emerald-500 focus:outline-none placeholder-slate-500"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {["ALL", "CASH", "ETHQR", "USSD_PUSH"].map((ch) => (
              <button
                key={ch}
                onClick={() => setFilterChannel(ch)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition whitespace-nowrap ${
                  filterChannel === ch
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800"
                }`}
              >
                {ch === "ALL" ? "All Channels" : ch === "ETHQR" ? "ETHQR (Telebirr/CBE)" : ch}
              </button>
            ))}
          </div>
        </div>

        {/* Receipts Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Order #</th>
                  <th className="px-5 py-3.5">Waiter</th>
                  <th className="px-5 py-3.5">Table / Type</th>
                  <th className="px-5 py-3.5">Time</th>
                  <th className="px-5 py-3.5">Payment Method</th>
                  <th className="px-5 py-3.5">Txn Reference</th>
                  <th className="px-5 py-3.5">Total (ETB)</th>
                  <th className="px-5 py-3.5">Profit (ETB)</th>
                  <th className="px-5 py-3.5 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      No settled orders found matching query.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const profit = order.netProfit || order.totalAmount - (order.totalCost || 0);
                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-slate-800/40 transition"
                      >
                        <td className="px-5 py-4 font-black text-white">
                          #{order.orderNumber}
                        </td>
                        <td className="px-5 py-4 font-bold text-slate-200">
                          👨🏾‍🍳 {order.waiterName || "Staff"}
                        </td>
                        <td className="px-5 py-4 text-slate-300">
                          {order.tableNumber ? `Table ${order.tableNumber}` : "Takeout / Counter"}
                        </td>
                        <td className="px-5 py-4 text-slate-400">
                          {new Date(order.paidAt || order.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold border bg-slate-800 border-slate-700 text-slate-200">
                            {order.paymentChannel === "CASH" && <Banknote className="h-3 w-3 text-amber-400" />}
                            {order.paymentChannel === "ETHQR" && <QrCode className="h-3 w-3 text-emerald-400" />}
                            {order.paymentChannel === "USSD_PUSH" && <Smartphone className="h-3 w-3 text-cyan-400" />}
                            <span>{order.paymentChannel || "CASH"}</span>
                          </span>
                        </td>
                        <td className="px-5 py-4 font-mono text-[11px] text-slate-400">
                          {order.transactionRef || "N/A"}
                        </td>
                        <td className="px-5 py-4 font-black text-white text-sm">
                          {order.totalAmount.toLocaleString()} ETB
                        </td>
                        <td className="px-5 py-4 font-black text-emerald-400 text-sm">
                          +{profit.toLocaleString()} ETB
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => setSelectedReceiptOrder(order)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 shadow-sm"
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
      </div>

      {/* Reprint Modal */}
      <ReceiptModal
        order={selectedReceiptOrder}
        isOpen={Boolean(selectedReceiptOrder)}
        onClose={() => setSelectedReceiptOrder(null)}
      />
    </div>
  );
}
