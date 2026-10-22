"use client";

import { useSyncExternalStore } from "react";

// ======================== TYPES ========================

export type PaymentChannel = "CASH" | "ETHQR" | "USSD_PUSH" | "CARD" | null;
export type PaymentStatus = "UNPAID" | "AWAITING_PAYMENT" | "PAID" | "FAILED";
export type OrderStatus =
  | "PENDING"
  | "COOKING"
  | "READY"
  | "SERVED"
  | "BILL_REQUESTED"
  | "PAID"
  | "CANCELLED";

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  cost?: number;
  isAvailable: boolean;
  image?: string;
}

export interface Waiter {
  id: string;
  name: string;
  pin: string;
  avatar: string;
  phone?: string;
  role: "waiter" | "head_waiter" | "cashier" | "owner";
  active: boolean;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  totalPrice: number;
  totalCost: number;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  branchId: string;
  tableNumber: number | null;
  orderType: "dine-in" | "takeout";
  items: OrderItem[];
  subtotal: number;
  serviceCharge: number;
  vat: number;
  discountAmount: number;
  totalAmount: number;
  totalCost: number;
  netProfit: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentChannel: PaymentChannel;
  paymentProvider?: "telebirr" | "cbe" | "cash" | "ethqr" | null;
  transactionRef?: string;
  waiterId: string;
  waiterName: string;
  cashierId?: string;
  cashierName?: string;
  customerName?: string;
  relayedOtp?: string;
  otpRelayedAt?: string;
  createdAt: string;
  paidAt?: string;
}

export interface TableRecord {
  number: number;
  status: "free" | "occupied";
  orderId?: string;
  seatedAt?: string;
  waiterId?: string;
  waiterName?: string;
}

// ======================== STORAGE ========================

const listeners = new Set<() => void>();

function notifyChange() {
  listeners.forEach((l) => l());
}

function loadStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

// ======================== SEED DATA ========================

const INITIAL_MENU: MenuItem[] = [
  { id: "m1", name: "Doro Wat", category: "Mains", price: 450, cost: 180, isAvailable: true },
  { id: "m2", name: "Kitfo", category: "Mains", price: 380, cost: 150, isAvailable: true },
  { id: "m3", name: "Tibs", category: "Mains", price: 420, cost: 170, isAvailable: true },
  { id: "m4", name: "Shiro", category: "Mains", price: 220, cost: 60, isAvailable: true },
  { id: "m5", name: "Injera (extra)", category: "Sides", price: 40, cost: 10, isAvailable: true },
  { id: "m6", name: "Fresh Juice", category: "Drinks", price: 80, cost: 25, isAvailable: true },
  { id: "m7", name: "Soft Drink", category: "Drinks", price: 50, cost: 20, isAvailable: true },
  { id: "m8", name: "Coffee (Buna)", category: "Drinks", price: 60, cost: 15, isAvailable: true },
];

const INITIAL_WAITERS: Waiter[] = [
  { id: "w1", name: "Abel", pin: "1234", avatar: "A", role: "waiter", active: true },
  { id: "w2", name: "Sara", pin: "2345", avatar: "S", role: "waiter", active: true },
  { id: "w3", name: "Dawit", pin: "3456", avatar: "D", role: "cashier", active: true },
];

const INITIAL_TABLES: TableRecord[] = Array.from({ length: 12 }, (_, i) => ({
  number: i + 1,
  status: "free" as const,
}));

// ======================== STATE ========================

let ready = false;
let globalMenu: MenuItem[] = [];
let globalWaiters: Waiter[] = [];
let globalTables: TableRecord[] = [];
let globalOrders: Order[] = [];
let activeWaiterId: string | null = null;

function initStore() {
  if (ready || typeof window === "undefined") return;
  globalMenu = loadStorage("bgs-pos-menu", INITIAL_MENU);
  globalWaiters = loadStorage("bgs-pos-waiters", INITIAL_WAITERS);
  globalTables = loadStorage("bgs-pos-tables", INITIAL_TABLES);
  globalOrders = loadStorage("bgs-pos-orders", [] as Order[]);
  activeWaiterId = loadStorage<string | null>("bgs-pos-active-waiter", globalWaiters[0]?.id || null);
  ready = true;
}

