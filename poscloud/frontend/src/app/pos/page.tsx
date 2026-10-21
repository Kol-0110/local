"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Utensils,
  ShoppingBag,
  CreditCard,
  ChefHat,
  RotateCcw,
  Tag,
  MessageSquare,
  Sparkles,
  Smartphone,
} from "lucide-react";
import {
  usePOSStore,
  MenuItem,
  Order,
  createOrGetTableOrder,
  createQuickTakeoutOrder,
  addItemToOrder,
  updateItemQuantity,
  removeItemFromOrder,
  applyDiscountToOrder,
  updateOrderStatus,
} from "@/lib/store";
import PaymentModal from "@/components/PaymentModal";
import ReceiptModal from "@/components/ReceiptModal";

function PosContent() {
  const { t, i18n } = useTranslation();
  const searchParams = useSearchParams();
  const tableParam = searchParams.get("table");

  const { menu, tables, orders, activeWaiter } = usePOSStore();

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [orderType, setOrderType] = useState<"dine-in" | "takeout">("dine-in");
  const [selectedTableNum, setSelectedTableNum] = useState<number>(
    tableParam ? Number(tableParam) : 1
  );
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // Modals state
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Initialize or fetch the active order
  useEffect(() => {
    if (tableParam) {
      const tableNum = Number(tableParam);
      setSelectedTableNum(tableNum);
      setOrderType("dine-in");
      const order = createOrGetTableOrder(tableNum, "bole", activeWaiter?.id);
      setActiveOrderId(order.id);
    } else {
      const order = createOrGetTableOrder(selectedTableNum, "bole", activeWaiter?.id);
      setActiveOrderId(order.id);
    }
  }, [tableParam, activeWaiter]);

  // Current order object
  const activeOrder = useMemo(() => {
    return orders.find((o) => o.id === activeOrderId) || null;
  }, [orders, activeOrderId]);

  // Handle switching table
  const handleTableChange = (num: number) => {
    setSelectedTableNum(num);
    setOrderType("dine-in");
    const order = createOrGetTableOrder(num, "bole", activeWaiter?.id);
    setActiveOrderId(order.id);
  };

  // Handle switching to takeout
  const handleSwitchToTakeout = () => {
    setOrderType("takeout");
    const order = createQuickTakeoutOrder("bole", "Takeout Guest", activeWaiter?.id);
    setActiveOrderId(order.id);
  };

  // Category filtering
  const categories = useMemo(() => {
    const list = Array.from(new Set(menu.map((m) => m.category)));
    return ["All", ...list];
  }, [menu]);

  const filteredMenu = useMemo(() => {
    return menu.filter((item) => {
      const matchesCat = selectedCategory === "All" || item.category === selectedCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.nameAm && item.nameAm.includes(searchQuery)) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCat && matchesSearch;
    });
  }, [menu, selectedCategory, searchQuery]);

  const handleAddItem = (item: MenuItem) => {
    if (!item.isAvailable || !activeOrderId) return;
    addItemToOrder(activeOrderId, item.id, 1);
  };

  const handleApplyDiscount = (percent: number) => {
    setDiscountPercent(percent);
    if (activeOrderId) {
      applyDiscountToOrder(activeOrderId, percent);
    }
  };

  const handlePaymentSuccess = (paid: Order) => {
    setIsPaymentOpen(false);
    setCompletedOrder(paid);
    setIsReceiptOpen(true);
  };

  const handleReceiptClose = () => {
    setIsReceiptOpen(false);
    setCompletedOrder(null);
    if (orderType === "dine-in") {
      const nextOrder = createOrGetTableOrder(selectedTableNum, "bole", activeWaiter?.id);
      setActiveOrderId(nextOrder.id);
    } else {
      const nextOrder = createQuickTakeoutOrder("bole", "Takeout Guest", activeWaiter?.id);
      setActiveOrderId(nextOrder.id);
    }
  };

  const isAmharic = i18n.language === "am";

  return (
    <div className="flex flex-1 flex-col lg:flex-row overflow-hidden bg-slate-100 dark:bg-zinc-950">
      
      {/* LEFT: Menu & Catalog Panel */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-4 sm:p-5 overflow-y-auto">
        
        {/* Search & Header Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("pos.searchPlaceholder")}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
              {filteredMenu.length} items
            </span>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition ${
                selectedCategory === cat
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-extrabold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              {cat === "All" ? t("pos.allCategories") : cat}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 pt-2">
          {filteredMenu.map((item) => (
            <button
              key={item.id}
              onClick={() => handleAddItem(item)}
              disabled={!item.isAvailable}
              className={`group relative flex flex-col justify-between rounded-2xl border p-4 text-left transition-all active:scale-95 ${
                item.isAvailable
                  ? "border-slate-200/90 bg-white hover:border-emerald-500 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900/90 dark:hover:border-emerald-500"
                  : "cursor-not-allowed border-dashed border-slate-200 bg-slate-50/50 opacity-50 dark:border-zinc-800 dark:bg-zinc-950"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-1">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                    {isAmharic && item.nameAm ? item.nameAm : item.name}
                  </h3>
                  {item.popular && (
                    <span className="flex items-center gap-0.5 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400">
                      ★
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="mt-1 text-[11px] text-slate-400 dark:text-zinc-500 line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-800/60">
                <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400">
                  {item.price} <span className="text-[10px] font-bold">{t("common.currency")}</span>
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition group-hover:bg-emerald-600 group-hover:text-white dark:bg-zinc-800 dark:text-zinc-300">
                  <Plus className="h-4 w-4" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT: Active Cart & Settlement Panel */}
      <div className="w-full lg:w-[420px] xl:w-[460px] flex flex-col bg-white dark:bg-zinc-950 border-t lg:border-t-0 border-slate-200 dark:border-zinc-800 p-4 sm:p-5 shadow-lg">
        
        {/* Order Header / Destination */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-slate-900 dark:text-white">
                {t("pos.ticket")}
              </span>
              {activeOrder && (
                <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  #{activeOrder.orderNumber}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              <span>{orderType === "dine-in" ? `Table ${selectedTableNum}` : "Takeout / Counter"}</span>
              <span>•</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                👨🏾‍🍳 {activeOrder?.waiterName || activeWaiter?.name || "Staff"}
              </span>
            </div>
          </div>

          {/* Dine-In vs Takeout Switcher */}
          <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-zinc-800 dark:bg-zinc-900">
            <button
              onClick={() => handleTableChange(selectedTableNum)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                orderType === "dine-in"
                  ? "bg-white text-emerald-700 shadow-sm dark:bg-zinc-800 dark:text-emerald-400"
                  : "text-slate-600 dark:text-zinc-400"
              }`}
            >
              <Utensils className="h-3 w-3" />
              <span>{t("pos.dineIn")}</span>
            </button>
            <button
              onClick={handleSwitchToTakeout}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                orderType === "takeout"
                  ? "bg-white text-emerald-700 shadow-sm dark:bg-zinc-800 dark:text-emerald-400"
                  : "text-slate-600 dark:text-zinc-400"
              }`}
            >
              <ShoppingBag className="h-3 w-3" />
              <span>{t("pos.takeout")}</span>
            </button>
          </div>
        </div>

        {/* Table Selector (if dine-in) */}
        {orderType === "dine-in" && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
              {t("pos.table")}:
            </span>
            <div className="flex flex-1 gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {tables.map((tbl) => (
                <button
                  key={tbl.id}
                  onClick={() => handleTableChange(tbl.number)}
                  className={`flex h-8 min-w-[34px] items-center justify-center rounded-lg px-2 text-xs font-extrabold transition ${
                    selectedTableNum === tbl.number
                      ? "bg-emerald-600 text-white shadow-sm"
                      : tbl.status === "occupied"
                      ? "bg-amber-500/10 text-amber-700 border border-amber-500/30 dark:text-amber-400"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-900 dark:text-zinc-300"
                  }`}
                >
                  T{tbl.number}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Cart Item List (Scrollable) */}
        <div className="my-3 flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[380px] lg:max-h-none">
          {!activeOrder || activeOrder.items.length === 0 ? (
            <div className="flex h-56 flex-col items-center justify-center text-center text-slate-400">
              <ShoppingBag className="h-10 w-10 stroke-1 text-slate-300 dark:text-zinc-700 mb-2" />
              <p className="text-xs font-semibold">{t("pos.emptyCart")}</p>
            </div>
          ) : (
            activeOrder.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-zinc-800/80 dark:bg-zinc-900/60"
              >
                <div className="flex-1 pr-2">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {item.name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    {item.unitPrice} ETB x {item.quantity} ={" "}
                    <span className="font-bold text-slate-800 dark:text-zinc-200">
                      {item.totalPrice} ETB
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 dark:border-zinc-700 dark:bg-zinc-800">
                    <button
                      onClick={() => updateItemQuantity(activeOrder.id, item.id, item.quantity - 1)}
                      className="flex h-6 w-6 items-center justify-center rounded text-slate-600 hover:bg-slate-100 dark:text-zinc-300"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-extrabold text-slate-900 dark:text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateItemQuantity(activeOrder.id, item.id, item.quantity + 1)}
                      className="flex h-6 w-6 items-center justify-center rounded text-slate-600 hover:bg-slate-100 dark:text-zinc-300"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeItemFromOrder(activeOrder.id, item.id)}
                    className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Discount Selector */}
        {activeOrder && activeOrder.items.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-200 pt-2.5 dark:border-zinc-800 text-xs">
            <span className="font-semibold text-slate-500 dark:text-zinc-400 flex items-center gap-1">
              <Tag className="h-3.5 w-3.5" /> {t("pos.discount")}:
            </span>
            <div className="flex gap-1">
              {[0, 5, 10].map((p) => (
                <button
                  key={p}
                  onClick={() => handleApplyDiscount(p)}
                  className={`rounded-md px-2 py-0.5 font-bold ${
                    discountPercent === p
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  {p === 0 ? "0%" : `${p}%`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Financial Breakdown */}
        {activeOrder && activeOrder.items.length > 0 && (
          <div className="space-y-1.5 border-t border-slate-200 py-3 dark:border-zinc-800 text-xs">
            <div className="flex justify-between text-slate-500 dark:text-zinc-400">
              <span>{t("pos.subtotal")}</span>
              <span>{activeOrder.subtotal.toLocaleString()} ETB</span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-zinc-400">
              <span>{t("pos.serviceCharge")}</span>
              <span>{activeOrder.serviceCharge.toLocaleString()} ETB</span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-zinc-400">
              <span>{t("pos.vat")}</span>
              <span>{activeOrder.vat.toLocaleString()} ETB</span>
            </div>
            {activeOrder.discountAmount > 0 && (
              <div className="flex justify-between font-semibold text-emerald-600 dark:text-emerald-400">
                <span>{t("pos.discount")} ({discountPercent}%)</span>
                <span>-{activeOrder.discountAmount.toLocaleString()} ETB</span>
              </div>
            )}
            <div className="flex items-baseline justify-between pt-1 border-t border-slate-100 dark:border-zinc-800/80">
              <span className="text-sm font-black uppercase text-slate-900 dark:text-white">
                {t("pos.total")}
              </span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {activeOrder.totalAmount.toLocaleString()} <span className="text-xs">ETB</span>
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-2 space-y-2">
          <button
            disabled={!activeOrder || activeOrder.items.length === 0}
            onClick={() => setIsPaymentOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/30 transition hover:brightness-110 disabled:opacity-40 disabled:pointer-events-none"
          >
            <CreditCard className="h-5 w-5" />
            <span>{t("pos.checkout")}</span>
            {activeOrder && activeOrder.totalAmount > 0 && (
              <span className="rounded-md bg-white/20 px-2 py-0.5 text-xs font-bold">
                {activeOrder.totalAmount.toLocaleString()} ETB
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        order={activeOrder}
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Thermal Receipt Modal */}
      <ReceiptModal
        order={completedOrder}
        isOpen={isReceiptOpen}
        onClose={handleReceiptClose}
      />
    </div>
  );
}

export default function PosPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading POS Terminal...</div>}>
      <PosContent />
    </Suspense>
  );
}
