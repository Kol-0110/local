import { getDatabase } from "../config/db";
import {
  OrderRecord,
  WaiterRecord,
  DailyConsumptionRecord,
  DailySalesRecord,
} from "../models/types";

// In-memory fallback if MongoDB is not configured or offline
let memoryOrders: OrderRecord[] = [];
let memoryWaiters: WaiterRecord[] = [
  { id: "w1", name: "Almaz K.", pin: "1234", avatar: "👩🏾‍🍳", phone: "+251 911 112233", role: "waiter", active: true },
  { id: "w2", name: "Dawit T.", pin: "2345", avatar: "👨🏾‍🍳", phone: "+251 911 223344", role: "head_waiter", active: true },
  { id: "w3", name: "Hana B.", pin: "3456", avatar: "👩🏾", phone: "+251 911 334455", role: "waiter", active: true },
  { id: "w4", name: "Abebe M.", pin: "4567", avatar: "👨🏾", phone: "+251 911 445566", role: "waiter", active: true },
];
let memoryConsumption: DailyConsumptionRecord[] = [];
let memoryDailySales: DailySalesRecord[] = [];

// ======================== ORDERS ========================

export async function getDbOrders(filterDate?: string): Promise<OrderRecord[]> {
  const db = await getDatabase();
  if (db) {
    try {
      const collection = db.collection<OrderRecord>("orders");
      const query: any = {};
      if (filterDate) {
        query.$or = [
          { createdAt: { $regex: `^${filterDate}` } },
          { paidAt: { $regex: `^${filterDate}` } },
        ];
      }
      const results = await collection.find(query).sort({ createdAt: -1 }).toArray();
      if (results.length > 0 || filterDate) return results;
    } catch (err) {
      console.warn("MongoDB query orders failed, using fallback:", err);
    }
  }

  // Fallback to memory
  if (filterDate) {
    return memoryOrders.filter(
      (o) =>
        (o.createdAt && o.createdAt.startsWith(filterDate)) ||
        (o.paidAt && o.paidAt.startsWith(filterDate))
    );
  }
  return memoryOrders;
}

export async function saveDbOrder(order: OrderRecord): Promise<OrderRecord> {
  const db = await getDatabase();
  if (db) {
    try {
      const collection = db.collection<OrderRecord>("orders");
      await collection.updateOne({ id: order.id }, { $set: order }, { upsert: true });
    } catch (err) {
      console.warn("MongoDB save order failed, saving to memory fallback:", err);
    }
  }

  const existingIdx = memoryOrders.findIndex((o) => o.id === order.id);
  if (existingIdx >= 0) {
    memoryOrders[existingIdx] = order;
  } else {
    memoryOrders.unshift(order);
  }

  // Automatically recalculate and save daily sales for this order's date
  const orderDate = (order.paidAt || order.createdAt || new Date().toISOString()).slice(0, 10);
  recalculateAndSaveDailySales(orderDate, "all").catch((err) =>
    console.warn("Auto recalculate daily sales failed:", err)
  );
  if (order.branchId && order.branchId !== "all") {
    recalculateAndSaveDailySales(orderDate, order.branchId).catch(() => {});
  }

  return order;
}

export async function bulkSaveDbOrders(orders: OrderRecord[]): Promise<number> {
  if (!orders || orders.length === 0) return 0;
  const db = await getDatabase();
  let count = 0;

  if (db) {
    try {
      const collection = db.collection<OrderRecord>("orders");
      const ops = orders.map((o) => ({
        updateOne: {
          filter: { id: o.id },
          update: { $set: o },
          upsert: true,
        },
      }));
      const res = await collection.bulkWrite(ops);
      count = (res.upsertedCount || 0) + (res.modifiedCount || 0) + (res.matchedCount || 0);
    } catch (err) {
      console.warn("MongoDB bulkSaveDbOrders failed, saving to memory:", err);
    }
  }

  orders.forEach((order) => {
    const idx = memoryOrders.findIndex((o) => o.id === order.id);
    if (idx >= 0) memoryOrders[idx] = order;
    else memoryOrders.unshift(order);
  });

  // Recalculate daily sales for all affected dates
  const dates = new Set<string>();
  orders.forEach((o) => {
    const d = (o.paidAt || o.createdAt || "").slice(0, 10);
    if (d) dates.add(d);
  });
  dates.forEach((d) => {
    recalculateAndSaveDailySales(d, "all").catch(() => {});
  });

  return count || orders.length;
}

