import { getDatabase } from "../config/db";
import { OrderRecord, WaiterRecord, DailyConsumptionRecord } from "../models/types";

// In-memory fallback if MongoDB is not configured or offline
let memoryOrders: OrderRecord[] = [];
let memoryWaiters: WaiterRecord[] = [
  { id: "w1", name: "Almaz K.", pin: "1234", avatar: "👩🏾‍🍳", phone: "+251 911 112233", role: "waiter", active: true },
  { id: "w2", name: "Dawit T.", pin: "2345", avatar: "👨🏾‍🍳", phone: "+251 911 223344", role: "head_waiter", active: true },
  { id: "w3", name: "Hana B.", pin: "3456", avatar: "👩🏾", phone: "+251 911 334455", role: "waiter", active: true },
  { id: "w4", name: "Abebe M.", pin: "4567", avatar: "👨🏾", phone: "+251 911 445566", role: "waiter", active: true },
];
let memoryConsumption: DailyConsumptionRecord[] = [];

// ======================== ORDERS ========================

export async function getDbOrders(filterDate?: string): Promise<OrderRecord[]> {
  const db = await getDatabase();
  if (db) {
    try {
      const collection = db.collection<OrderRecord>("orders");
      const query: any = {};
      if (filterDate) {
        const start = new Date(`${filterDate}T00:00:00.000Z`).toISOString();
        const end = new Date(`${filterDate}T23:59:59.999Z`).toISOString();
        query.createdAt = { $gte: start, $lte: end };
      }
      const results = await collection.find(query).sort({ createdAt: -1 }).toArray();
      if (results.length > 0) return results;
    } catch (err) {
      console.warn("MongoDB query orders failed, using fallback:", err);
    }
  }

  // Fallback to memory
  if (filterDate) {
    return memoryOrders.filter((o) => o.createdAt.startsWith(filterDate));
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

// ======================== FULL MONGODB SYNC ========================

export async function syncAllToMongo(data: {
  orders?: OrderRecord[];
  waiters?: WaiterRecord[];
  consumption?: DailyConsumptionRecord;
}) {
  let ordersSaved = 0;
  let waitersSaved = 0;
  let consumptionSaved = false;

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

  return {
    success: true,
    ordersSaved,
    waitersSaved,
    consumptionSaved,
    timestamp: new Date().toISOString(),
  };
}
