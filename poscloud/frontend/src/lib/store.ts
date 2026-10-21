"use client";

import { useEffect, useState } from "react";
import { fetchServerOrders, fetchWaiters, syncAllToMongoDb } from "./api";

export type TableStatus = "available" | "occupied" | "reserved" | "bill_requested";
export type PaymentStatus = "UNPAID" | "PENDING" | "PAID";
export type PaymentChannel = "CASH" | "ETHQR" | "USSD_PUSH" | "CARD" | null;
export type OrderStatus = "PENDING" | "COOKING" | "READY" | "SERVED" | "PAID";
export type OrderType = "dine-in" | "takeout" | "delivery";

export interface ConsumedItemStat {
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  revenue: number;
  cost: number;
  profit: number;
  profitMargin: string;
  percentageOfTotalExpenses: string;
}

export interface Waiter {
  id: string;
  name: string;
  pin: string;
  avatar: string;
  phone?: string;
  role: "waiter" | "head_waiter";
  active: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  nameAm?: string;
  price: number;
  cost: number; // Cost of goods / unit preparation cost
  category: "Traditional" | "Main Dishes" | "Drinks & Coffee" | "Fast Food" | "Sides";
  description?: string;
  isAvailable: boolean;
  prepTimeMinutes?: number;
  popular?: boolean;
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
  orderType: OrderType;
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
  paymentProvider?: "telebirr" | "cbe" | "cash" | null;
  transactionRef?: string;
  customerName?: string;
  waiterId: string;
  waiterName: string;
  createdAt: string;
  paidAt?: string;
}

export interface Table {
  id: number;
  number: number;
  seats: number;
  section: "Main Dining" | "Terrace" | "VIP Lounge";
  status: TableStatus;
  orderId: string | null;
  seatedAt?: string | null;
  waiterId?: string | null;
  waiterName?: string | null;
}

export interface Branch {
  id: string;
  name: string;
  location: string;
  phone: string;
}

export const BRANCHES: Branch[] = [
  { id: "bole", name: "Bole Branch", location: "Bole Medhanialem, Addis Ababa", phone: "+251 911 234 567" },
  { id: "kazanchis", name: "Kazanchis Branch", location: "ECA Road, Addis Ababa", phone: "+251 911 345 678" },
  { id: "piassa", name: "Piassa Branch", location: "Churchill Ave, Addis Ababa", phone: "+251 911 456 789" },
];

export const INITIAL_WAITERS: Waiter[] = [
  { id: "w1", name: "Almaz K.", pin: "1234", avatar: "👩🏾‍🍳", phone: "+251 911 112233", role: "waiter", active: true },
  { id: "w2", name: "Dawit T.", pin: "2345", avatar: "👨🏾‍🍳", phone: "+251 911 223344", role: "head_waiter", active: true },
  { id: "w3", name: "Hana B.", pin: "3456", avatar: "👩🏾", phone: "+251 911 334455", role: "waiter", active: true },
  { id: "w4", name: "Abebe M.", pin: "4567", avatar: "👨🏾", phone: "+251 911 445566", role: "waiter", active: true },
];