// ======================== WAITERS & STAFF ========================

export async function getDbWaiters(): Promise<WaiterRecord[]> {
  const db = await getDatabase();
  if (db) {
    try {
      const collection = db.collection<WaiterRecord>("waiters");
      const results = await collection.find({}).toArray();
      if (results.length > 0) return results;
      // If collection is empty, seed initial waiters
      await collection.insertMany(memoryWaiters);
      return memoryWaiters;
    } catch (err) {
      console.warn("MongoDB query waiters failed, using memory:", err);
    }
  }
  return memoryWaiters;
}

export async function addDbWaiter(waiter: WaiterRecord): Promise<WaiterRecord> {
  const db = await getDatabase();
  if (db) {
    try {
      const collection = db.collection<WaiterRecord>("waiters");
      await collection.updateOne({ id: waiter.id }, { $set: waiter }, { upsert: true });
    } catch (err) {
      console.warn("MongoDB add waiter failed:", err);
    }
  }
  const idx = memoryWaiters.findIndex((w) => w.id === waiter.id);
  if (idx >= 0) memoryWaiters[idx] = waiter;
  else memoryWaiters.push(waiter);
  return waiter;
}

export async function bulkSaveDbWaiters(waiters: WaiterRecord[]): Promise<number> {
  if (!waiters || waiters.length === 0) return 0;
  const db = await getDatabase();
  let count = 0;

  if (db) {
    try {
      const collection = db.collection<WaiterRecord>("waiters");
      const ops = waiters.map((w) => ({
        updateOne: {
          filter: { id: w.id },
          update: { $set: w },
          upsert: true,
        },
      }));
      const res = await collection.bulkWrite(ops);
      count = (res.upsertedCount || 0) + (res.modifiedCount || 0) + (res.matchedCount || 0);
    } catch (err) {
      console.warn("MongoDB bulkSaveDbWaiters failed:", err);
    }
  }

  waiters.forEach((w) => {
    const idx = memoryWaiters.findIndex((item) => item.id === w.id);
    if (idx >= 0) memoryWaiters[idx] = w;
    else memoryWaiters.push(w);
  });

  return count || waiters.length;
}

// ======================== DAILY CONSUMPTION & PROFIT ========================

export async function saveDbConsumptionRecord(record: DailyConsumptionRecord): Promise<DailyConsumptionRecord> {
  const db = await getDatabase();
  if (db) {
    try {
      const collection = db.collection<DailyConsumptionRecord>("daily_consumption");
      await collection.updateOne(
        { date: record.date, branchId: record.branchId },
        { $set: record },
        { upsert: true }
      );
    } catch (err) {
      console.warn("MongoDB save consumption record failed:", err);
    }
  }

  const idx = memoryConsumption.findIndex((c) => c.date === record.date && c.branchId === record.branchId);
  if (idx >= 0) memoryConsumption[idx] = record;
  else memoryConsumption.unshift(record);

  return record;
}

export async function getDbConsumptionRecords(date?: string, branchId?: string): Promise<DailyConsumptionRecord[]> {
  const db = await getDatabase();
  if (db) {
    try {
      const collection = db.collection<DailyConsumptionRecord>("daily_consumption");
      const query: any = {};
      if (date) query.date = date;
      if (branchId && branchId !== "all") query.branchId = branchId;
      const results = await collection.find(query).sort({ date: -1 }).toArray();
      if (results.length > 0) return results;
    } catch (err) {
      console.warn("MongoDB get consumption failed:", err);
    }
  }

  if (date) {
    return memoryConsumption.filter((c) => c.date === date);
  }
  return memoryConsumption;
}

// ======================== DAILY SALES SAVED BY DATE ========================

