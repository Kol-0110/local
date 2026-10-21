import { Request, Response } from "express";
import { getDbWaiters, addDbWaiter, getDbOrders } from "../services/dbService";
import { WaiterRecord } from "../models/types";

export async function getWaiters(req: Request, res: Response) {
  try {
    const today = (req.query.date as string) || new Date().toISOString().slice(0, 10);

    const waiters = await getDbWaiters();
    const orders = await getDbOrders(today);
    const paidOrders = orders.filter((o) => o.paymentStatus === "PAID");

    // Aggregate stats per waiter
    const waiterStats = waiters.map((w) => {
      const myPaidOrders = paidOrders.filter((o) => o.waiterId === w.id || o.waiterName === w.name);
      const totalSales = myPaidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const totalCost = myPaidOrders.reduce((sum, o) => sum + (o.totalCost || 0), 0);
      const netProfit = totalSales - totalCost;
      const ordersCount = myPaidOrders.length;
      const cashSales = myPaidOrders.filter((o) => o.paymentChannel === "CASH").reduce((sum, o) => sum + o.totalAmount, 0);
      const qrSales = myPaidOrders.filter((o) => o.paymentChannel === "ETHQR").reduce((sum, o) => sum + o.totalAmount, 0);
      const ussdSales = myPaidOrders.filter((o) => o.paymentChannel === "USSD_PUSH").reduce((sum, o) => sum + o.totalAmount, 0);

      return {
        ...w,
        todaySales: totalSales,
        todayCost: totalCost,
        todayProfit: netProfit,
        ordersCount,
        cashSales,
        qrSales,
        ussdSales,
        avgTicket: ordersCount > 0 ? Math.round(totalSales / ordersCount) : 0,
      };
    });

    // Sort descending by today's sales
    waiterStats.sort((a, b) => b.todaySales - a.todaySales);

    res.json({ success: true, waiters: waiterStats });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function createWaiter(req: Request, res: Response) {
  try {
    const body = req.body as WaiterRecord;
    if (!body || !body.name) {
      res.status(400).json({ success: false, error: "Waiter name is required" });
      return;
    }

    const newWaiter: WaiterRecord = {
      id: body.id || `w_${Date.now()}`,
      name: body.name,
      pin: body.pin || "0000",
      avatar: body.avatar || "👤",
      phone: body.phone,
      role: body.role || "waiter",
      active: true,
    };

    const saved = await addDbWaiter(newWaiter);
    res.json({ success: true, waiter: saved });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}