export const INITIAL_MENU: MenuItem[] = [
  { id: "1", name: "Doro Wat Special", nameAm: "የዶሮ ወጥ ልዩ", price: 420, cost: 160, category: "Traditional", description: "Slow-cooked organic chicken, spicy berbere sauce, boiled egg, fresh injera", isAvailable: true, prepTimeMinutes: 15, popular: true },
  { id: "2", name: "Special Kitfo (Libe/Tere)", nameAm: "ልዩ ክትፎ", price: 380, cost: 150, category: "Traditional", description: "Prime minced beef, seasoned with niter kibbeh and mitmita, served with ayib and gomen", isAvailable: true, prepTimeMinutes: 12, popular: true },
  { id: "3", name: "Shekla Tibs", nameAm: "የሸክላ ጥብስ", price: 340, cost: 130, category: "Traditional", description: "Sizzling prime beef cubes pan-fried with rosemary, onions, and jalapenos on a clay pot", isAvailable: true, prepTimeMinutes: 14, popular: true },
  { id: "4", name: "Shiro Tegabino", nameAm: "ሽሮ ተጋቢኖ", price: 190, cost: 60, category: "Traditional", description: "Simmering spicy chickpea powder stew served bubbling hot in clay pot with fresh injera", isAvailable: true, prepTimeMinutes: 10, popular: true },
  { id: "5", name: "Beyaynetu (Fasting Platter)", nameAm: "የጾም በያይነቱ", price: 230, cost: 75, category: "Traditional", description: "Assorted vegan delicacies: misir wat, ater kik, gomen, fosolia, and salad on injera", isAvailable: true, prepTimeMinutes: 8, popular: true },
  { id: "6", name: "Asa Gulash (Fish Gulash)", nameAm: "የዓሣ ጉላሽ", price: 310, cost: 120, category: "Main Dishes", description: "Lake Tana tilapia fish nuggets simmered in spicy tomato and onion reduction", isAvailable: true, prepTimeMinutes: 15 },
  { id: "7", name: "Club Sandwich & Fries", nameAm: "ክለብ ሳንድዊች", price: 240, cost: 85, category: "Fast Food", description: "Triple-layer toasted sandwich with chicken, egg, cheese, lettuce and seasoned fries", isAvailable: true, prepTimeMinutes: 12 },
  { id: "8", name: "BGS Classic Beef Burger", nameAm: "ክላሲክ በርገር", price: 260, cost: 95, category: "Fast Food", description: "200g homemade prime beef patty, melted gouda, caramelized onions, house sauce", isAvailable: true, prepTimeMinutes: 15 },
  { id: "9", name: "Traditional Buna Ceremony", nameAm: "የባህል ቡና ቁርስ", price: 150, cost: 35, category: "Drinks & Coffee", description: "Freshly roasted Yirgacheffe coffee in Jebena, served with incense and fresh popcorn", isAvailable: true, prepTimeMinutes: 10, popular: true },
  { id: "10", name: "Habesha Beer (330ml)", nameAm: "ሐበሻ ቢራ", price: 80, cost: 45, category: "Drinks & Coffee", description: "Cold crisp Ethiopian lager beer", isAvailable: true, prepTimeMinutes: 2 },
  { id: "11", name: "Ambo Water Sparkling (500ml)", nameAm: "አምቦ ውሃ", price: 50, cost: 22, category: "Drinks & Coffee", description: "Natural sparkling mineral water from Ambo springs", isAvailable: true, prepTimeMinutes: 2 },
  { id: "12", name: "Fresh Avocado Mango Spris", nameAm: "የአቮካዶ እና ማንጎ እስፕሪስ", price: 120, cost: 40, category: "Drinks & Coffee", description: "Layered fresh pureed avocado and mango with fresh lime juice", isAvailable: true, prepTimeMinutes: 5, popular: true },
  { id: "13", name: "Injera (Extra Teff)", nameAm: "ተጨማሪ እንጀራ", price: 40, cost: 15, category: "Sides", description: "100% pure white teff fermented injera", isAvailable: true, prepTimeMinutes: 2 },
  { id: "14", name: "Timatim Fitfit (Side)", nameAm: "ቲማቲም ፍትፍት", price: 95, cost: 30, category: "Sides", description: "Shredded injera tossed with chilled tomato salad, onions, jalapenos, and lemon vinaigrette", isAvailable: true, prepTimeMinutes: 5 },
];

export const INITIAL_TABLES: Table[] = [
  { id: 1, number: 1, seats: 2, section: "Main Dining", status: "available", orderId: null },
  { id: 2, number: 2, seats: 2, section: "Main Dining", status: "occupied", orderId: "ord-sample-1", seatedAt: "38m ago", waiterId: "w1", waiterName: "Almaz K." },
  { id: 3, number: 3, seats: 4, section: "Main Dining", status: "occupied", orderId: "ord-sample-2", seatedAt: "15m ago", waiterId: "w2", waiterName: "Dawit T." },
  { id: 4, number: 4, seats: 4, section: "Main Dining", status: "available", orderId: null },
  { id: 5, number: 5, seats: 6, section: "Main Dining", status: "bill_requested", orderId: "ord-sample-3", seatedAt: "52m ago", waiterId: "w1", waiterName: "Almaz K." },
  { id: 6, number: 6, seats: 6, section: "Main Dining", status: "available", orderId: null },
  { id: 7, number: 7, seats: 4, section: "Terrace", status: "available", orderId: null },
  { id: 8, number: 8, seats: 4, section: "Terrace", status: "occupied", orderId: "ord-sample-4", seatedAt: "22m ago", waiterId: "w3", waiterName: "Hana B." },
  { id: 9, number: 9, seats: 2, section: "Terrace", status: "available", orderId: null },
  { id: 10, number: 10, seats: 8, section: "Terrace", status: "reserved", orderId: null },
  { id: 11, number: 11, seats: 6, section: "VIP Lounge", status: "occupied", orderId: "ord-sample-5", seatedAt: "45m ago", waiterId: "w2", waiterName: "Dawit T." },
  { id: 12, number: 12, seats: 10, section: "VIP Lounge", status: "available", orderId: null },
];

const now = Date.now();