function recalculateOrder(order: Order) {
  order.subtotal = order.items.reduce((s, i) => s + i.totalPrice, 0);
  order.totalCost = order.items.reduce((s, i) => s + i.totalCost, 0);
  const afterDiscount = Math.max(0, order.subtotal - (order.discountAmount || 0));
  order.serviceCharge = Math.round(afterDiscount * 0.1);
  order.vat = Math.round((afterDiscount + order.serviceCharge) * 0.15);
  order.totalAmount = afterDiscount + order.serviceCharge + order.vat;
  order.netProfit = order.totalAmount - order.totalCost;
}

function nextOrderNumber() {
  const n = 100 + (globalOrders.length % 900) + Math.floor(Math.random() * 50);
  return String(n);
}

export function getActiveWaiter(): Waiter {
  initStore();
  return (
    globalWaiters.find((w) => w.id === activeWaiterId) ||
    globalWaiters[0] || {
      id: "w0",
      name: "Staff",
      pin: "0000",
      avatar: "S",
      role: "waiter",
      active: true,
    }
  );
}

export function getWaiters() {
  initStore();
  return globalWaiters;
}

export function setActiveWaiter(waiterId: string, pin?: string): boolean {
  initStore();
  const w = globalWaiters.find((x) => x.id === waiterId);
  if (!w) return false;
  if (pin !== undefined && w.pin !== pin) return false;
  activeWaiterId = w.id;
  saveStorage("bgs-pos-active-waiter", activeWaiterId);
  notifyChange();
  return true;
}

// ======================== ORDERS ========================

export function createOrGetTableOrder(
  tableNumber: number,
  branchId = "bole",
  waiterIdOverride?: string
): Order {
  initStore();
  const existing = globalOrders.find(
    (o) =>
      o.tableNumber === tableNumber &&
      o.paymentStatus !== "PAID" &&
      o.status !== "CANCELLED"
  );
  if (existing) return existing;

  const waiter = waiterIdOverride
    ? globalWaiters.find((w) => w.id === waiterIdOverride) || getActiveWaiter()
    : getActiveWaiter();

  const order: Order = {
    id: `ord-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    orderNumber: nextOrderNumber(),
    branchId,
    tableNumber,
    orderType: "dine-in",
    items: [],
    subtotal: 0,
    serviceCharge: 0,
    vat: 0,
    discountAmount: 0,
    totalAmount: 0,
    totalCost: 0,
    netProfit: 0,
    status: "PENDING",
    paymentStatus: "UNPAID",
    paymentChannel: null,
    waiterId: waiter.id,
    waiterName: waiter.name,
    createdAt: new Date().toISOString(),
  };

  globalOrders.push(order);
  const table = globalTables.find((t) => t.number === tableNumber);
  if (table) {
    table.status = "occupied";
    table.orderId = order.id;
    table.seatedAt = "Just now";
    table.waiterId = waiter.id;
    table.waiterName = waiter.name;
  }
  saveStorage("bgs-pos-tables", globalTables);
  saveStorage("bgs-pos-orders", globalOrders);
  notifyChange();
  return order;
}

export function createQuickTakeoutOrder(
  branchId = "bole",
  customerName = "Walk-in Guest",
  waiterIdOverride?: string
): Order {
  initStore();
  const waiter = waiterIdOverride
    ? globalWaiters.find((w) => w.id === waiterIdOverride) || getActiveWaiter()
    : getActiveWaiter();

  const order: Order = {
    id: `ord-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    orderNumber: nextOrderNumber(),
    branchId,
    tableNumber: null,
    orderType: "takeout",
    items: [],
    subtotal: 0,
    serviceCharge: 0,
    vat: 0,
    discountAmount: 0,
    totalAmount: 0,
    totalCost: 0,
    netProfit: 0,
    status: "PENDING",
    paymentStatus: "UNPAID",
    paymentChannel: null,
    customerName,
    waiterId: waiter.id,
    waiterName: waiter.name,
    createdAt: new Date().toISOString(),
  };

  globalOrders.push(order);
  saveStorage("bgs-pos-orders", globalOrders);
  notifyChange();
  return order;
}

