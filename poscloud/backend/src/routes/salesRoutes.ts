import { Router } from "express";
import {
  getDailySales,
  getDailySalesByDateParam,
  saveDailySales,
  recalculateDailySales,
} from "../controllers/salesController";

const router = Router();

// /api/sales/daily
router.get("/daily", getDailySales);
router.post("/daily", saveDailySales);
router.post("/daily/recalculate", recalculateDailySales);
router.get("/daily/:date", getDailySalesByDateParam);

export default router;