export const INITIAL_ORDERS: Order[] = [
  // Active Orders
  {
    id: "ord-sample-1",
    orderNumber: "101",
    branchId: "bole",
    tableNumber: 2,
    orderType: "dine-in",
    items: [
      { id: "i1", menuItemId: "1", name: "Doro Wat Special", quantity: 1, unitPrice: 420, unitCost: 160, totalPrice: 420, totalCost: 160, notes: "Extra spicy" },
      { id: "i2", menuItemId: "11", name: "Ambo Water Sparkling (500ml)", quantity: 2, unitPrice: 50, unitCost: 22, totalPrice: 100, totalCost: 44 },
    ],
    subtotal: 520,
    serviceCharge: 52,
    vat: 78,
    discountAmount: 0,
    totalAmount: 650,
    totalCost: 204,
    netProfit: 446,
    status: "READY",
    paymentStatus: "UNPAID",
    paymentChannel: null,
    waiterId: "w1",
    waiterName: "Almaz K.",
    createdAt: new Date(now - 38 * 60000).toISOString(),
  },
  {
    id: "ord-sample-2",
    orderNumber: "102",
    branchId: "bole",
    tableNumber: 3,
    orderType: "dine-in",
    items: [
      { id: "i3", menuItemId: "2", name: "Special Kitfo (Libe/Tere)", quantity: 2, unitPrice: 380, unitCost: 150, totalPrice: 760, totalCost: 300, notes: "Medium rare / Libe lab" },
      { id: "i4", menuItemId: "10", name: "Habesha Beer (330ml)", quantity: 3, unitPrice: 80, unitCost: 45, totalPrice: 240, totalCost: 135 },
    ],
    subtotal: 1000,
    serviceCharge: 100,
    vat: 150,
    discountAmount: 0,
    totalAmount: 1250,
    totalCost: 435,
    netProfit: 815,
    status: "SERVED",
    paymentStatus: "UNPAID",
    paymentChannel: null,
    waiterId: "w2",
    waiterName: "Dawit T.",
    createdAt: new Date(now - 15 * 60000).toISOString(),
  },
  {
    id: "ord-sample-3",
    orderNumber: "103",
    branchId: "bole",
    tableNumber: 5,
    orderType: "dine-in",
    items: [
      { id: "i5", menuItemId: "3", name: "Shekla Tibs", quantity: 2, unitPrice: 340, unitCost: 130, totalPrice: 680, totalCost: 260 },
      { id: "i6", menuItemId: "4", name: "Shiro Tegabino", quantity: 1, unitPrice: 190, unitCost: 60, totalPrice: 190, totalCost: 60 },
      { id: "i7", menuItemId: "12", name: "Fresh Avocado Mango Spris", quantity: 2, unitPrice: 120, unitCost: 40, totalPrice: 240, totalCost: 80 },
    ],
    subtotal: 1110,
    serviceCharge: 111,
    vat: 166.5,
    discountAmount: 0,
    totalAmount: 1387.5,
    totalCost: 400,
    netProfit: 987.5,
    status: "SERVED",
    paymentStatus: "UNPAID",
    paymentChannel: null,
    waiterId: "w1",
    waiterName: "Almaz K.",
    createdAt: new Date(now - 52 * 60000).toISOString(),
  },
  {
    id: "ord-sample-4",
    orderNumber: "104",
    branchId: "bole",
    tableNumber: 8,
    orderType: "dine-in",
    items: [
      { id: "i8", menuItemId: "8", name: "BGS Classic Beef Burger", quantity: 2, unitPrice: 260, unitCost: 95, totalPrice: 520, totalCost: 190 },
      { id: "i9", menuItemId: "11", name: "Ambo Water Sparkling (500ml)", quantity: 2, unitPrice: 50, unitCost: 22, totalPrice: 100, totalCost: 44 },
    ],
    subtotal: 620,
    serviceCharge: 62,
    vat: 93,
    discountAmount: 0,
    totalAmount: 775,
    totalCost: 234,
    netProfit: 541,
    status: "READY",
    paymentStatus: "UNPAID",
    paymentChannel: null,
    waiterId: "w3",
    waiterName: "Hana B.",
    createdAt: new Date(now - 22 * 60000).toISOString(),
  },
  {
    id: "ord-sample-5",
    orderNumber: "105",
    branchId: "bole",
    tableNumber: 11,
    orderType: "dine-in",
    items: [
      { id: "i10", menuItemId: "1", name: "Doro Wat Special", quantity: 3, unitPrice: 420, unitCost: 160, totalPrice: 1260, totalCost: 480 },
      { id: "i11", menuItemId: "3", name: "Shekla Tibs", quantity: 2, unitPrice: 340, unitCost: 130, totalPrice: 680, totalCost: 260 },
      { id: "i12", menuItemId: "9", name: "Traditional Buna Ceremony", quantity: 1, unitPrice: 150, unitCost: 35, totalPrice: 150, totalCost: 35 },
    ],
    subtotal: 2090,
    serviceCharge: 209,
    vat: 313.5,
    discountAmount: 0,
    totalAmount: 2612.5,
    totalCost: 775,
    netProfit: 1837.5,
    status: "SERVED",
    paymentStatus: "UNPAID",
    paymentChannel: null,
    waiterId: "w2",
    waiterName: "Dawit T.",
    createdAt: new Date(now - 45 * 60000).toISOString(),
  },

  // Paid orders for realistic today metrics & waiter rankings
  {
    id: "ord-paid-1",
    orderNumber: "095",
    branchId: "bole",
    tableNumber: 1,
    orderType: "dine-in",
    items: [
      { id: "p1", menuItemId: "2", name: "Special Kitfo (Libe/Tere)", quantity: 3, unitPrice: 380, unitCost: 150, totalPrice: 1140, totalCost: 450 },
      { id: "p2", menuItemId: "10", name: "Habesha Beer (330ml)", quantity: 6, unitPrice: 80, unitCost: 45, totalPrice: 480, totalCost: 270 },
      { id: "p3", menuItemId: "13", name: "Injera (Extra Teff)", quantity: 3, unitPrice: 40, unitCost: 15, totalPrice: 120, totalCost: 45 },
    ],
    subtotal: 1740,
    serviceCharge: 174,
    vat: 261,
    discountAmount: 0,
    totalAmount: 2175,
    totalCost: 765,
    netProfit: 1410,
    status: "PAID",
    paymentStatus: "PAID",
    paymentChannel: "ETHQR",
    paymentProvider: "telebirr",
    transactionRef: "TXN-TELEBIRR-829104",
    waiterId: "w2",
    waiterName: "Dawit T.",
    createdAt: new Date(now - 120 * 60000).toISOString(),
    paidAt: new Date(now - 90 * 60000).toISOString(),
  },
  {
    id: "ord-paid-2",
    orderNumber: "096",
    branchId: "bole",
    tableNumber: 4,
    orderType: "dine-in",
    items: [
      { id: "p4", menuItemId: "3", name: "Shekla Tibs", quantity: 2, unitPrice: 340, unitCost: 130, totalPrice: 680, totalCost: 260 },
      { id: "p5", menuItemId: "5", name: "Beyaynetu (Fasting Platter)", quantity: 2, unitPrice: 230, unitCost: 75, totalPrice: 460, totalCost: 150 },
      { id: "p6", menuItemId: "12", name: "Fresh Avocado Mango Spris", quantity: 4, unitPrice: 120, unitCost: 40, totalPrice: 480, totalCost: 160 },
    ],
    subtotal: 1620,
    serviceCharge: 162,
    vat: 243,
    discountAmount: 0,
    totalAmount: 2025,
    totalCost: 570,
    netProfit: 1455,
    status: "PAID",
    paymentStatus: "PAID",
    paymentChannel: "CASH",
    paymentProvider: "cash",
    transactionRef: "TXN-CASH-771203",
    waiterId: "w1",
    waiterName: "Almaz K.",
    createdAt: new Date(now - 100 * 60000).toISOString(),
    paidAt: new Date(now - 75 * 60000).toISOString(),
  },
  {
    id: "ord-paid-3",
    orderNumber: "097",
    branchId: "bole",
    tableNumber: 6,
    orderType: "dine-in",
    items: [
      { id: "p7", menuItemId: "1", name: "Doro Wat Special", quantity: 2, unitPrice: 420, unitCost: 160, totalPrice: 840, totalCost: 320 },
      { id: "p8", menuItemId: "9", name: "Traditional Buna Ceremony", quantity: 2, unitPrice: 150, unitCost: 35, totalPrice: 300, totalCost: 70 },
    ],
    subtotal: 1140,
    serviceCharge: 114,
    vat: 171,
    discountAmount: 0,
    totalAmount: 1425,
    totalCost: 390,
    netProfit: 1035,
    status: "PAID",
    paymentStatus: "PAID",
    paymentChannel: "ETHQR",
    paymentProvider: "cbe",
    transactionRef: "TXN-CBE-994125",
    waiterId: "w2",
    waiterName: "Dawit T.",
    createdAt: new Date(now - 85 * 60000).toISOString(),
    paidAt: new Date(now - 60 * 60000).toISOString(),
  },
  {
    id: "ord-paid-4",
    orderNumber: "098",
    branchId: "bole",
    tableNumber: 7,
    orderType: "dine-in",
    items: [
      { id: "p9", menuItemId: "7", name: "Club Sandwich & Fries", quantity: 2, unitPrice: 240, unitCost: 85, totalPrice: 480, totalCost: 170 },
      { id: "p10", menuItemId: "8", name: "BGS Classic Beef Burger", quantity: 2, unitPrice: 260, unitCost: 95, totalPrice: 520, totalCost: 190 },
      { id: "p11", menuItemId: "11", name: "Ambo Water Sparkling (500ml)", quantity: 4, unitPrice: 50, unitCost: 22, totalPrice: 200, totalCost: 88 },
    ],
    subtotal: 1200,
    serviceCharge: 120,
    vat: 180,
    discountAmount: 0,
    totalAmount: 1500,
    totalCost: 448,
    netProfit: 1052,
    status: "PAID",
    paymentStatus: "PAID",
    paymentChannel: "USSD_PUSH",
    transactionRef: "USSD-912384",
    waiterId: "w3",
    waiterName: "Hana B.",
    createdAt: new Date(now - 65 * 60000).toISOString(),
    paidAt: new Date(now - 40 * 60000).toISOString(),
  },
  {
    id: "ord-paid-5",
    orderNumber: "099",
    branchId: "bole",
    tableNumber: null,
    orderType: "takeout",
    items: [
      { id: "p12", menuItemId: "2", name: "Special Kitfo (Libe/Tere)", quantity: 1, unitPrice: 380, unitCost: 150, totalPrice: 380, totalCost: 150 },
      { id: "p13", menuItemId: "12", name: "Fresh Avocado Mango Spris", quantity: 1, unitPrice: 120, unitCost: 40, totalPrice: 120, totalCost: 40 },
    ],
    subtotal: 500,
    serviceCharge: 50,
    vat: 75,
    discountAmount: 0,
    totalAmount: 625,
    totalCost: 190,
    netProfit: 435,
    status: "PAID",
    paymentStatus: "PAID",
    paymentChannel: "CASH",
    paymentProvider: "cash",
    transactionRef: "TXN-CASH-449102",
    waiterId: "w4",
    waiterName: "Abebe M.",
    createdAt: new Date(now - 50 * 60000).toISOString(),
    paidAt: new Date(now - 30 * 60000).toISOString(),
  },
];