export async function saveDbDailySales(record: DailySalesRecord): Promise<DailySalesRecord> {
  const now = new Date().toISOString();
  record.updatedAt = now;
  if (!record.createdAt) {
    record.createdAt = now;
  }

  const db = await getDatabase();
  if (db) {
    try {
      const collection = db.collection<DailySalesRecord>("daily_sales");
      await collection.createIndex({ date: 1, branchId: 1 }).catch(() => {});
      await collection.updateOne(
        { date: record.date, branchId: record.branchId },
        { $set: record },
        { upsert: true }
      );
    } catch (err) {
      console.warn("MongoDB save daily_sales failed, saving to memory fallback:", err);
    }
  }

  const idx = memoryDailySales.findIndex(
    (s) => s.date === record.date && s.branchId === record.branchId
  );
  if (idx >= 0) {
    memoryDailySales[idx] = record;
  } else {
    memoryDailySales.unshift(record);
  }

  return record;
}

export async function getDbDailySalesByDate(
  date: string,
  branchId = "all"
): Promise<DailySalesRecord | null> {
  const db = await getDatabase();
  if (db) {
    try {
      const collection = db.collection<DailySalesRecord>("daily_sales");
      const query: any = { date };
      if (branchId && branchId !== "all") {
        query.branchId = branchId;
      }
      const record = await collection.findOne(query);
      if (record) return record;
    } catch (err) {
      console.warn("MongoDB get daily_sales by date failed:", err);
    }
  }

  const mem = memoryDailySales.find(
    (s) => s.date === date && (branchId === "all" || s.branchId === branchId)
  );
  if (mem) return mem;

  // If not yet saved in daily_sales collection, recalculate and save it from orders
  try {
    return await recalculateAndSaveDailySales(date, branchId);
  } catch {
    return null;
  }
}

export async function getDbDailySalesList(filter?: {
  startDate?: string;
  endDate?: string;
  branchId?: string;
  limit?: number;
}): Promise<DailySalesRecord[]> {
  const db = await getDatabase();
  const limit = filter?.limit || 30;

  if (db) {
    try {
      const collection = db.collection<DailySalesRecord>("daily_sales");
      const query: any = {};
      if (filter?.branchId && filter.branchId !== "all") {
        query.branchId = filter.branchId;
      }
      if (filter?.startDate || filter?.endDate) {
        query.date = {};
        if (filter.startDate) query.date.$gte = filter.startDate;
        if (filter.endDate) query.date.$lte = filter.endDate;
      }
      const results = await collection
        .find(query)
        .sort({ date: -1 })
        .limit(limit)
        .toArray();
      if (results.length > 0) return results;
    } catch (err) {
      console.warn("MongoDB get daily_sales list failed:", err);
    }
  }

  let list = [...memoryDailySales];
  if (filter?.branchId && filter.branchId !== "all") {
    list = list.filter((s) => s.branchId === filter.branchId);
  }
  if (filter?.startDate) {
    list = list.filter((s) => s.date >= filter.startDate!);
  }
  if (filter?.endDate) {
    list = list.filter((s) => s.date <= filter.endDate!);
  }
  return list.sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
}

