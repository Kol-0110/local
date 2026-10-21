import { Request, Response } from "express";
import {
  saveDbConsumptionRecord,
  getDbConsumptionRecords,
  syncAllToMongo,
} from "../services/dbService";
import { DailyConsumptionRecord } from "../models/types";

export async function getConsumption(req: Request, res: Response) {
  try {
    const date = req.query.date as string | undefined;
    const branchId = req.query.branchId as string | undefined;

    const records = await getDbConsumptionRecords(date, branchId);
    res.json({ success: true, count: records.length, records });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function saveConsumption(req: Request, res: Response) {
  try {
    const body = req.body as DailyConsumptionRecord;
    if (!body || !body.date) {
      res.status(400).json({ success: false, error: "Consumption date is required" });
      return;
    }

    const saved = await saveDbConsumptionRecord(body);
    res.json({ success: true, record: saved });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function syncAll(req: Request, res: Response) {
  try {
    const { orders, waiters, consumption } = req.body;
    const result = await syncAllToMongo({ orders, waiters, consumption });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}