export function addItemToOrder(orderId: string, menuItemId: string, qty = 1, notes = "") {
  initStore();
  const order = globalOrders.find((o) => o.id === orderId);
  if (!order || order.paymentStatus === "PAID") return;

  const menuItem = globalMenu.find((m) => m.id === menuItemId);
  if (!menuItem) return;

  const existing = order.items.find(
    (i) => i.menuItemId === menuItemId && (i.notes || "") === notes
  );
  if (existing) {
    existing.quantity += qty;
    existing.totalPrice = existing.quantity * existing.unitPrice;
    existing.totalCost = existing.quantity * existing.unitCost;
  } else {
    const unitCost = menuItem.cost ?? Math.round(menuItem.price * 0.4);
    order.items.push({
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      menuItemId,
      name: menuItem.name,
      quantity: qty,
      unitPrice: menuItem.price,
      unitCost,
      totalPrice: menuItem.price * qty,
      totalCost: unitCost * qty,
      notes: notes || undefined,
    });
  }
  recalculateOrder(order);
  saveStorage("bgs-pos-orders", globalOrders);
  notifyChange();
}

export function updateItemQuantity(orderId: string, itemId: string, quantity: number) {
  initStore();
  const order = globalOrders.find((o) => o.id === orderId);
  if (!order || order.paymentStatus === "PAID") return;

  const item = order.items.find((i) => i.id === itemId);
  if (!item) return;

  if (quantity <= 0) {
    order.items = order.items.filter((i) => i.id !== itemId);
  } else {
    item.quantity = quantity;
    item.totalPrice = item.quantity * item.unitPrice;
    item.totalCost = item.quantity * item.unitCost;
  }
  recalculateOrder(order);
  saveStorage("bgs-pos-orders", globalOrders);
  notifyChange();
}

export function applyDiscountToOrder(orderId: string, percent: number) {
  initStore();
  const order = globalOrders.find((o) => o.id === orderId);
  if (!order || order.paymentStatus === "PAID") return;
  order.discountAmount = Math.round(order.subtotal * (percent / 100));
  recalculateOrder(order);
  saveStorage("bgs-pos-orders", globalOrders);
  notifyChange();
}

export function updateOrderStatus(orderId: string, status: OrderStatus) {
  initStore();
  const order = globalOrders.find((o) => o.id === orderId);
  if (!order || order.paymentStatus === "PAID") return;
  order.status = status;
  saveStorage("bgs-pos-orders", globalOrders);
  notifyChange();
}

// ======================== PAYMENTS (core rules) ========================

/** Step 1: start payment for this Order ID — does NOT mark paid */
export function startOrderPayment(
  orderId: string,
  channel: Exclude<PaymentChannel, null>,
  provider?: "telebirr" | "cbe" | "cash" | "ethqr"
) {
  initStore();
  const order = globalOrders.find((o) => o.id === orderId);
  if (!order || order.paymentStatus === "PAID") return null;

  order.paymentStatus = "AWAITING_PAYMENT";
  order.paymentChannel = channel;
  order.paymentProvider =
    provider ||
    (channel === "CASH" ? "cash" : channel === "ETHQR" ? "ethqr" : "telebirr");
  order.status = "BILL_REQUESTED";

  saveStorage("bgs-pos-orders", globalOrders);
  notifyChange();
  return order;
}

/**
 * Step 2: confirm ONLY after real money
 * Cash received | QR verified on merchant account | Telebirr merchant success after OTP
 * Never from screenshot alone
 */
export function confirmOrderPayment(
  orderId: string,
  channel: Exclude<PaymentChannel, null>,
  transactionRef?: string,
  confirmedBy = "cashier"
): Order | null {
  initStore();
  const order = globalOrders.find((o) => o.id === orderId);
  if (!order) return null;
  if (order.paymentStatus === "PAID") return order;

  order.paymentStatus = "PAID";
  order.status = "PAID";
  order.paymentChannel = channel;
  order.paymentProvider =
    channel === "CASH" ? "cash" : channel === "ETHQR" ? "ethqr" : "telebirr";
  order.transactionRef =
    transactionRef || `${channel}-${order.orderNumber}-${Date.now()}`;
  order.paidAt = new Date().toISOString();
  order.cashierName = confirmedBy;
  order.relayedOtp = undefined;

  if (order.tableNumber != null) {
    const table = globalTables.find((t) => t.number === order.tableNumber);
    if (table) {
      table.status = "free";
      table.orderId = undefined;
      table.seatedAt = undefined;
      table.waiterId = undefined;
      table.waiterName = undefined;
    }
    saveStorage("bgs-pos-tables", globalTables);
  }

  saveStorage("bgs-pos-orders", globalOrders);
  notifyChange();
  return order;
}