const STORE_EVENT = "pos_store_updated";

function notifyChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(STORE_EVENT));
  }
}

function loadStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveStorage<T>(key: string, value: T) {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

// Global Store State
let globalMenu: MenuItem[] = [];
let globalTables: Table[] = [];
let globalOrders: Order[] = [];
let globalWaiters: Waiter[] = [];
let activeWaiterId = "w2"; // Default to Dawit T.
let initialized = false;

function initStore() {
  if (initialized || typeof window === "undefined") return;
  globalMenu = loadStorage("bgs-pos-menu", INITIAL_MENU);
  globalTables = loadStorage("bgs-pos-tables", INITIAL_TABLES);
  globalOrders = loadStorage("bgs-pos-orders", INITIAL_ORDERS);
  globalWaiters = loadStorage("bgs-pos-waiters", INITIAL_WAITERS);
  activeWaiterId = loadStorage("bgs-pos-active-waiter", "w2");
  initialized = true;

  // Background fetch from live MongoDB Atlas to keep data in sync
  fetchServerOrders()
    .then((res) => {
      if (res && res.orders && res.orders.length > 0) {
        const idMap = new Map(globalOrders.map((o) => [o.id, o]));
        res.orders.forEach((o: any) => idMap.set(o.id, o));
        globalOrders = Array.from(idMap.values());
        saveStorage("bgs-pos-orders", globalOrders);
        notifyChange();
      }
    })
    .catch(() => {});

  fetchWaiters()
    .then((res) => {
      if (res && res.waiters && res.waiters.length > 0) {
        const idMap = new Map(globalWaiters.map((w) => [w.id, w]));
        res.waiters.forEach((w: any) => idMap.set(w.id, w));
        globalWaiters = Array.from(idMap.values());
        saveStorage("bgs-pos-waiters", globalWaiters);
        notifyChange();
      }
    })
    .catch(() => {});
}

export function usePOSStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    initStore();
    const handleUpdate = () => setTick((t) => t + 1);
    window.addEventListener(STORE_EVENT, handleUpdate);
    return () => window.removeEventListener(STORE_EVENT, handleUpdate);
  }, []);

  initStore();

  const waiters = globalWaiters.length ? globalWaiters : INITIAL_WAITERS;
  const currentWaiter = waiters.find((w) => w.id === activeWaiterId) || waiters[0];

  return {
    menu: globalMenu.length ? globalMenu : INITIAL_MENU,
    tables: globalTables.length ? globalTables : INITIAL_TABLES,
    orders: globalOrders.length ? globalOrders : INITIAL_ORDERS,
    waiters,
    activeWaiter: currentWaiter,
    branches: BRANCHES,
  };
}