export async function recalculateAndSaveDailySales(
  date: string,
  branchId = "all"
): Promise<DailySalesRecord> {
  const allOrders = await getDbOrders(date);
  const waiters = await getDbWaiters();

  const relevantOrders =
    branchId === "all"
      ? allOrders
      : allOrders.filter((o) => o.branchId === branchId);

  const paidOrders = relevantOrders.filter((o) => o.paymentStatus === "PAID");
  const unpaidOrders = relevantOrders.filter((o) => o.paymentStatus !== "PAID");

  const totalSales = paidOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalCost = paidOrders.reduce((sum, o) => sum + (o.totalCost || 0), 0);
  const netProfit = totalSales - totalCost;
  const profitMargin =
    totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : "0.0";
  const avgTicket =
    paidOrders.length > 0 ? Math.round(totalSales / paidOrders.length) : 0;

  // Breakdown by channel
  const cash = paidOrders
    .filter((o) => o.paymentChannel === "CASH")
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const qr = paidOrders
    .filter((o) => o.paymentChannel === "ETHQR")
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const ussd = paidOrders
    .filter((o) => o.paymentChannel === "USSD_PUSH")
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const card = paidOrders
    .filter((o) => o.paymentChannel === "CARD")
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Item sales breakdown
  const itemMap: Record<
    string,
    {
      menuItemId?: string;
      name: string;
      category?: string;
      quantity: number;
      unitPrice: number;
      unitCost: number;
      totalRevenue: number;
      totalCost: number;
      profit: number;
      profitMargin?: string;
    }
  > = {};

  paidOrders.forEach((o) => {
    (o.items || []).forEach((item) => {
      if (!itemMap[item.name]) {
        itemMap[item.name] = {
          menuItemId: item.menuItemId,
          name: item.name,
          quantity: 0,
          unitPrice: item.unitPrice || 0,
          unitCost: item.unitCost || 0,
          totalRevenue: 0,
          totalCost: 0,
          profit: 0,
        };
      }
      itemMap[item.name].quantity += item.quantity;
      itemMap[item.name].totalRevenue += item.totalPrice;
      const c = (item.unitCost || 0) * item.quantity;
      itemMap[item.name].totalCost += c;
      itemMap[item.name].profit += item.totalPrice - c;
    });
  });

  const itemsSold = Object.values(itemMap)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .map((item) => ({
      ...item,
      profitMargin:
        item.totalRevenue > 0
          ? ((item.profit / item.totalRevenue) * 100).toFixed(0)
          : "0",
    }));

  // Waiter leaderboard
  const waiterPerformances = waiters
    .map((w) => {
      const myOrders = paidOrders.filter(
        (o) => o.waiterId === w.id || o.waiterName === w.name
      );
      const mySales = myOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const myCost = myOrders.reduce((sum, o) => sum + (o.totalCost || 0), 0);
      const myCash = myOrders
        .filter((o) => o.paymentChannel === "CASH")
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const myQr = myOrders
        .filter((o) => o.paymentChannel === "ETHQR")
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const myUssd = myOrders
        .filter((o) => o.paymentChannel === "USSD_PUSH")
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

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
        percentageOfTotal:
          totalSales > 0 ? ((mySales / totalSales) * 100).toFixed(1) : "0.0",
      };
    })
    .sort((a, b) => b.sales - a.sales);

  const now = new Date().toISOString();
  const salesRecord: DailySalesRecord = {
    id: `sales-${date}-${branchId}`,
    date,
    branchId,
    totalSales,
    totalCost,
    netProfit,
    profitMargin,
    totalOrders: relevantOrders.length,
    paidOrdersCount: paidOrders.length,
    unpaidOrdersCount: unpaidOrders.length,
    avgTicket,
    moneyBreakdown: {
      cash,
      qr,
      ussd,
      card,
    },
    itemsSold,
    waiterPerformances,
    createdAt: now,
    updatedAt: now,
  };

  await saveDbDailySales(salesRecord);

  // Keep daily_consumption synced as well
  const consumptionRecord: DailyConsumptionRecord = {
    id: `consumption-${date}`,
    date,
    branchId,
    totalSales,
    totalCost,
    netProfit,
    profitMargin,
    paidOrdersCount: paidOrders.length,
    moneyBreakdown: { cash, qr, ussd, card },
    itemsConsumed: itemsSold.map((i) => ({
      name: i.name,
      category: i.category,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      unitCost: i.unitCost,
      totalRevenue: i.totalRevenue,
      totalCost: i.totalCost,
      profit: i.profit,
      profitMargin: i.profitMargin || "0",
    })),
    waiterPerformances,
    savedAt: now,
  };
  await saveDbConsumptionRecord(consumptionRecord).catch(() => {});

  return salesRecord;
}

// ======================== FULL MONGODB SYNC ========================

export async function syncAllToMongo(data: {
  orders?: OrderRecord[];
  waiters?: WaiterRecord[];
  consumption?: DailyConsumptionRecord;
  dailySales?: DailySalesRecord;
}) {
  let ordersSaved = 0;
  let waitersSaved = 0;
  let consumptionSaved = false;
  let dailySalesSaved = false;

  if (data.orders && data.orders.length > 0) {
    ordersSaved = await bulkSaveDbOrders(data.orders);
  }

  if (data.waiters && data.waiters.length > 0) {
    waitersSaved = await bulkSaveDbWaiters(data.waiters);
  }

  if (data.consumption) {
    await saveDbConsumptionRecord(data.consumption);
    consumptionSaved = true;
  }

  if (data.dailySales) {
    await saveDbDailySales(data.dailySales);
    dailySalesSaved = true;
  }

  return {
    success: true,
    ordersSaved,
    waitersSaved,
    consumptionSaved,
    dailySalesSaved,
    timestamp: new Date().toISOString(),
  };
}
