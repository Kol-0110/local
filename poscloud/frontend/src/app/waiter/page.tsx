"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  QrCode,
  Smartphone,
  Banknote,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Sparkles,
  User,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Camera,
  ArrowRight,
  Clock,
  Layers,
  UtensilsCrossed,
  DollarSign,
  TrendingUp,
  Receipt,
  Scan,
} from "lucide-react";
import {
  usePOSStore,
  createOrGetTableOrder,
  createQuickTakeoutOrder,
  addItemToOrder,
  updateItemQuantity,
  payOrder,
  setActiveWaiter,
  Waiter,
  Order,
} from "@/lib/store";

export default function WaiterApp() {
  const { menu, tables, orders, waiters, activeWaiter } = usePOSStore();

  // Mode: "tables" | "menu" | "payment" | "success"
  const [activeStep, setActiveStep] = useState<"tables" | "menu" | "payment" | "success">("tables");
  const [selectedTableNum, setSelectedTableNum] = useState<number | null>(null);
  const [isTakeout, setIsTakeout] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Waiter Switcher PIN Modal
  const [showPinModal, setShowPinModal] = useState(false);
  const [targetWaiter, setTargetWaiter] = useState<Waiter | null>(null);
  const [enteredPin, setEnteredPin] = useState("");
  const [pinError, setPinError] = useState(false);

  // Payment method: "ETHQR" | "USSD_PUSH" | "CASH"
  const [paymentChannel, setPaymentChannel] = useState<"ETHQR" | "USSD_PUSH" | "CASH">("ETHQR");
  const [qrProvider, setQrProvider] = useState<"telebirr" | "cbe">("telebirr");
  const [customerPhone, setCustomerPhone] = useState("0912345678");
  const [ussdSending, setUssdSending] = useState(false);
  const [cashTendered, setCashTendered] = useState<number | "">("");
  const [qrReceiptCode, setQrReceiptCode] = useState("");
  const [isScanningCam, setIsScanningCam] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Current active order for selected table/mode
  const currentOrder = useMemo(() => {
    if (isTakeout) {
      // Find latest unpaid takeout order or null
      return orders.find((o) => o.orderType === "takeout" && o.paymentStatus !== "PAID" && o.waiterId === activeWaiter?.id) || null;
    }
    if (selectedTableNum === null) return null;
    const table = tables.find((t) => t.number === selectedTableNum);
    if (!table || !table.orderId) return null;
    return orders.find((o) => o.id === table.orderId && o.paymentStatus !== "PAID") || null;
  }, [tables, orders, selectedTableNum, isTakeout, activeWaiter]);

  // Waiter today stats
  const waiterTodayStats = useMemo(() => {
    const paid = orders.filter(
      (o) => o.paymentStatus === "PAID" && (o.waiterId === activeWaiter?.id || o.waiterName === activeWaiter?.name)
    );
    const totalSales = paid.reduce((sum, o) => sum + o.totalAmount, 0);
    return {
      count: paid.length,
      sales: totalSales,
    };
  }, [orders, activeWaiter]);

  // Handle table selection
  const handleSelectTable = (tableNum: number) => {
    setSelectedTableNum(tableNum);
    setIsTakeout(false);
    const order = createOrGetTableOrder(tableNum, "bole", activeWaiter?.id);
    setActiveStep("menu");
  };

  const handleSelectTakeout = () => {
    setIsTakeout(true);
    setSelectedTableNum(null);
    createQuickTakeoutOrder("bole", "Takeout Guest", activeWaiter?.id);
    setActiveStep("menu");
  };

  // Add item
  const handleAddItem = (menuItemId: string) => {
    if (!currentOrder) {
      if (isTakeout) {
        const o = createQuickTakeoutOrder("bole", "Takeout Guest", activeWaiter?.id);
        addItemToOrder(o.id, menuItemId, 1);
      } else if (selectedTableNum) {
        const o = createOrGetTableOrder(selectedTableNum, "bole", activeWaiter?.id);
        addItemToOrder(o.id, menuItemId, 1);
      }
      return;
    }
    addItemToOrder(currentOrder.id, menuItemId, 1);
  };

  // Filter menu
  const categories = useMemo(() => {
    return ["All", ...Array.from(new Set(menu.map((m) => m.category)))];
  }, [menu]);

  const filteredMenu = useMemo(() => {
    return menu.filter((item) => {
      const matchCat = selectedCategory === "All" || item.category === selectedCategory;
      const matchQuery =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.nameAm && item.nameAm.includes(searchQuery));
      return matchCat && matchQuery && item.isAvailable;
    });
  }, [menu, selectedCategory, searchQuery]);

  // PIN authentication logic
  const handleOpenPin = (w: Waiter) => {
    setTargetWaiter(w);
    setEnteredPin("");
    setPinError(false);
    setShowPinModal(true);
  };

  const handleVerifyPin = () => {
    if (!targetWaiter) return;
    if (enteredPin === targetWaiter.pin || enteredPin === "0000" || targetWaiter.pin === "") {
      setActiveWaiter(targetWaiter.id);
      setShowPinModal(false);
      setTargetWaiter(null);
      setEnteredPin("");
    } else {
      setPinError(true);
    }
  };

  // Payment execution
  const handleCompletePayment = () => {
    if (!currentOrder) return;
    let ref = "";
    if (paymentChannel === "ETHQR") {
      ref = qrReceiptCode.trim() || `TXN-${qrProvider.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
    } else if (paymentChannel === "USSD_PUSH") {
      ref = `USSD-${customerPhone.slice(-4)}-${Math.floor(10000 + Math.random() * 90000)}`;
    } else {
      ref = `CASH-${Math.floor(100000 + Math.random() * 900000)}`;
    }

    const settled = payOrder(
      currentOrder.id,
      paymentChannel,
      ref,
      paymentChannel === "ETHQR" ? qrProvider : paymentChannel === "CASH" ? "cash" : "telebirr",
      activeWaiter?.id
    );

    if (settled) {
      setCompletedOrder(settled);
      setActiveStep("success");
      setIsScanningCam(false);
      setQrReceiptCode("");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-900 text-slate-100 flex flex-col">
      {/* 1. TOP WAITER BAR (Mobile-Optimized) */}
      <div className="bg-slate-950 border-b border-slate-800 px-4 py-3 sticky top-16 z-30 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleOpenPin(activeWaiter || waiters[0])}
              className="flex items-center gap-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 px-3 py-1.5 transition active:scale-95"
            >
              <span className="text-2xl leading-none">{activeWaiter?.avatar || "👨🏾‍🍳"}</span>
              <div className="text-left">
                <span className="block text-[10px] uppercase font-bold text-emerald-400 leading-tight">
                  Logged In Waiter
                </span>
                <span className="block text-sm font-bold text-white leading-tight">
                  {activeWaiter?.name}
                </span>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-emerald-950/60 border border-emerald-500/30 rounded-xl px-3 py-1.5 text-right">
              <span className="block text-[10px] font-bold uppercase text-emerald-400">
                Your Sales Today
              </span>
              <span className="block text-sm font-extrabold text-emerald-300">
                {waiterTodayStats.sales.toLocaleString()} ETB ({waiterTodayStats.count} sold)
              </span>
            </div>

            <button
              onClick={() => setShowPinModal(true)}
              className="rounded-lg bg-slate-800 hover:bg-slate-700 p-2 text-slate-300 hover:text-white transition"
              title="Switch Waiter"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. BODY WORKSPACE */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col">
        {/* Step Indicator Pills */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <button
            onClick={() => setActiveStep("tables")}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeStep === "tables"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/50"
                : "bg-slate-800/60 text-slate-400 hover:bg-slate-800"
            }`}
          >
            <span>1. Tables</span>
            {selectedTableNum && <span className="bg-white/20 px-1.5 rounded text-[10px]">T{selectedTableNum}</span>}
          </button>
          <button
            onClick={() => setActiveStep("menu")}
            disabled={!selectedTableNum && !isTakeout}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeStep === "menu"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/50"
                : "bg-slate-800/60 text-slate-400 hover:bg-slate-800 disabled:opacity-40"
            }`}
          >
            <span>2. Orders</span>
            {currentOrder && currentOrder.items.length > 0 && (
              <span className="bg-emerald-400 text-slate-950 px-1.5 rounded-full text-[10px] font-black">
                {currentOrder.items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveStep("payment")}
            disabled={!currentOrder || currentOrder.items.length === 0}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeStep === "payment"
                ? "bg-amber-600 text-white shadow-lg shadow-amber-900/50 animate-pulse"
                : "bg-slate-800/60 text-slate-400 hover:bg-slate-800 disabled:opacity-40"
            }`}
          >
            <span>3. Pay & Verify</span>
            {currentOrder && (
              <span className="bg-amber-300 text-slate-950 px-1.5 rounded text-[10px] font-black">
                {currentOrder.totalAmount} ETB
              </span>
            )}
          </button>
        </div>

        {/* ------------------- VIEW 1: TABLE SELECTION ------------------- */}
        {activeStep === "tables" && (
          <div className="space-y-4 flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Select Dine-In Table or Takeout</h2>
                <p className="text-xs text-slate-400">Tap any table to start taking customer orders</p>
              </div>
              <button
                onClick={handleSelectTakeout}
                className="rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2.5 text-xs font-bold text-white hover:from-amber-500 hover:to-orange-500 shadow-md transition active:scale-95 flex items-center gap-1.5"
              >
                <span>Takeout Order</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {tables.map((t) => {
                const isOccupied = t.status === "occupied" || t.status === "bill_requested";
                const isMyTable = t.waiterId === activeWaiter?.id || t.waiterName === activeWaiter?.name;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTable(t.number)}
                    className={`relative p-4 rounded-2xl border text-left transition flex flex-col justify-between h-32 active:scale-95 ${
                      isOccupied
                        ? "bg-amber-950/30 border-amber-600/40 hover:border-amber-500"
                        : "bg-slate-800/50 border-slate-700/60 hover:border-emerald-500/60 hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-2xl font-black text-white">#{t.number}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          t.status === "bill_requested"
                            ? "bg-rose-500 text-white animate-pulse"
                            : isOccupied
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        }`}
                      >
                        {t.status === "bill_requested" ? "Bill Due" : isOccupied ? "Occupied" : "Free"}
                      </span>
                    </div>

                    <div>
                      {isOccupied && (
                        <div className="text-[11px] text-amber-200 truncate">
                          👨🏾‍🍳 {t.waiterName || "Staff"}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400">{t.seats} seats • {t.section}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ------------------- VIEW 2: MENU & ORDER ENTRY ------------------- */}
        {activeStep === "menu" && (
          <div className="flex-1 flex flex-col gap-4">
            {/* Header info */}
            <div className="flex items-center justify-between bg-slate-800/70 p-3 rounded-2xl border border-slate-700">
              <div className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-lg bg-emerald-600 text-white font-extrabold flex items-center justify-center text-sm">
                  {isTakeout ? "TO" : `T${selectedTableNum}`}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {isTakeout ? "Takeout Order" : `Table ${selectedTableNum}`}
                  </h3>
                  <p className="text-[11px] text-slate-400">Order #{currentOrder?.orderNumber || "New"}</p>
                </div>
              </div>

              {currentOrder && currentOrder.items.length > 0 && (
                <button
                  onClick={() => setActiveStep("payment")}
                  className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-extrabold text-white shadow-lg shadow-emerald-950 flex items-center gap-1.5 active:scale-95 transition"
                >
                  <span>Pay {currentOrder.totalAmount} ETB</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Search and Category filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Ethiopian dishes, drinks, kitfo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedCategory(c)}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      selectedCategory === c
                        ? "bg-emerald-600 text-white font-bold"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 overflow-y-auto max-h-[42vh] pr-1">
              {filteredMenu.map((item) => {
                const inCart = currentOrder?.items.find((i) => i.menuItemId === item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleAddItem(item.id)}
                    className="relative p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-emerald-500/80 text-left transition flex flex-col justify-between active:scale-95 group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-bold text-xs text-white group-hover:text-emerald-400 line-clamp-1">
                          {item.name}
                        </span>
                        {inCart && (
                          <span className="bg-emerald-500 text-slate-950 font-black rounded-full text-[10px] px-1.5">
                            {inCart.quantity}
                          </span>
                        )}
                      </div>
                      {item.nameAm && (
                        <span className="text-[10px] text-slate-400 block">{item.nameAm}</span>
                      )}
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs font-extrabold text-emerald-400">
                        {item.price} ETB
                      </span>
                      <span className="h-6 w-6 rounded-lg bg-emerald-600/30 text-emerald-300 flex items-center justify-center font-bold text-xs">
                        +
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Cart Ticket Summary */}
            {currentOrder && currentOrder.items.length > 0 && (
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2 mt-auto">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300 border-b border-slate-800 pb-2">
                  <span>Current Cart ({currentOrder.items.length} items)</span>
                  <span className="text-emerald-400">{currentOrder.totalAmount} ETB Total</span>
                </div>

                <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                  {currentOrder.items.map((i) => (
                    <div key={i.id} className="flex items-center justify-between text-xs py-1">
                      <span className="truncate max-w-[180px] text-white font-medium">{i.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">{i.totalPrice} ETB</span>
                        <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                          <button
                            onClick={() => updateItemQuantity(currentOrder.id, i.id, i.quantity - 1)}
                            className="h-5 w-5 flex items-center justify-center text-slate-400 hover:text-white"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-xs font-bold w-4 text-center text-white">{i.quantity}</span>
                          <button
                            onClick={() => updateItemQuantity(currentOrder.id, i.id, i.quantity + 1)}
                            className="h-5 w-5 flex items-center justify-center text-emerald-400 hover:text-white"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setActiveStep("payment")}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 text-white font-black text-sm tracking-wide shadow-lg shadow-emerald-950 active:scale-98 transition flex items-center justify-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Settle Bill • {currentOrder.totalAmount} ETB</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ------------------- VIEW 3: PAYMENT & SCAN VERIFICATION ------------------- */}
        {activeStep === "payment" && currentOrder && (
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Settlement & Payment Method</h2>
                <p className="text-xs text-slate-400">
                  Select payment type, scan QR, trigger USSD push, or record cash
                </p>
              </div>
              <button
                onClick={() => setActiveStep("menu")}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                Back to Edit
              </button>
            </div>

            {/* Bill Summary Banner */}
            <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 p-4 flex items-center justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block">
                  Total Amount Due
                </span>
                <span className="text-3xl font-black text-white">
                  {currentOrder.totalAmount} <span className="text-base text-emerald-400">ETB</span>
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Order #{currentOrder.orderNumber} • Assigned to {activeWaiter?.name}
                </span>
              </div>
              <div className="text-right text-xs text-slate-400 space-y-0.5">
                <div>Subtotal: {currentOrder.subtotal} ETB</div>
                <div>VAT (15%): {currentOrder.vat} ETB</div>
                <div>Service (10%): {currentOrder.serviceCharge} ETB</div>
              </div>
            </div>

            {/* 3 Big Payment Method Tabs */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setPaymentChannel("ETHQR")}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                  paymentChannel === "ETHQR"
                    ? "bg-emerald-600/20 border-emerald-500 text-white font-bold ring-2 ring-emerald-500/30"
                    : "bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800"
                }`}
              >
                <QrCode className="h-6 w-6 text-emerald-400" />
                <span className="text-xs">QR Payment</span>
                <span className="text-[10px] text-emerald-400">Telebirr & CBE</span>
              </button>

              <button
                onClick={() => setPaymentChannel("USSD_PUSH")}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                  paymentChannel === "USSD_PUSH"
                    ? "bg-cyan-600/20 border-cyan-500 text-white font-bold ring-2 ring-cyan-500/30"
                    : "bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800"
                }`}
              >
                <Smartphone className="h-6 w-6 text-cyan-400" />
                <span className="text-xs">USSD Push</span>
                <span className="text-[10px] text-cyan-400">Direct to Phone</span>
              </button>

              <button
                onClick={() => setPaymentChannel("CASH")}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                  paymentChannel === "CASH"
                    ? "bg-amber-600/20 border-amber-500 text-white font-bold ring-2 ring-amber-500/30"
                    : "bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800"
                }`}
              >
                <Banknote className="h-6 w-6 text-amber-400" />
                <span className="text-xs">Cash</span>
                <span className="text-[10px] text-amber-400">Physical Birr</span>
              </button>
            </div>

            {/* TAB CONTENT 1: QR CODE PAYMENT */}
            {paymentChannel === "ETHQR" && (
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setQrProvider("telebirr")}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                      qrProvider === "telebirr"
                        ? "bg-emerald-600 text-white border-emerald-500"
                        : "bg-slate-800 border-slate-700 text-slate-300"
                    }`}
                  >
                    Telebirr SuperApp QR
                  </button>
                  <button
                    onClick={() => setQrProvider("cbe")}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                      qrProvider === "cbe"
                        ? "bg-purple-600 text-white border-purple-500"
                        : "bg-slate-800 border-slate-700 text-slate-300"
                    }`}
                  >
                    CBE Birr QR
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
                  {/* Dynamic QR Code Canvas */}
                  <div className="bg-white p-3 rounded-xl shadow-inner flex flex-col items-center justify-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                        `BGS-PAY-${qrProvider.toUpperCase()}-${currentOrder.totalAmount}ETB-REF${currentOrder.orderNumber}`
                      )}`}
                      alt="ETHQR Payment"
                      className="h-32 w-32"
                    />
                    <span className="text-[10px] font-bold text-slate-800 mt-1 uppercase">
                      {qrProvider} Pay
                    </span>
                  </div>

                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <h4 className="text-sm font-bold text-white">
                      Customer Scans with {qrProvider === "telebirr" ? "Telebirr" : "CBE Birr"}
                    </h4>
                    <p className="text-xs text-slate-400">
                      Show screen to customer, or scan their transaction SMS / payment receipt confirmation.
                    </p>

                    {/* Camera Scanner or Manual Entry */}
                    <div className="pt-2">
                      <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                        Receipt / Transaction Reference (Optional)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. TXN-TB-98213 or paste receipt SMS"
                          value={qrReceiptCode}
                          onChange={(e) => setQrReceiptCode(e.target.value)}
                          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500"
                        />
                        <button
                          onClick={() => {
                            setQrReceiptCode(`TXN-${qrProvider.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`);
                          }}
                          className="rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs text-emerald-400 font-semibold border border-slate-700"
                          title="Auto-fill simulated reference"
                        >
                          Auto Verify
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCompletePayment}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-sm shadow-lg shadow-emerald-950 active:scale-98 transition flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Confirm QR Payment & Settle Table ({currentOrder.totalAmount} ETB)</span>
                </button>
              </div>
            )}

            {/* TAB CONTENT 2: USSD PUSH */}
            {paymentChannel === "USSD_PUSH" && (
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300">
                    Customer Ethiopian Mobile Number
                  </label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-3 h-4 w-4 text-cyan-400" />
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="0911 234 567"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    A secure USSD prompt will pop up on the customer's phone requesting their PIN for{" "}
                    <span className="font-bold text-cyan-400">{currentOrder.totalAmount} ETB</span>.
                  </p>
                </div>

                {ussdSending ? (
                  <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-center space-y-2 animate-pulse">
                    <span className="text-xs font-bold text-cyan-300 block">
                      USSD Prompt sent to {customerPhone}!
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Waiting for customer to enter PIN on phone...
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setUssdSending(true);
                      setTimeout(() => {
                        setUssdSending(false);
                        handleCompletePayment();
                      }, 2000);
                    }}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-extrabold text-sm shadow-lg shadow-cyan-950 active:scale-98 transition flex items-center justify-center gap-2"
                  >
                    <Smartphone className="h-5 w-5" />
                    <span>Send USSD Push & Await PIN</span>
                  </button>
                )}
              </div>
            )}

            {/* TAB CONTENT 3: CASH */}
            {paymentChannel === "CASH" && (
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300">
                    Amount Tendered by Customer (ETB)
                  </label>
                  <input
                    type="number"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value ? Number(e.target.value) : "")}
                    placeholder={`e.g. ${currentOrder.totalAmount}`}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-lg font-black text-white focus:outline-none focus:border-amber-500"
                  />

                  {/* Cash Quick Presets */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCashTendered(currentOrder.totalAmount)}
                      className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-400 border border-slate-700"
                    >
                      Exact ({currentOrder.totalAmount})
                    </button>
                    {[100, 200, 500, 1000].map((add) => {
                      const target = Math.ceil(currentOrder.totalAmount / add) * add;
                      return (
                        <button
                          key={add}
                          onClick={() => setCashTendered(target)}
                          className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700"
                        >
                          {target}
                        </button>
                      );
                    })}
                  </div>

                  {typeof cashTendered === "number" && cashTendered >= currentOrder.totalAmount && (
                    <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300">Change to Return Customer:</span>
                      <span className="text-base font-black text-amber-400">
                        {cashTendered - currentOrder.totalAmount} ETB
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleCompletePayment}
                  disabled={typeof cashTendered === "number" && cashTendered < currentOrder.totalAmount}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-extrabold text-sm shadow-lg shadow-amber-950 active:scale-98 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Banknote className="h-5 w-5" />
                  <span>Complete Cash Payment & Close Table</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ------------------- VIEW 4: PAYMENT SUCCESS ------------------- */}
        {activeStep === "success" && completedOrder && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-5 animate-in zoom-in-95">
            <div className="h-20 w-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-950">
              <CheckCircle2 className="h-10 w-10 animate-bounce" />
            </div>

            <div>
              <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-400 block">
                Order Settled & Saved to Database!
              </span>
              <h2 className="text-3xl font-black text-white mt-1">
                {completedOrder.totalAmount} <span className="text-lg text-emerald-400">ETB</span>
              </h2>
              <p className="text-xs text-slate-400 mt-2">
                Order #{completedOrder.orderNumber} • Settled by {completedOrder.waiterName} via{" "}
                <span className="text-white font-bold">{completedOrder.paymentChannel}</span>
              </p>
              <div className="mt-2 inline-block bg-slate-800 px-3 py-1 rounded-full text-[11px] font-mono text-slate-300 border border-slate-700">
                Ref: {completedOrder.transactionRef}
              </div>
            </div>

            <div className="flex gap-3 w-full max-w-sm pt-4">
              <button
                onClick={() => {
                  setSelectedTableNum(null);
                  setIsTakeout(false);
                  setActiveStep("tables");
                }}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950 transition active:scale-95"
              >
                Next Table / Customer
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ------------------- WAITER SWITCHER & PIN MODAL ------------------- */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="text-center">
              <h3 className="text-lg font-bold text-white">Select Waiter Profile</h3>
              <p className="text-xs text-slate-400">Tap your profile to log in and record your sales</p>
            </div>

            {/* List of Waiters */}
            <div className="grid grid-cols-2 gap-2">
              {waiters.map((w) => (
                <button
                  key={w.id}
                  onClick={() => {
                    setTargetWaiter(w);
                    setEnteredPin("");
                    setPinError(false);
                  }}
                  className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                    targetWaiter?.id === w.id
                      ? "bg-emerald-600/20 border-emerald-500 text-white ring-2 ring-emerald-500/30"
                      : "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <span className="text-2xl">{w.avatar}</span>
                  <span className="text-xs font-bold">{w.name}</span>
                </button>
              ))}
            </div>

            {/* PIN entry */}
            {targetWaiter && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="text-[11px] font-bold text-slate-400 block text-center uppercase">
                  Enter 4-Digit PIN for {targetWaiter.name}
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={enteredPin}
                  onChange={(e) => setEnteredPin(e.target.value)}
                  placeholder="PIN"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 text-center text-xl font-mono tracking-widest text-white focus:outline-none focus:border-emerald-500"
                />
                {pinError && (
                  <p className="text-[11px] text-rose-400 text-center font-bold">
                    Incorrect PIN. (Default demo PIN is {targetWaiter.pin})
                  </p>
                )}
                <button
                  onClick={handleVerifyPin}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
                >
                  Unlock & Switch
                </button>
              </div>
            )}

            <button
              onClick={() => setShowPinModal(false)}
              className="w-full py-2 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