export function getMenu(): MenuItem[] {
  initStore();
  return globalMenu.length ? globalMenu : INITIAL_MENU;
}

export function getTables(): Table[] {
  initStore();
  return globalTables.length ? globalTables : INITIAL_TABLES;
}

export function getOrders(): Order[] {
  initStore();
  return (globalOrders.length ? globalOrders : INITIAL_ORDERS).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getWaiters(): Waiter[] {
  initStore();
  return globalWaiters.length ? globalWaiters : INITIAL_WAITERS;
}

export function getActiveWaiter(): Waiter {
  initStore();
  const list = getWaiters();
  return list.find((w) => w.id === activeWaiterId) || list[0];
}

export function setActiveWaiter(waiterId: string) {
  initStore();
  activeWaiterId = waiterId;
  saveStorage("bgs-pos-active-waiter", waiterId);
  notifyChange();
}

export function addWaiter(newWaiter: Omit<Waiter, "id">): Waiter {
  initStore();
  const waiter: Waiter = {
    ...newWaiter,
    id: `w-${Date.now()}`,
  };
  globalWaiters.push(waiter);
  saveStorage("bgs-pos-waiters", globalWaiters);
  notifyChange();
  return waiter;
}

export function getTableOrder(tableNumber: number): Order | undefined {
  initStore();
  const table = globalTables.find((t) => t.number === tableNumber);
  if (!table || !table.orderId) return undefined;
  return globalOrders.find((o) => o.id === table.orderId && o.paymentStatus !== "PAID");
}

export function calculateOrderTotals(items: OrderItem[], discountPercent: number = 0) {
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalCost = items.reduce((sum, item) => sum + (item.totalCost || 0), 0);
  const serviceCharge = Math.round(subtotal * 0.1);
  const vat = Math.round(subtotal * 0.15);
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const totalAmount = Math.max(0, subtotal + serviceCharge + vat - discountAmount);
  const netProfit = totalAmount - totalCost;
  return { subtotal, serviceCharge, vat, discountAmount, totalAmount, totalCost, netProfit };
}

export function createOrGetTableOrder(tableNumber: number, branchId = "bole", waiterIdOverride?: string): Order {
  initStore();
  const existing = getTableOrder(tableNumber);
  if (existing) return existing;

  const currentWaiter = waiterIdOverride 
    ? (getWaiters().find((w) => w.id === waiterIdOverride) || getActiveWaiter())
    : getActiveWaiter();

  const orderNum = String(Math.floor(100 + Math.random() * 900));
  const newOrder: Order = {
    id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    orderNumber: orderNum,
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
    waiterId: currentWaiter.id,
    waiterName: currentWaiter.name,
    createdAt: new Date().toISOString(),
  };

  globalOrders.push(newOrder);

  const table = globalTables.find((t) => t.number === tableNumber);
  if (table) {
    table.status = "occupied";
    table.orderId = newOrder.id;
    table.seatedAt = "Just now";
    table.waiterId = currentWaiter.id;
    table.waiterName = currentWaiter.name;
  }

  saveStorage("bgs-pos-tables", globalTables);
  saveStorage("bgs-pos-orders", globalOrders);
  notifyChange();
  return newOrder;
}

export function createQuickTakeoutOrder(branchId = "bole", customerName = "Walk-in Guest", waiterIdOverride?: string): Order {
  initStore();
  const currentWaiter = waiterIdOverride 
    ? (getWaiters().find((w) => w.id === waiterIdOverride) || getActiveWaiter())
    : getActiveWaiter();

  const orderNum = String(Math.floor(100 + Math.random() * 900));
  const newOrder: Order = {
    id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    orderNumber: orderNum,
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
    waiterId: currentWaiter.id,
    waiterName: currentWaiter.name,
    createdAt: new Date().toISOString(),
  };

  globalOrders.push(newOrder);
  saveStorage("bgs-pos-orders", globalOrders);
  notifyChange();
  return newOrder;
}

export function addItemToOrder(orderId: string, menuItemId: string, qty = 1, notes = "") {
  initStore();
  const order = globalOrders.find((o) => o.id === orderId);
  if (!order || order.paymentStatus === "PAID") return;

  const menuItem = (globalMenu.length ? globalMenu : INITIAL_MENU).find((m) => m.id === menuItemId);
  if (!menuItem) return;

  const existing = order.items.find((i) => i.menuItemId === menuItemId && (i.notes || "") === notes);
  if (existing) {
    existing.quantity += qty;
    existing.totalPrice = existing.quantity * existing.unitPrice;
    existing.totalCost = existing.quantity * existing.unitCost;
  } else {
    order.items.push({
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      menuItemId,
      name: menuItem.name,
      quantity: qty,
      unitPrice: menuItem.price,
      unitCost: menuItem.cost || Math.round(menuItem.price * 0.4),
      totalPrice: menuItem.price * qty,
      totalCost: (menuItem.cost || Math.round(menuItem.price * 0.4)) * qty,
      notes: notes || undefined,
    });
  }

  const totals = calculateOrderTotals(order.items);
  order.subtotal = totals.subtotal;
  order.serviceCharge = totals.serviceCharge;
  order.vat = totals.vat;
  order.totalAmount = totals.totalAmount;
  order.totalCost = totals.totalCost;
  order.netProfit = totals.netProfit;
  order.status = "PENDING";

  saveStorage("bgs-pos-orders", globalOrders);
  notifyChange();
}

export function updateItemQuantity(orderId: string, itemId: string, newQty: number) {
  initStore();
  const order = globalOrders.find((o) => o.id === orderId);
  if (!order || order.paymentStatus === "PAID") return;

  if (newQty <= 0) {
    order.items = order.items.filter((i) => i.id !== itemId);
  } else {
    const item = order.items.find((i) => i.id === itemId);
    if (item) {
      item.quantity = newQty;
      item.totalPrice = item.unitPrice * newQty;
      item.totalCost = item.unitCost * newQty;
    }
  }

  const totals = calculateOrderTotals(order.items);
  order.subtotal = totals.subtotal;
  order.serviceCharge = totals.serviceCharge;
  order.vat = totals.vat;
  order.totalAmount = totals.totalAmount;
  order.totalCost = totals.totalCost;
  order.netProfit = totals.netProfit;

  saveStorage("bgs-pos-orders", globalOrders);
  notifyChange();
}

export function removeItemFromOrder(orderId: string, itemId: string) {
  updateItemQuantity(orderId, itemId, 0);
}

export function applyDiscountToOrder(orderId: string, discountPercent: number) {
  initStore();
  const order = globalOrders.find((o) => o.id === orderId);
  if (!order) return;

  const totals = calculateOrderTotals(order.items, discountPercent);
  order.discountAmount = totals.discountAmount;
  order.totalAmount = totals.totalAmount;
  order.netProfit = totals.netProfit;

  saveStorage("bgs-pos-orders", globalOrders);
  notifyChange();
}

export function updateOrderStatus(orderId: string, status: OrderStatus) {
  initStore();
  const order = globalOrders.find((o) => o.id === orderId);
  if (!order) return;

  order.status = status;
  saveStorage("bgs-pos-orders", globalOrders);
  notifyChange();
}

export function requestTableBill(tableNumber: number) {
  initStore();
  const table = globalTables.find((t) => t.number === tableNumber);
  if (table && table.status === "occupied") {
    table.status = "bill_requested";
    saveStorage("bgs-pos-tables", globalTables);
    notifyChange();
  }
}

export function payOrder(
  orderId: string,
  channel: PaymentChannel,
  transactionRef?: string,
  provider?: "telebirr" | "cbe" | "cash",
  settlingWaiterId?: string
): Order | null {
  initStore();
  const order = globalOrders.find((o) => o.id === orderId);
  if (!order || order.paymentStatus === "PAID") return null;

  const activeWaiter = settlingWaiterId
    ? getWaiters().find((w) => w.id === settlingWaiterId) || getActiveWaiter()
    : getActiveWaiter();

  order.paymentStatus = "PAID";
  order.status = "PAID";
  order.paymentChannel = channel;
  order.paymentProvider = provider || (channel === "CASH" ? "cash" : "telebirr");
  order.paidAt = new Date().toISOString();
  order.waiterId = activeWaiter.id;
  order.waiterName = activeWaiter.name;
  order.transactionRef =
    transactionRef ||
    `TXN-${channel || "CASH"}-${Math.floor(1000000 + Math.random() * 9000000)}`;

  // Recalculate totals and profit
  const totals = calculateOrderTotals(order.items);
  order.subtotal = totals.subtotal;
  order.serviceCharge = totals.serviceCharge;
  order.vat = totals.vat;
  order.totalAmount = totals.totalAmount;
  order.totalCost = totals.totalCost;
  order.netProfit = totals.netProfit;

  if (order.tableNumber) {
    const table = globalTables.find((t) => t.number === order.tableNumber);
    if (table) {
      table.status = "available";
      table.orderId = null;
      table.seatedAt = null;
      table.waiterId = null;
      table.waiterName = null;
    }
  }

  saveStorage("bgs-pos-tables", globalTables);
  saveStorage("bgs-pos-orders", globalOrders);
  notifyChange();

  // Async sync to server API & MongoDB Atlas
  if (typeof window !== "undefined") {
    fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    })
      .then(() => syncAllDataToMongoDB())
      .catch((err) => console.warn("Background API order sync:", err));
  }

  return order;
}