/** Legacy helper used by older UI — routes to confirm (prefer explicit start+confirm) */
export function payOrder(
  orderId: string,
  channel: Exclude<PaymentChannel, null>,
  transactionRef?: string,
  provider?: "telebirr" | "cbe" | "cash" | "ethqr"
): Order | null {
  startOrderPayment(orderId, channel, provider);
  return confirmOrderPayment(orderId, channel, transactionRef, "cashier");
}

/** Waiter relays customer OTP to cashier for this order only */
export function relayOtpToCashier(orderId: string, otp: string, waiterId: string) {
  initStore();
  const order = globalOrders.find((o) => o.id === orderId);
  if (!order || order.waiterId !== waiterId) return false;
  if (order.paymentStatus === "PAID") return false;

  order.relayedOtp = String(otp).trim();
  order.otpRelayedAt = new Date().toISOString();
  if (order.paymentStatus === "UNPAID") {
    order.paymentStatus = "AWAITING_PAYMENT";
    order.paymentChannel = order.paymentChannel || "USSD_PUSH";
  }
  saveStorage("bgs-pos-orders", globalOrders);
  notifyChange();
  return true;
}

export function getRelayedOtp(orderId: string): string | undefined {
  initStore();
  return globalOrders.find((o) => o.id === orderId)?.relayedOtp;
}

// ======================== REPORTS (paid only) ========================

export function getPaidOrdersToday(branchId?: string): Order[] {
  initStore();
  const today = new Date().toISOString().slice(0, 10);
  return globalOrders.filter(
    (o) =>
      o.paymentStatus === "PAID" &&
      (o.paidAt || o.createdAt).startsWith(today) &&
      (!branchId || branchId === "all" || o.branchId === branchId)
  );
}

export function getWaiterLeaderboard(branchId?: string) {
  const paid = getPaidOrdersToday(branchId);
  const totalSales = paid.reduce((s, o) => s + o.totalAmount, 0);

  return getWaiters()
    .map((w) => {
      const mine = paid.filter((o) => o.waiterId === w.id);
      const sales = mine.reduce((s, o) => s + o.totalAmount, 0);
      return {
        id: w.id,
        name: w.name,
        avatar: w.avatar,
        ordersCount: mine.length,
        sales,
        cash: mine.filter((o) => o.paymentChannel === "CASH").reduce((s, o) => s + o.totalAmount, 0),
        qr: mine.filter((o) => o.paymentChannel === "ETHQR").reduce((s, o) => s + o.totalAmount, 0),
        ussd: mine
          .filter((o) => o.paymentChannel === "USSD_PUSH")
          .reduce((s, o) => s + o.totalAmount, 0),
        avgTicket: mine.length ? Math.round(sales / mine.length) : 0,
        percentageOfTotal: totalSales > 0 ? ((sales / totalSales) * 100).toFixed(1) : "0.0",
      };
    })
    .sort((a, b) => b.sales - a.sales);
}

export function getTodayMoneyBreakdown(branchId?: string) {
  const paid = getPaidOrdersToday(branchId);
  return {
    totalSales: paid.reduce((s, o) => s + o.totalAmount, 0),
    paidOrdersCount: paid.length,
    cash: paid.filter((o) => o.paymentChannel === "CASH").reduce((s, o) => s + o.totalAmount, 0),
    qr: paid.filter((o) => o.paymentChannel === "ETHQR").reduce((s, o) => s + o.totalAmount, 0),
    ussd: paid.filter((o) => o.paymentChannel === "USSD_PUSH").reduce((s, o) => s + o.totalAmount, 0),
    card: paid.filter((o) => o.paymentChannel === "CARD").reduce((s, o) => s + o.totalAmount, 0),
  };
}

// ======================== REACT HOOK ========================

function getSnapshot() {
  initStore();
  return {
    menu: globalMenu,
    waiters: globalWaiters,
    tables: globalTables,
    orders: globalOrders,
    activeWaiter: getActiveWaiter(),
  };
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function usePOSStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
