import { Request, Response } from "express";
import { getDbOrders, getDbWaiters } from "../services/dbService";

export async function getTodayReport(req: Request, res: Response) {
  try {
    const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);

    const orders = await getDbOrders(date);
    const waiters = await getDbWaiters();

    const paidOrders = orders.filter((o) => o.paymentStatus === "PAID");
    const activeOrders = orders.filter((o) => o.paymentStatus !== "PAID" && o.items.length > 0);

    // 1. Financial totals
    const totalSales = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalCost = paidOrders.reduce((sum, o) => sum + (o.totalCost || 0), 0);
    const netProfit = totalSales - totalCost;
    const profitMargin = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : "0.0";

    // 2. Money breakdown by channel
    const cashTotal = paidOrders
      .filter((o) => o.paymentChannel === "CASH")
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const qrTotal = paidOrders
      .filter((o) => o.paymentChannel === "ETHQR")
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const ussdTotal = paidOrders
      .filter((o) => o.paymentChannel === "USSD_PUSH")
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const cardTotal = paidOrders
      .filter((o) => o.paymentChannel === "CARD")
      .reduce((sum, o) => sum + o.totalAmount, 0);

    // 3. Item consumption
    const itemMap: Record<
      string,
      {
        menuItemId: string;
        name: string;
        quantity: number;
        unitPrice: number;
        unitCost: number;
        totalRevenue: number;
        totalCost: number;
        profit: number;
      }
    > = {};

    paidOrders.forEach((o) => {
      o.items.forEach((item) => {
        if (!itemMap[item.name]) {
          itemMap[item.name] = {
            menuItemId: item.menuItemId,
            name: item.name,
            quantity: 0,
            unitPrice: item.unitPrice,
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

    const itemConsumption = Object.values(itemMap).sort((a, b) => b.totalRevenue - a.totalRevenue);

    // 4. Waiter Leaderboard
    const waiterLeaderboard = waiters
      .map((w) => {
        const myOrders = paidOrders.filter((o) => o.waiterId === w.id || o.waiterName === w.name);
        const mySales = myOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const myCost = myOrders.reduce((sum, o) => sum + (o.totalCost || 0), 0);
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
      })
      .sort((a, b) => b.sales - a.sales);

    res.json({
      success: true,
      date,
      summary: {
        totalSales,
        totalCost,
        netProfit,
        profitMargin,
        paidOrdersCount: paidOrders.length,
        activeOrdersCount: activeOrders.length,
        avgTicket: paidOrders.length > 0 ? Math.round(totalSales / paidOrders.length) : 0,
      },
      moneyBreakdown: {
        cash: cashTotal,
        qr: qrTotal,
        ussd: ussdTotal,
        card: cardTotal,
      },
      waiterLeaderboard,
      topWaiter: waiterLeaderboard[0] || null,
      itemConsumption,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}
