import { Request, Response } from "express";
import {
  saveDbDailySales,
  getDbDailySalesByDate,
  getDbDailySalesList,
  recalculateAndSaveDailySales,
} from "../services/dbService";
import { DailySalesRecord } from "../models/types";

/**
 * GET /api/sales/daily
 * Supports query params:
 * - date (e.g. 2026-11-02) -> returns single record
 * - startDate / endDate -> date range filter
 * - branchId -> e.g. "bole" or "all"
 * - limit -> number of days (default 30)
 */
export async function getDailySales(req: Request, res: Response) {
  try {
    const date = req.query.date as string | undefined;
    const branchId = (req.query.branchId as string) || "all";
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

    if (date) {
      const record = await getDbDailySalesByDate(date, branchId);
      if (!record) {
        res.status(404).json({ success: false, message: `No sales record found for date ${date}` });
        return;
      }
      res.json({ success: true, record });
      return;
    }

    const records = await getDbDailySalesList({
      startDate,
      endDate,
      branchId,
      limit,
    });

    res.json({ success: true, count: records.length, records });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * GET /api/sales/daily/:date
 * Returns daily sales record for the specified date
 */
export async function getDailySalesByDateParam(req: Request, res: Response) {
  try {
    const date = req.params.date as string;
    const branchId = (req.query.branchId as string) || "all";

    if (!date) {
      res.status(400).json({ success: false, error: "Date parameter is required (YYYY-MM-DD)" });
      return;
    }

    const record = await getDbDailySalesByDate(date, branchId);
    if (!record) {
      res.status(404).json({ success: false, message: `No sales record found for date ${date}` });
      return;
    }

    res.json({ success: true, record });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * POST /api/sales/daily
 * Saves or updates a daily sales record explicitly in the database
 */
export async function saveDailySales(req: Request, res: Response) {
  try {
    const body = req.body as DailySalesRecord;
    if (!body || !body.date) {
      res.status(400).json({ success: false, error: "Daily sales date is required (YYYY-MM-DD)" });
      return;
    }

    const record = await saveDbDailySales(body);
    res.json({
      success: true,
      message: `Daily sales for ${body.date} saved to database`,
      record,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * POST /api/sales/daily/recalculate
 * Re-aggregates all paid orders for the date and updates daily_sales in database
 */
export async function recalculateDailySales(req: Request, res: Response) {
  try {
    const date =
      req.body.date ||
      (req.query.date as string) ||
      new Date().toISOString().slice(0, 10);
    const branchId = req.body.branchId || (req.query.branchId as string) || "all";

    const record = await recalculateAndSaveDailySales(date, branchId);
    res.json({
      success: true,
      message: `Daily sales recalculated and saved for date ${date}`,
      record,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}