export function toggleMenuItemAvailability(menuItemId: string) {
  initStore();
  const item = globalMenu.find((m) => m.id === menuItemId);
  if (item) {
    item.isAvailable = !item.isAvailable;
    saveStorage("bgs-pos-menu", globalMenu);
    notifyChange();
  }
}

export function addMenuItem(newItem: Omit<MenuItem, "id">): MenuItem {
  initStore();
  const item: MenuItem = {
    ...newItem,
    id: `custom-${Date.now()}`,
  };
  globalMenu.push(item);
  saveStorage("bgs-pos-menu", globalMenu);
  notifyChange();
  return item;
}

export function getTodayProfitReport(branchId = "all") {
  initStore();
  const allOrders = globalOrders.length ? globalOrders : INITIAL_ORDERS;
  const waiters = globalWaiters.length ? globalWaiters : INITIAL_WAITERS;

  const relevantOrders = branchId === "all" ? allOrders : allOrders.filter((o) => o.branchId === branchId);
  const paidOrders = relevantOrders.filter((o) => o.paymentStatus === "PAID");

  const totalSales = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  // Item consumption breakdown with reliable unit cost lookup
  const itemMap: Record<
    string,
    {
      name: string;
      category: string;
      quantity: number;
      unitPrice: number;
      unitCost: number;
      revenue: number;
      cost: number;
      profit: number;
    }
  > = {};

  paidOrders.forEach((o) => {
    o.items.forEach((item) => {
      const menuItem = (globalMenu.length ? globalMenu : INITIAL_MENU).find(
        (m) => m.id === item.menuItemId || m.name.toLowerCase() === item.name.toLowerCase()
      );
      const unitCost = item.unitCost && item.unitCost > 0
        ? item.unitCost
        : (menuItem?.cost || Math.round((item.unitPrice || menuItem?.price || 100) * 0.4));
      const category = menuItem?.category || "Kitchen";

      if (!itemMap[item.name]) {
        itemMap[item.name] = {
          name: item.name,
          category,
          quantity: 0,
          unitPrice: item.unitPrice || menuItem?.price || 0,
          unitCost,
          revenue: 0,
          cost: 0,
          profit: 0,
        };
      }
      itemMap[item.name].quantity += item.quantity;
      itemMap[item.name].revenue += item.totalPrice;
      const c = unitCost * item.quantity;
      itemMap[item.name].cost += c;
      itemMap[item.name].profit += item.totalPrice - c;
    });
  });

  const totalCost = Object.values(itemMap).reduce((sum, i) => sum + i.cost, 0);
  const netProfit = totalSales - totalCost;
  const profitMargin = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : "0.0";

  const cashTotal = paidOrders.filter((o) => o.paymentChannel === "CASH").reduce((sum, o) => sum + o.totalAmount, 0);
  const qrTotal = paidOrders.filter((o) => o.paymentChannel === "ETHQR").reduce((sum, o) => sum + o.totalAmount, 0);
  const ussdTotal = paidOrders.filter((o) => o.paymentChannel === "USSD_PUSH").reduce((sum, o) => sum + o.totalAmount, 0);

  // Waiter Staff Leaderboard
  const waiterStats = waiters.map((w) => {
    const myOrders = paidOrders.filter((o) => o.waiterId === w.id || o.waiterName === w.name);
    const mySales = myOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const myCost = myOrders.reduce((sum, o) => {
      const orderCost = o.items.reduce((iSum, item) => {
        const m = (globalMenu.length ? globalMenu : INITIAL_MENU).find(
          (menu) => menu.id === item.menuItemId || menu.name.toLowerCase() === item.name.toLowerCase()
        );
        const uCost = item.unitCost && item.unitCost > 0 ? item.unitCost : (m?.cost || Math.round((item.unitPrice || 100) * 0.4));
        return iSum + uCost * item.quantity;
      }, 0);
      return sum + orderCost;
    }, 0);

    const myCash = myOrders.filter((o) => o.paymentChannel === "CASH").reduce((sum, o) => sum + o.totalAmount, 0);
    const myQr = myOrders.filter((o) => o.paymentChannel === "ETHQR").reduce((sum, o) => sum + o.totalAmount, 0);
    const myUssd = myOrders.filter((o) => o.paymentChannel === "USSD_PUSH").reduce((sum, o) => sum + o.totalAmount, 0);

    return {
      id: w.id,
      name: w.name,
      avatar: w.avatar,
      sales: mySales,
      cost: myCost,
      profit: mySales - myCost,
      ordersCount: myOrders.length,
      avgTicket: myOrders.length > 0 ? Math.round(mySales / myOrders.length) : 0,
      cash: myCash,
      qr: myQr,
      ussd: myUssd,
      percentageOfTotal: totalSales > 0 ? ((mySales / totalSales) * 100).toFixed(1) : "0.0",
    };
  }).sort((a, b) => b.sales - a.sales);

  const itemConsumption: ConsumedItemStat[] = Object.values(itemMap)
    .sort((a, b) => b.revenue - a.revenue)
    .map((item) => ({
      ...item,
      profitMargin: item.revenue > 0 ? ((item.profit / item.revenue) * 100).toFixed(0) : "0",
      percentageOfTotalExpenses: totalCost > 0 ? ((item.cost / totalCost) * 100).toFixed(1) : "0.0",
    }));

  return {
    totalSales,
    totalCost,
    netProfit,
    profitMargin,
    paidCount: paidOrders.length,
    cashTotal,
    qrTotal,
    ussdTotal,
    waiterStats,
    topWaiter: waiterStats[0] || null,
    itemConsumption,
  };
}

