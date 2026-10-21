import { Request, Response } from "express";
import { getDbOrders, saveDbOrder, bulkSaveDbOrders } from "../services/dbService";
import { OrderRecord } from "../models/types";

export async function getOrders(req: Request, res: Response) {
  try {
    const date = req.query.date as string | undefined;
    const waiterId = req.query.waiterId as string | undefined;

    let orders = await getDbOrders(date || undefined);

    if (waiterId) {
      orders = orders.filter((o) => o.waiterId === waiterId);
    }

    res.json({ success: true, count: orders.length, orders });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function createOrder(req: Request, res: Response) {
  try {
    // Support bulk sync
    if (Array.isArray(req.body)) {
      const count = await bulkSaveDbOrders(req.body);
      res.json({ success: true, count, message: `${count} orders saved to database` });
      return;
    }

    const body = req.body as OrderRecord;
    if (!body || !body.id) {
      res.status(400).json({ success: false, error: "Invalid order data" });
      return;
    }

    const saved = await saveDbOrder(body);
    res.json({ success: true, order: saved });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}