export async function syncAllDataToMongoDB(): Promise<{
  success: boolean;
  ordersSaved: number;
  waitersSaved: number;
  consumptionSaved: boolean;
  message: string;
}> {
  initStore();
  const allOrders = globalOrders.length ? globalOrders : INITIAL_ORDERS;
  const waiters = globalWaiters.length ? globalWaiters : INITIAL_WAITERS;
  const report = getTodayProfitReport("all");

  const todayStr = new Date().toISOString().slice(0, 10);
  const consumptionPayload = {
    id: `consumption-${todayStr}`,
    date: todayStr,
    branchId: "all",
    totalSales: report.totalSales,
    totalCost: report.totalCost,
    netProfit: report.netProfit,
    profitMargin: report.profitMargin,
    paidOrdersCount: report.paidCount,
    moneyBreakdown: {
      cash: report.cashTotal,
      qr: report.qrTotal,
      ussd: report.ussdTotal,
      card: 0,
    },
    itemsConsumed: report.itemConsumption.map((i) => ({
      name: i.name,
      category: i.category,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      unitCost: i.unitCost,
      totalRevenue: i.revenue,
      totalCost: i.cost,
      profit: i.profit,
      profitMargin: i.profitMargin,
    })),
    waiterPerformances: report.waiterStats,
    savedAt: new Date().toISOString(),
  };

  try {
    const res = await syncAllToMongoDb({
      orders: allOrders,
      waiters,
      consumption: consumptionPayload,
    });
    return {
      success: true,
      ordersSaved: res.ordersSaved,
      waitersSaved: res.waitersSaved,
      consumptionSaved: res.consumptionSaved,
      message: "Synced to MongoDB Atlas successfully!",
    };
  } catch (err: any) {
    console.warn("MongoDB sync error:", err);
    return {
      success: false,
      ordersSaved: 0,
      waitersSaved: 0,
      consumptionSaved: false,
      message: err.message || "Failed to sync to database",
    };
  }
}

export function resetDemoData() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("bgs-pos-menu");
    localStorage.removeItem("bgs-pos-tables");
    localStorage.removeItem("bgs-pos-orders");
    localStorage.removeItem("bgs-pos-waiters");
    localStorage.removeItem("bgs-pos-active-waiter");
    globalMenu = [...INITIAL_MENU];
    globalTables = [...INITIAL_TABLES];
    globalOrders = [...INITIAL_ORDERS];
    globalWaiters = [...INITIAL_WAITERS];
    activeWaiterId = "w2";
    saveStorage("bgs-pos-menu", globalMenu);
    saveStorage("bgs-pos-tables", globalTables);
    saveStorage("bgs-pos-orders", globalOrders);
    saveStorage("bgs-pos-waiters", globalWaiters);
    saveStorage("bgs-pos-active-waiter", activeWaiterId);
    notifyChange();
  }
}
